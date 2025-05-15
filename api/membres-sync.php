
<?php
// Force output buffering to prevent output before headers
ob_start();

// Fichier pour gérer la synchronisation des données membres
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Journalisation
error_log("API membres-sync.php - Méthode: " . $_SERVER['REQUEST_METHOD']);

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
    
    error_log("Données de synchronisation reçues: " . substr(json_encode($data), 0, 500) . "...");
    
    // Vérifier si les données nécessaires sont présentes
    if (!isset($data['userId']) || !isset($data['membres'])) {
        throw new Exception("Données incomplètes. 'userId' et 'membres' sont requis");
    }
    
    $userId = $data['userId'];
    $membres = $data['membres'];
    
    // Connexion à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Vérifier si la table de synchronisation existe
    $tableName = "membres_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    
    // Créer la table si elle n'existe pas
    $pdo->exec("CREATE TABLE IF NOT EXISTS `{$tableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `nom` VARCHAR(100) NOT NULL,
        `prenom` VARCHAR(100) NOT NULL,
        `fonction` VARCHAR(100),
        `initiales` VARCHAR(10),
        `mot_de_passe` VARCHAR(255),
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    
    // Commencer une transaction
    $pdo->beginTransaction();
    
    try {
        // Vider la table avant d'insérer les données actualisées
        $pdo->exec("TRUNCATE TABLE `{$tableName}`");
        
        // Préparer la requête d'insertion
        $stmt = $pdo->prepare("INSERT INTO `{$tableName}` 
            (id, nom, prenom, fonction, initiales, mot_de_passe, date_creation)
            VALUES (:id, :nom, :prenom, :fonction, :initiales, :mot_de_passe, :date_creation)");
        
        // Insérer chaque membre
        foreach ($membres as $membre) {
            // S'assurer que l'id existe
            if (!isset($membre['id']) || empty($membre['id'])) {
                continue; // Sauter cet enregistrement
            }
            
            // Convertir la date au format SQL si nécessaire
            if (isset($membre['date_creation']) && is_string($membre['date_creation'])) {
                $dateCreation = $membre['date_creation'];
            } elseif (isset($membre['date_creation']) && isset($membre['date_creation']['seconds'])) {
                // Format timestamp
                $dateCreation = date('Y-m-d H:i:s', $membre['date_creation']['seconds']);
            } else {
                // Date actuelle par défaut
                $dateCreation = date('Y-m-d H:i:s');
            }
            
            // Exécuter l'insertion
            $stmt->execute([
                'id' => $membre['id'],
                'nom' => $membre['nom'] ?? '',
                'prenom' => $membre['prenom'] ?? '',
                'fonction' => $membre['fonction'] ?? '',
                'initiales' => $membre['initiales'] ?? '',
                'mot_de_passe' => $membre['mot_de_passe'] ?? '',
                'date_creation' => $dateCreation
            ]);
        }
        
        // Valider la transaction
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Synchronisation des membres réussie',
            'count' => count($membres)
        ]);
        
    } catch (Exception $e) {
        // Annuler la transaction en cas d'erreur
        $pdo->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans membres-sync.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Exception dans membres-sync.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (ob_get_level()) ob_end_flush();
}
?>
