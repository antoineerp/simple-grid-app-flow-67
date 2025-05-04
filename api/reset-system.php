
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DÉBUT DE L'EXÉCUTION DE reset-system.php ===");

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Vérifier que la méthode est bien POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode HTTP non autorisée']);
    exit;
}

// Inclure les fichiers nécessaires
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/ResponseHandler.php';
require_once __DIR__ . '/models/User.php';
require_once __DIR__ . '/operations/UserOperations.php';

try {
    // Récupérer et vérifier les données reçues
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Vérifier la confirmation de réinitialisation
    if (!isset($data['confirm']) || $data['confirm'] !== 'RESET_ALL_CONFIRM') {
        throw new Exception("Code de confirmation invalide. La réinitialisation nécessite une confirmation explicite.");
    }
    
    // Vérifier l'email de l'administrateur
    if (!isset($data['admin_email']) || empty($data['admin_email'])) {
        throw new Exception("Email de l'administrateur non spécifié");
    }
    
    $adminEmail = $data['admin_email'];
    error_log("Réinitialisation du système demandée avec admin: {$adminEmail}");
    
    // Connexion à la base de données
    $database = new Database();
    $db = $database->getConnection(true);
    
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données");
    }
    
    // ÉTAPE 1: Récupérer la liste des utilisateurs actuels (pour supprimer leurs tables)
    $userModel = new User($db);
    $query = "SELECT identifiant_technique, email FROM utilisateurs";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("Utilisateurs existants: " . count($users));
    
    // Tableaux pour stocker les résultats
    $tablesDeleted = [];
    $errors = [];
    
    // ÉTAPE 2: Supprimer les tables pour chaque utilisateur
    foreach ($users as $user) {
        if (!empty($user['identifiant_technique'])) {
            $userId = $user['identifiant_technique'];
            error_log("Suppression des tables pour l'utilisateur: {$userId}");
            
            // Liste des préfixes de tables à supprimer
            $tablePrefixes = [
                'documents_',
                'membres_',
                'exigences_',
                'bibliotheque_',
                'collaboration_',
                'collaboration_groups_',
                'pilotage_'
            ];
            
            // Récupérer toutes les tables de la base de données
            $tableQuery = "SHOW TABLES";
            $tableStmt = $db->query($tableQuery);
            $allTables = $tableStmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Identifier et supprimer les tables de l'utilisateur
            foreach ($allTables as $table) {
                foreach ($tablePrefixes as $prefix) {
                    $userPrefix = $prefix . $userId;
                    if (strpos($table, $userPrefix) === 0) {
                        try {
                            $db->exec("DROP TABLE `{$table}`");
                            $tablesDeleted[] = $table;
                            error_log("Table supprimée: {$table}");
                        } catch (PDOException $e) {
                            $errorMsg = "Erreur lors de la suppression de la table {$table}: " . $e->getMessage();
                            error_log($errorMsg);
                            $errors[] = $errorMsg;
                        }
                        break;
                    }
                }
            }
        }
    }
    
    // ÉTAPE 3: Supprimer tous les utilisateurs de la base de données
    try {
        $db->exec("DELETE FROM utilisateurs");
        error_log("Tous les utilisateurs ont été supprimés");
    } catch (PDOException $e) {
        $errorMsg = "Erreur lors de la suppression des utilisateurs: " . $e->getMessage();
        error_log($errorMsg);
        $errors[] = $errorMsg;
        // Continuer malgré l'erreur
    }
    
    // ÉTAPE 4: Créer un nouvel administrateur
    $uuid = generate_uuid();
    $identifiantTechnique = 'p71x6d_administrator_' . time();
    $hashedPassword = password_hash('admin123', PASSWORD_DEFAULT);
    
    $createAdminQuery = "INSERT INTO utilisateurs (id, nom, prenom, email, mot_de_passe, identifiant_technique, role, date_creation) 
                         VALUES (?, 'Administrateur', 'Système', ?, ?, ?, 'admin', NOW())";
    
    $stmt = $db->prepare($createAdminQuery);
    $stmt->execute([$uuid, $adminEmail, $hashedPassword, $identifiantTechnique]);
    $newAdminId = $db->lastInsertId();
    
    error_log("Nouvel administrateur créé avec ID: {$newAdminId}, identifiant: {$identifiantTechnique}");
    
    // ÉTAPE 5: Créer les tables pour le nouvel administrateur
    $tablesCreated = UserOperations::initializeUserTables($db, $identifiantTechnique);
    error_log("Tables initialisées pour le nouvel administrateur: {$tablesCreated}");
    
    // Forcer la création/mise à jour des tables supplémentaires via db-update
    try {
        $ch = curl_init();
        $updateUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https://" : "http://") . 
                     $_SERVER['HTTP_HOST'] . 
                     dirname($_SERVER['REQUEST_URI']) . 
                     "/db-update.php?userId={$identifiantTechnique}";
        
        curl_setopt($ch, CURLOPT_URL, $updateUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $updateResult = curl_exec($ch);
        $updateInfo = curl_getinfo($ch);
        
        if ($updateInfo['http_code'] == 200) {
            error_log("Mise à jour des tables réussie via db-update: " . $updateResult);
        } else {
            error_log("Échec de la mise à jour des tables via db-update. HTTP code: " . $updateInfo['http_code']);
            error_log("Réponse: " . $updateResult);
        }
        
        curl_close($ch);
    } catch (Exception $e) {
        error_log("Erreur lors de l'appel à db-update: " . $e->getMessage());
    }
    
    // Préparer la réponse
    $response = [
        'success' => true,
        'message' => 'Système réinitialisé avec succès',
        'details' => [
            'tablesDeleted' => count($tablesDeleted),
            'deletedTables' => $tablesDeleted,
            'tablesCreated' => $tablesCreated,
            'newUser' => [
                'id' => $newAdminId,
                'identifiant_technique' => $identifiantTechnique,
                'email' => $adminEmail
            ]
        ]
    ];
    
    if (!empty($errors)) {
        $response['warnings'] = $errors;
    }
    
    // Renvoyer la réponse
    echo json_encode($response);
    error_log("=== FIN DE L'EXÉCUTION DE reset-system.php - SUCCÈS ===");
    
} catch (Exception $e) {
    error_log("Erreur lors de la réinitialisation du système: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la réinitialisation du système: ' . $e->getMessage()
    ]);
}

/**
 * Génère un UUID v4
 */
function generate_uuid() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
?>
