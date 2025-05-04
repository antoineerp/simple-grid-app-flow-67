
<?php
// Force output buffering to prevent output before headers
ob_start();

// Initialiser la gestion des requêtes
require_once 'services/RequestHandler.php';

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
    
    // Récupérer les paramètres
    $userId = isset($_GET['userId']) ? RequestHandler::sanitizeUserId($_GET['userId']) : null;
    $action = isset($_GET['action']) ? $_GET['action'] : 'diagnostic';
    
    if (!$userId) {
        throw new Exception("Paramètre 'userId' requis");
    }
    
    // Connexion à la base de données
    require_once 'config/database.php';
    $database = new Database();
    $pdo = $database->getConnection();
    
    if (!$pdo) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    // Exécuter l'action demandée
    switch ($action) {
        case 'diagnostic':
            $result = runDiagnostic($pdo, $userId);
            break;
        
        case 'fix-missing-tables':
            $result = fixMissingTables($pdo, $userId);
            break;
        
        case 'rebuild-history':
            $result = rebuildSyncHistory($pdo, $userId);
            break;
        
        default:
            throw new Exception("Action non reconnue: {$action}");
    }
    
    // Réponse réussie
    RequestHandler::sendJsonResponse(true, 'Opération terminée avec succès', $result);
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans sync-fix.php: " . $e->getMessage());
    RequestHandler::handleError($e, 500);
} catch (Exception $e) {
    error_log("Exception dans sync-fix.php: " . $e->getMessage());
    RequestHandler::handleError($e);
} finally {
    if (ob_get_level()) ob_end_flush();
}

/**
 * Exécute un diagnostic complet de synchronisation pour un utilisateur
 */
function runDiagnostic($pdo, $userId) {
    // Récupérer toutes les tables de l'utilisateur
    $tables = getUserTables($pdo, $userId);
    
    // Récupérer l'historique de synchronisation
    $syncHistory = getSyncHistory($pdo, $userId);
    
    // Analyser les tables manquantes dans l'historique
    $tablesInHistory = array_unique(array_column($syncHistory, 'table_name'));
    $missingInHistory = array_diff(array_keys($tables), $tablesInHistory);
    
    // Vérifier les opérations manquantes (load ou sync)
    $missingOperations = [];
    foreach ($tablesInHistory as $tableName) {
        $operations = [];
        foreach ($syncHistory as $record) {
            if ($record['table_name'] === $tableName) {
                $operations[] = $record['operation'];
            }
        }
        
        $uniqueOperations = array_unique($operations);
        if (!in_array('sync', $uniqueOperations)) {
            $missingOperations[] = ['table' => $tableName, 'missing' => 'sync'];
        }
        if (!in_array('load', $uniqueOperations)) {
            $missingOperations[] = ['table' => $tableName, 'missing' => 'load'];
        }
    }
    
    return [
        'tables_found' => count($tables),
        'tables_list' => array_keys($tables),
        'sync_history_records' => count($syncHistory),
        'tables_in_history' => count($tablesInHistory),
        'tables_in_history_list' => $tablesInHistory,
        'missing_in_history' => $missingInHistory,
        'missing_operations' => $missingOperations
    ];
}

/**
 * Corrige les tables manquantes dans l'historique de synchronisation
 */
function fixMissingTables($pdo, $userId) {
    $deviceId = RequestHandler::getDeviceId();
    $fixes = [];
    
    // Récupérer toutes les tables de l'utilisateur
    $tables = getUserTables($pdo, $userId);
    
    // Récupérer l'historique de synchronisation
    $syncHistory = getSyncHistory($pdo, $userId);
    $tablesInHistory = array_unique(array_column($syncHistory, 'table_name'));
    
    // Ajouter des enregistrements pour les tables manquantes
    foreach ($tables as $tableName => $recordCount) {
        if (!in_array($tableName, $tablesInHistory)) {
            // Ajouter des enregistrements pour load et sync
            $stmt = $pdo->prepare("INSERT INTO `sync_history` 
                                (table_name, user_id, device_id, record_count, operation, sync_timestamp) 
                                VALUES (?, ?, ?, ?, ?, NOW())");
            
            // Opération load
            $stmt->execute([$tableName, $userId, $deviceId, $recordCount, 'load']);
            
            // Opération sync
            $stmt->execute([$tableName, $userId, $deviceId, $recordCount, 'sync']);
            
            $fixes[] = $tableName;
        }
    }
    
    return [
        'tables_fixed' => count($fixes),
        'fixed_tables' => $fixes
    ];
}

/**
 * Reconstruit tout l'historique de synchronisation pour un utilisateur
 */
function rebuildSyncHistory($pdo, $userId) {
    $deviceId = RequestHandler::getDeviceId();
    
    // Récupérer toutes les tables de l'utilisateur
    $tables = getUserTables($pdo, $userId);
    
    // Supprimer tout l'historique existant pour cet utilisateur
    $deleteStmt = $pdo->prepare("DELETE FROM `sync_history` WHERE user_id = ?");
    $deleteStmt->execute([$userId]);
    
    // Reconstruire l'historique
    $insertStmt = $pdo->prepare("INSERT INTO `sync_history` 
                               (table_name, user_id, device_id, record_count, operation, sync_timestamp) 
                               VALUES (?, ?, ?, ?, ?, NOW())");
    
    $rebuilt = [];
    foreach ($tables as $tableName => $recordCount) {
        // Opération load
        $insertStmt->execute([$tableName, $userId, $deviceId, $recordCount, 'load']);
        
        // Opération sync
        $insertStmt->execute([$tableName, $userId, $deviceId, $recordCount, 'sync']);
        
        $rebuilt[] = $tableName;
    }
    
    return [
        'tables_rebuilt' => count($rebuilt),
        'rebuilt_tables' => $rebuilt
    ];
}

/**
 * Récupère toutes les tables d'un utilisateur
 */
function getUserTables($pdo, $userId) {
    $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    $tables = [];
    
    // Récupérer toutes les tables avec un suffixe _userId
    $stmt = $pdo->query("SHOW TABLES LIKE '%\_$safeUserId'");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $fullTableName = $row[0];
        // Extraire le nom de base de la table
        $baseTableName = preg_replace("/_$safeUserId$/", '', $fullTableName);
        
        // Compter les enregistrements
        $countStmt = $pdo->query("SELECT COUNT(*) FROM `$fullTableName`");
        $recordCount = $countStmt->fetchColumn();
        
        $tables[$baseTableName] = (int)$recordCount;
    }
    
    return $tables;
}

/**
 * Récupère l'historique de synchronisation d'un utilisateur
 */
function getSyncHistory($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT * FROM `sync_history` WHERE user_id = ? ORDER BY sync_timestamp DESC");
    $stmt->execute([$userId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
