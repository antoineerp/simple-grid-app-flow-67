
<?php
// Force output buffering to prevent output before headers
ob_start();

// Initialiser la gestion de synchronisation
require_once 'services/DataSyncService.php';
require_once 'services/RequestHandler.php';

// Nom de la table à synchroniser
$tableName = 'documents';

// Créer le service de synchronisation
$service = new DataSyncService($tableName);

// Définir les en-têtes standard
RequestHandler::setStandardHeaders("GET, OPTIONS");
RequestHandler::handleOptionsRequest();

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. Utilisez GET.']);
    exit;
}

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Vérifier si l'userId est présent (accepter aussi le paramètre 'user' pour compatibilité)
    $userId = null;
    if (isset($_GET['userId'])) {
        $userId = $_GET['userId'];
    } else if (isset($_GET['user'])) {
        $userId = $_GET['user'];
    }
    
    if (!$userId) {
        throw new Exception("ID utilisateur manquant");
    }
    
    $userId = RequestHandler::sanitizeUserId($userId);
    
    // Récupérer l'ID de l'appareil s'il est fourni
    $deviceId = isset($_GET['deviceId']) ? $_GET['deviceId'] : 'unknown';
    
    error_log("Chargement des documents pour l'utilisateur: {$userId} depuis l'appareil: {$deviceId}");
    
    // Connexion à la base de données
    if (!$service->connectToDatabase()) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    // Nom de la table spécifique à l'utilisateur
    $userTableName = "{$tableName}_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    error_log("Table à consulter: {$userTableName}");
    
    // Obtenir une référence PDO
    $pdo = $service->getPdo();
    
    // Vérifier si la table existe
    $tableExists = false;
    
    // Utiliser information_schema pour vérifier l'existence de la table
    $dbName = $pdo->query("SELECT DATABASE()")->fetchColumn();
    $tableExistsQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?";
    $stmt = $pdo->prepare($tableExistsQuery);
    
    // Vérifier la table
    $stmt->execute([$dbName, $userTableName]);
    $tableExists = (int)$stmt->fetchColumn() > 0;
    
    // Enregistrer cette requête de chargement
    try {
        // Créer la table d'historique si elle n'existe pas
        $pdo->exec("CREATE TABLE IF NOT EXISTS `sync_history` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `table_name` VARCHAR(100) NOT NULL,
            `user_id` VARCHAR(50) NOT NULL,
            `device_id` VARCHAR(100) NOT NULL,
            `record_count` INT NOT NULL,
            `operation` VARCHAR(50) DEFAULT 'sync',
            `sync_timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_user_device` (`user_id`, `device_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        
        // Insérer l'enregistrement de chargement
        $stmt = $pdo->prepare("INSERT INTO `sync_history` 
                              (table_name, user_id, device_id, record_count, operation, sync_timestamp) 
                              VALUES (?, ?, ?, 0, 'load', NOW())");
        $stmt->execute([$tableName, $userId, $deviceId]);
    } catch (Exception $e) {
        // Continuer même si l'enregistrement échoue
        error_log("Erreur lors de l'enregistrement de l'historique de chargement: " . $e->getMessage());
    }
    
    // Initialiser les résultats
    $documents = [];
    
    // Récupérer les données si la table existe
    if ($tableExists) {
        $query = "SELECT * FROM `{$userTableName}` WHERE userId = ? ORDER BY id";
        error_log("Exécution de la requête: {$query}");
        $stmt = $pdo->prepare($query);
        $stmt->execute([$userId]);
        $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Formater les données pour le client si nécessaire
        foreach ($documents as &$document) {
            // Convertir les dates
            if (isset($document['date_creation']) && $document['date_creation']) {
                $document['date_creation'] = date('Y-m-d\TH:i:s', strtotime($document['date_creation']));
            }
            if (isset($document['date_modification']) && $document['date_modification']) {
                $document['date_modification'] = date('Y-m-d\TH:i:s', strtotime($document['date_modification']));
            }
            
            // S'assurer que chaque document a un userId
            if (!isset($document['userId'])) {
                $document['userId'] = $userId;
            }
        }
    } else {
        // Créer la table si elle n'existe pas
        $createTableSQL = "CREATE TABLE IF NOT EXISTS `{$userTableName}` (
            `id` VARCHAR(36) PRIMARY KEY,
            `nom` VARCHAR(255) NOT NULL,
            `fichier_path` VARCHAR(255) NULL,
            `responsabilites` TEXT NULL,
            `etat` VARCHAR(50) NULL,
            `groupId` VARCHAR(36) NULL,
            `userId` VARCHAR(50) NOT NULL,
            `last_sync_device` VARCHAR(100) NULL,
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        $pdo->exec($createTableSQL);
        error_log("Table {$userTableName} créée");
    }
    
    error_log("Documents récupérés: " . count($documents));
    
    echo json_encode([
        'success' => true,
        'documents' => $documents,
        'count' => count($documents),
        'timestamp' => date('c'),
        'deviceId' => $deviceId
    ]);
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans {$tableName}-load.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Exception dans {$tableName}-load.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($service)) {
        $service->finalize();
    }
    
    error_log("=== FIN DE L'EXÉCUTION DE {$tableName}-load.php ===");
    if (ob_get_level()) ob_end_flush();
}
