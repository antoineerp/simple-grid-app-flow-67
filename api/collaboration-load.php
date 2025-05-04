
<?php
// Force output buffering to prevent output before headers
ob_start();

// Initialiser la gestion de synchronisation
require_once 'services/DataSyncService.php';
require_once 'services/RequestHandler.php';
require_once 'services/TableManager.php';

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
    
    error_log("Chargement des données de {$tableName} pour l'utilisateur: {$userId} depuis l'appareil: {$deviceId}");
    
    // Connexion à la base de données
    if (!$service->connectToDatabase()) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    // Nom de la table spécifique à l'utilisateur
    $userTableName = "{$tableName}_" . $userId;
    
    // Obtenir une référence PDO
    $pdo = $service->getPdo();
    
    // Empêcher les opérations simultanées en vérifiant s'il y a déjà un chargement en cours
    $checkStmt = $pdo->prepare("
        SELECT COUNT(*) 
        FROM sync_history 
        WHERE table_name = ? 
        AND user_id = ? 
        AND operation = 'load' 
        AND sync_timestamp > DATE_SUB(NOW(), INTERVAL 10 SECOND)
    ");
    $checkStmt->execute([$tableName, $userId]);
    $recentLoads = $checkStmt->fetchColumn();
    
    if ($recentLoads > 0) {
        error_log("Attention: Opération de chargement déjà en cours pour {$tableName} et l'utilisateur {$userId}, optimisation...");
        // Pas d'erreur, continuer car ce n'est pas critique
    } else {
        // Enregistrer cette opération de chargement dans l'historique
        RequestHandler::forceSyncRecord($pdo, $tableName, $userId, $deviceId, 'load', 0);
    }
    
    // Vérifier si la table existe
    $tables = $pdo->query("SHOW TABLES LIKE '{$userTableName}'")->fetchAll();
    if (count($tables) === 0) {
        // La table n'existe pas, utilisons TableManager pour la créer
        error_log("Table {$userTableName} non trouvée, création automatique via TableManager");
        
        try {
            // Initialiser la table pour cet utilisateur
            $success = TableManager::initializeTableForUser($pdo, $tableName, $userId);
            
            if ($success) {
                error_log("Table {$userTableName} créée avec succès via TableManager");
            } else {
                error_log("Échec de la création de la table {$userTableName} via TableManager");
            }
        } catch (Exception $e) {
            error_log("Erreur lors de la création de la table {$userTableName}: " . $e->getMessage());
        }
        
        RequestHandler::sendJsonResponse(true, 'Aucune donnée disponible', [
            $tableName => [],
            'records' => [],
            'count' => 0,
            'deviceId' => $deviceId,
            'tableName' => $tableName
        ]);
        exit;
    }
    
    // Récupérer les données - on utilise une requête qui fonctionne même si les colonnes varient
    $stmt = $pdo->prepare("SELECT * FROM `{$userTableName}` WHERE userId = ?");
    $stmt->execute([$userId]);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $recordCount = count($records);
    
    error_log("Données de {$tableName} chargées: " . $recordCount);
    
    // Réponse réussie - inclure les données sous deux clés (pour la compatibilité)
    RequestHandler::sendJsonResponse(true, 'Données chargées avec succès', [
        $tableName => $records,
        'records' => $records,
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
