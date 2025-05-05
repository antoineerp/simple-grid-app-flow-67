
<?php
// Force output buffering to prevent output before headers
ob_start();

// Fichier pour synchroniser les exigences avec le serveur
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE exigences-sync.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Configuration de la base de données
$host = "p71x6d.myd.infomaniak.com";
$dbname = "p71x6d_system";
$username = "p71x6d_system";
$password = "Trottinette43!";

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Récupérer les données POST JSON
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$json || !$data) {
        throw new Exception("Aucune donnée reçue ou format JSON invalide");
    }
    
    error_log("Données reçues pour synchronisation des exigences");
    
    // Vérifier si les données nécessaires sont présentes
    if (!isset($data['userId']) || !isset($data['exigences']) || !isset($data['groups'])) {
        throw new Exception("Données incomplètes. 'userId', 'exigences' et 'groups' sont requis");
    }
    
    $userId = $data['userId'];
    $exigences = $data['exigences'];
    $groups = $data['groups'];
    
    error_log("Synchronisation pour l'utilisateur: {$userId}");
    error_log("Nombre d'exigences: " . count($exigences) . ", Nombre de groupes: " . count($groups));
    
    // Connexion à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Nom des tables spécifiques à l'utilisateur
    $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    $exigencesTableName = "exigences_" . $safeUserId;
    $groupsTableName = "exigence_groups_" . $safeUserId;
    error_log("Tables à utiliser: {$exigencesTableName}, {$groupsTableName}");
    
    // Créer les tables si elles n'existent pas
    
    // Table des exigences
    $createExigencesTableQuery = "CREATE TABLE IF NOT EXISTS `{$exigencesTableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `nom` VARCHAR(255) NOT NULL,
        `responsabilites` TEXT,
        `exclusion` TINYINT(1) DEFAULT 0,
        `atteinte` VARCHAR(5),
        `groupId` VARCHAR(36),
        `userId` VARCHAR(50) NOT NULL,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    error_log("Création de la table des exigences si nécessaire");
    $pdo->exec($createExigencesTableQuery);
    
    // Table des groupes
    $createGroupsTableQuery = "CREATE TABLE IF NOT EXISTS `{$groupsTableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `name` VARCHAR(255) NOT NULL,
        `expanded` TINYINT(1) DEFAULT 1,
        `userId` VARCHAR(50) NOT NULL,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    error_log("Création de la table des groupes si nécessaire");
    $pdo->exec($createGroupsTableQuery);
    
    // Démarrer une transaction
    error_log("Début de la transaction");
    $pdo->beginTransaction();
    $transaction_active = true;
    
    try {
        // Supprimer les enregistrements existants pour cet userId
        $pdo->prepare("DELETE FROM `{$exigencesTableName}` WHERE userId = ?")->execute([$userId]);
        error_log("Suppression des exigences existantes pour {$userId}");
        
        $pdo->prepare("DELETE FROM `{$groupsTableName}` WHERE userId = ?")->execute([$userId]);
        error_log("Suppression des groupes existants pour {$userId}");
        
        // Insérer les groupes
        if (count($groups) > 0) {
            $insertGroupQuery = "INSERT INTO `{$groupsTableName}` (id, name, expanded, userId) VALUES (:id, :name, :expanded, :userId)";
            $stmtGroup = $pdo->prepare($insertGroupQuery);
            
            foreach ($groups as $group) {
                $stmtGroup->execute([
                    'id' => $group['id'],
                    'name' => $group['name'],
                    'expanded' => $group['expanded'] ? 1 : 0,
                    'userId' => $userId
                ]);
            }
            error_log("Groupes insérés: " . count($groups));
        }
        
        // Insérer les exigences
        if (count($exigences) > 0) {
            $insertExigenceQuery = "INSERT INTO `{$exigencesTableName}` 
                (id, nom, responsabilites, exclusion, atteinte, groupId, userId, date_creation) 
                VALUES (:id, :nom, :responsabilites, :exclusion, :atteinte, :groupId, :userId, :date_creation)";
            $stmtExigence = $pdo->prepare($insertExigenceQuery);
            
            foreach ($exigences as $exigence) {
                // Préparer les données de l'exigence
                $responsabilitesJson = isset($exigence['responsabilites']) ? 
                    json_encode($exigence['responsabilites']) : 
                    json_encode(['r' => [], 'a' => [], 'c' => [], 'i' => []]);
                
                // Convertir la date au format SQL si nécessaire
                if (isset($exigence['date_creation']) && is_string($exigence['date_creation'])) {
                    $dateCreation = date('Y-m-d H:i:s', strtotime($exigence['date_creation']));
                } else {
                    $dateCreation = date('Y-m-d H:i:s');
                }
                
                $stmtExigence->execute([
                    'id' => $exigence['id'],
                    'nom' => $exigence['nom'],
                    'responsabilites' => $responsabilitesJson,
                    'exclusion' => $exigence['exclusion'] ? 1 : 0,
                    'atteinte' => $exigence['atteinte'],
                    'groupId' => $exigence['groupId'] ?? null,
                    'userId' => $userId,
                    'date_creation' => $dateCreation
                ]);
            }
            error_log("Exigences insérées: " . count($exigences));
        }
        
        // Valider la transaction
        if ($transaction_active && $pdo->inTransaction()) {
            $pdo->commit();
            $transaction_active = false;
            error_log("Transaction validée");
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Synchronisation réussie',
            'count' => [
                'exigences' => count($exigences),
                'groups' => count($groups)
            ]
        ]);
        
    } catch (Exception $e) {
        // Annuler la transaction en cas d'erreur
        if ($transaction_active && $pdo->inTransaction()) {
            $pdo->rollBack();
            $transaction_active = false;
            error_log("Transaction annulée suite à une erreur");
        }
        throw $e;
    }
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans exigences-sync.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Exception dans exigences-sync.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    // S'assurer que la transaction est terminée si elle est encore active
    if (isset($pdo) && isset($transaction_active) && $transaction_active && $pdo->inTransaction()) {
        try {
            error_log("Annulation de la transaction qui était encore active dans le bloc finally");
            $pdo->rollBack();
        } catch (Exception $e) {
            error_log("Erreur lors du rollback final: " . $e->getMessage());
        }
    }
    
    error_log("=== FIN DE L'EXÉCUTION DE exigences-sync.php ===");
    if (ob_get_level()) ob_end_flush();
}
