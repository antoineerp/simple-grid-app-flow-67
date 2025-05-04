
<?php
// Force output buffering to prevent output before headers
ob_start();

// Initialiser la gestion de synchronisation
require_once 'services/DataSyncService.php';
require_once 'services/RequestHandler.php';

// Nom de la table à charger
$tableName = 'collaboration';

// Créer le service de synchronisation
$service = new DataSyncService($tableName);

// Définir les en-têtes standard
RequestHandler::setStandardHeaders("GET, OPTIONS");
RequestHandler::handleOptionsRequest();

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    RequestHandler::handleError('Méthode non autorisée. Utilisez GET.', 405);
}

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Récupérer les paramètres de la requête
    $userId = isset($_GET['userId']) ? RequestHandler::sanitizeUserId($_GET['userId']) : null;
    $deviceId = isset($_GET['deviceId']) ? $_GET['deviceId'] : RequestHandler::getDeviceId();
    
    if (!$userId) {
        throw new Exception("Paramètre 'userId' requis");
    }
    
    error_log("Chargement des données pour l'utilisateur: {$userId} depuis l'appareil: {$deviceId}");
    
    // Connexion à la base de données
    if (!$service->connectToDatabase()) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    // Nom de la table spécifique à l'utilisateur
    $userTableName = "{$tableName}_" . $userId;
    
    // Obtenir une référence PDO
    $pdo = $service->getPdo();
    
    // Force l'enregistrement de cette opération pour déboguer
    RequestHandler::forceSyncRecord($pdo, $tableName, $userId, $deviceId, 'load-start', 0);
    
    // Enregistrer cette opération de chargement dans l'historique
    $service->recordSyncOperation($userId, $deviceId, 'load', 0);
    
    // Vérifier si la table existe
    $tables = $pdo->query("SHOW TABLES LIKE '{$userTableName}'")->fetchAll();
    if (count($tables) === 0) {
        // La table n'existe pas, retourner un tableau vide
        RequestHandler::sendJsonResponse(true, 'Aucune donnée disponible', [
            'collaboration' => [],
            'count' => 0,
            'deviceId' => $deviceId
        ]);
        exit;
    }
    
    // Récupérer les données
    $stmt = $pdo->prepare("SELECT * FROM `{$userTableName}` WHERE userId = ?");
    $stmt->execute([$userId]);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $recordCount = count($records);
    
    // Enregistrer le nombre d'enregistrements chargés
    RequestHandler::forceSyncRecord($pdo, $tableName, $userId, $deviceId, 'load-end', $recordCount);
    
    error_log("Documents de collaboration chargés: " . $recordCount);
    
    // Réponse réussie
    RequestHandler::sendJsonResponse(true, 'Données chargées avec succès', [
        'collaboration' => $records,
        'count' => $recordCount,
        'deviceId' => $deviceId,
        'tableName' => $tableName
    ]);
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans {$tableName}-load.php: " . $e->getMessage());
    RequestHandler::handleError($e, 500);
} catch (Exception $e) {
    error_log("Exception dans {$tableName}-load.php: " . $e->getMessage());
    RequestHandler::handleError($e);
} finally {
    if (isset($service)) {
        $service->finalize();
    }
    
    error_log("=== FIN DE L'EXÉCUTION DE {$tableName}-load.php ===");
    if (ob_get_level()) ob_end_flush();
}
