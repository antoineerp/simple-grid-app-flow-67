
<?php
require_once 'services/DataSyncService.php';

// Définir les en-têtes pour éviter les problèmes CORS
header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), terminer
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Activer la journalisation des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0); // Ne pas afficher les erreurs directement
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.txt');

// Initialiser le service
$service = new DataSyncService('membres');

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. Utilisez POST.']);
    exit;
}

try {
    // Récupérer les données POST
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$json || !$data) {
        throw new Exception("Aucune donnée reçue ou format JSON invalide");
    }
    
    if (!isset($data['userId']) || !isset($data['membres'])) {
        throw new Exception("Données incomplètes. 'userId' et 'membres' sont requis");
    }
    
    // Connecter à la base de données
    if (!$service->connectToDatabase()) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    $userId = $service->sanitizeUserId($data['userId']);
    $membres = $data['membres'];
    $deviceId = isset($data['deviceId']) ? $data['deviceId'] : 'unknown';
    
    // Journaliser les informations de synchronisation
    error_log("Synchronisation des membres - UserId: {$userId}, DeviceId: {$deviceId}, Nombre: " . count($membres));
    
    // Créer la table de synchronisation si elle n'existe pas
    try {
        $pdo = $service->getPdo();
        $query = "CREATE TABLE IF NOT EXISTS `sync_history` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `table_name` VARCHAR(100) NOT NULL,
            `user_id` VARCHAR(50) NOT NULL,
            `device_id` VARCHAR(100) NOT NULL,
            `record_count` INT NOT NULL,
            `sync_timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_user_device` (`user_id`, `device_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        if ($pdo) {
            $pdo->query($query);
            
            // Insérer l'enregistrement de synchronisation
            $stmt = $pdo->prepare("INSERT INTO `sync_history` 
                         (table_name, user_id, device_id, record_count, sync_timestamp) 
                         VALUES (?, ?, ?, ?, NOW())");
            $stmt->execute(['membres', $userId, $deviceId, count($membres)]);
        }
    } catch (Exception $e) {
        // Journaliser mais continuer
        error_log("Erreur lors de l'enregistrement de l'historique: " . $e->getMessage());
    }
    
    // Schéma de la table membres
    $schema = "CREATE TABLE IF NOT EXISTS `membres_{$userId}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `nom` VARCHAR(100) NOT NULL,
        `prenom` VARCHAR(100) NOT NULL,
        `email` VARCHAR(255) NULL,
        `telephone` VARCHAR(20) NULL,
        `fonction` VARCHAR(100) NULL,
        `organisation` VARCHAR(255) NULL,
        `notes` TEXT NULL,
        `initiales` VARCHAR(10) NULL,
        `userId` VARCHAR(50) NOT NULL,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        `last_sync_device` VARCHAR(100) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    // Créer la table si nécessaire
    if (!$service->ensureTableExists($schema)) {
        throw new Exception("Impossible de créer ou vérifier la table");
    }
    
    // Vérifier si la colonne last_sync_device existe
    try {
        $columnsResult = $service->query("SHOW COLUMNS FROM `membres_{$userId}` LIKE 'last_sync_device'");
        if ($columnsResult->rowCount() === 0) {
            // Ajouter la colonne
            $pdo = $service->getPdo();
            $pdo->query("ALTER TABLE `membres_{$userId}` ADD COLUMN `last_sync_device` VARCHAR(100) NULL");
        }
    } catch (Exception $e) {
        error_log("Erreur lors de la vérification/ajout de la colonne: " . $e->getMessage());
    }
    
    // Démarrer une transaction
    $service->beginTransaction();
    
    try {
        // Synchroniser les données
        $service->syncData($membres);
        
        // Valider la transaction
        $service->commitTransaction();
        
        // Réponse réussie
        echo json_encode([
            'success' => true,
            'message' => 'Synchronisation des membres réussie',
            'count' => count($membres),
            'deviceId' => $deviceId
        ]);
        
    } catch (Exception $innerEx) {
        // Annuler la transaction en cas d'erreur
        $service->rollbackTransaction();
        throw $innerEx;
    }
    
} catch (Exception $e) {
    error_log("Erreur dans membres-sync.php: " . $e->getMessage());
    
    // S'assurer que tout buffer de sortie est nettoyé
    if (ob_get_level()) {
        ob_clean();
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
} finally {
    $service->finalize();
}
?>
