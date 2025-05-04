
<?php
// Force output buffering to prevent output before headers
ob_start();

// Initialiser la gestion de synchronisation
require_once 'services/DataSyncService.php';
require_once 'services/RequestHandler.php';

// Nom de la table à synchroniser
$tableName = 'collaboration_groups';

// Créer le service de synchronisation
$service = new DataSyncService($tableName);

// Définir les en-têtes standard
RequestHandler::setStandardHeaders("POST, OPTIONS");
RequestHandler::handleOptionsRequest();

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    RequestHandler::handleError('Méthode non autorisée. Utilisez POST.', 405);
}

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Récupérer les données POST JSON
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$json || !$data) {
        throw new Exception("Aucune donnée reçue ou format JSON invalide");
    }
    
    error_log("Données reçues pour synchronisation des groupes de collaboration");
    
    // Vérifier si les données nécessaires sont présentes
    if (!isset($data['userId'])) {
        throw new Exception("Données incomplètes. 'userId' est requis");
    }
    
    // Récupérer les données
    $userId = RequestHandler::sanitizeUserId($data['userId']);
    $deviceId = isset($data['deviceId']) ? $data['deviceId'] : RequestHandler::getDeviceId();
    $groups = isset($data['groups']) ? $data['groups'] : [];
    
    error_log("Synchronisation pour l'utilisateur: {$userId} depuis l'appareil: {$deviceId}");
    error_log("Nombre de groupes: " . count($groups));
    
    // Connexion à la base de données
    if (!$service->connectToDatabase()) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    // Nom de la table spécifique à l'utilisateur
    $userTableName = "{$tableName}_" . $userId;
    
    // Obtenir une référence PDO
    $pdo = $service->getPdo();
    
    // Enregistrer cette synchronisation dans l'historique
    $service->recordSyncOperation($userId, $deviceId, 'sync', count($groups));
    
    // Créer la table si elle n'existe pas
    $pdo->exec("CREATE TABLE IF NOT EXISTS `{$userTableName}` (
        `id` VARCHAR(36) NOT NULL PRIMARY KEY,
        `name` VARCHAR(255) NOT NULL,
        `expanded` TINYINT(1) DEFAULT 1,
        `userId` VARCHAR(50) NOT NULL,
        `last_sync_device` VARCHAR(100) NULL,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    // Vider la table pour une synchronisation complète
    $stmt = $pdo->prepare("DELETE FROM `{$userTableName}` WHERE userId = ?");
    $stmt->execute([$userId]);
    
    // Insérer les groupes
    if (!empty($groups)) {
        $insertQuery = "INSERT INTO `{$userTableName}` 
            (id, name, expanded, userId, last_sync_device) 
            VALUES (?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($insertQuery);
        
        foreach ($groups as $group) {
            $stmt->execute([
                $group['id'],
                $group['name'],
                $group['expanded'] ? 1 : 0,
                $userId,
                $deviceId
            ]);
        }
    }
    
    error_log("Groupes de collaboration synchronisés: " . count($groups));
    
    // Réponse réussie
    RequestHandler::sendJsonResponse(true, 'Groupes de collaboration synchronisés avec succès', [
        'count' => count($groups),
        'deviceId' => $deviceId,
        'tableName' => $tableName
    ]);
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans {$tableName}-sync.php: " . $e->getMessage());
    RequestHandler::handleError($e, 500);
} catch (Exception $e) {
    error_log("Exception dans {$tableName}-sync.php: " . $e->getMessage());
    RequestHandler::handleError($e);
} finally {
    if (isset($service)) {
        $service->finalize();
    }
    
    error_log("=== FIN DE L'EXÉCUTION DE {$tableName}-sync.php ===");
    if (ob_get_level()) ob_end_flush();
}
