
<?php
// Initialiser la gestion de synchronisation
require_once 'services/DataSyncService.php';
require_once 'services/RequestHandler.php';
require_once 'services/TableManager.php';

// Définir les en-têtes standard pour permettre l'accès depuis n'importe où
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Device-ID");
header("Content-Type: application/json; charset=UTF-8");

// Si c'est une requête OPTIONS préflight, arrêter ici
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée. Utilisez GET.'
    ]);
    exit;
}

try {
    // Récupérer les paramètres de la requête
    $userId = isset($_GET['userId']) ? RequestHandler::sanitizeUserId($_GET['userId']) : null;
    $action = isset($_GET['action']) ? $_GET['action'] : null;
    $deviceId = isset($_GET['deviceId']) ? $_GET['deviceId'] : RequestHandler::getDeviceId();
    
    // Vérifier que l'action est spécifiée
    if (!$action) {
        throw new Exception("Paramètre 'action' requis");
    }
    
    // Créer une connexion PDO
    $pdo = null;
    $dsn = 'mysql:host=' . getenv('DB_HOST') . ';dbname=' . getenv('DB_NAME') . ';charset=utf8mb4';
    $pdo = new PDO($dsn, getenv('DB_USER'), getenv('DB_PASSWORD'), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
    
    // Traiter l'action demandée
    switch ($action) {
        case 'repair_sync':
            // Réparer l'historique de synchronisation en supprimant les duplications
            $result = repairSyncHistory($pdo, $userId);
            echo json_encode([
                'success' => true,
                'message' => 'Opération terminée avec succès',
                'timestamp' => date('c'),
                'repaired_count' => $result['count'],
                'repaired_items' => $result['items']
            ]);
            break;
            
        case 'check_tables':
            // Vérifier l'existence des tables pour un utilisateur
            $result = checkUserTables($pdo, $userId);
            echo json_encode([
                'success' => true,
                'message' => 'Opération terminée avec succès',
                'timestamp' => date('c'),
                'tables_status' => $result
            ]);
            break;
            
        case 'clear_sync_history':
            // Vider l'historique de synchronisation pour un utilisateur
            $result = clearSyncHistory($pdo, $userId);
            echo json_encode([
                'success' => true,
                'message' => 'Opération terminée avec succès',
                'timestamp' => date('c'),
                'cleared_count' => $result
            ]);
            break;
            
        case 'remove_duplicates':
            // Supprimer les duplications dans l'historique
            $result = removeDuplicateOperations($pdo, $userId);
            echo json_encode([
                'success' => true,
                'message' => 'Opération terminée avec succès',
                'timestamp' => date('c'),
                'removed_count' => $result
            ]);
            break;
            
        case 'reset_queue':
            // Réinitialiser la file d'attente pour un utilisateur
            $result = resetUserSyncQueue($pdo, $userId);
            echo json_encode([
                'success' => true,
                'message' => 'Opération terminée avec succès',
                'timestamp' => date('c'),
                'reset_count' => $result
            ]);
            break;
            
        default:
            throw new Exception("Action non reconnue: {$action}");
    }
} catch (PDOException $e) {
    error_log("Erreur PDO dans sync-debug.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage(),
        'timestamp' => date('c')
    ]);
} catch (Exception $e) {
    error_log("Exception dans sync-debug.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'timestamp' => date('c')
    ]);
}

/**
 * Réparer l'historique de synchronisation
 */
function repairSyncHistory($pdo, $userId) {
    if (!$userId) {
        throw new Exception("UserID requis pour réparer l'historique");
    }
    
    $repairedItems = [];
    $totalRepaired = 0;
    
    // 1. Vérifier s'il y a des opérations simultanées excessives pour un même timestamp
    $stmt = $pdo->prepare("
        SELECT table_name, sync_timestamp, COUNT(*) as op_count
        FROM sync_history 
        WHERE user_id = ? 
        GROUP BY table_name, sync_timestamp 
        HAVING COUNT(*) > 1
        ORDER BY sync_timestamp DESC
    ");
    $stmt->execute([$userId]);
    $duplicateTimestamps = $stmt->fetchAll();
    
    foreach ($duplicateTimestamps as $duplicate) {
        $tableName = $duplicate['table_name'];
        $timestamp = $duplicate['sync_timestamp'];
        $count = $duplicate['op_count'];
        
        if ($count > 2) { // Si plus de 2 opérations exactement au même timestamp
            // Garder seulement une opération de chaque type (load, sync)
            $delete = $pdo->prepare("
                DELETE FROM sync_history 
                WHERE table_name = ? 
                AND user_id = ? 
                AND sync_timestamp = ? 
                AND id NOT IN (
                    SELECT id FROM (
                        SELECT MIN(id) as id 
                        FROM sync_history 
                        WHERE table_name = ? 
                        AND user_id = ? 
                        AND sync_timestamp = ?
                        GROUP BY operation
                    ) as keep
                )
            ");
            $delete->execute([$tableName, $userId, $timestamp, $tableName, $userId, $timestamp]);
            
            $affectedRows = $delete->rowCount();
            $totalRepaired += $affectedRows;
            
            $repairedItems[] = [
                'table' => $tableName,
                'timestamp' => $timestamp,
                'removed' => $affectedRows,
                'kept' => $count - $affectedRows
            ];
        }
    }
    
    // 2. Assurer qu'il y a au moins une entrée load et sync pour chaque table
    $standardTables = ['documents', 'exigences', 'membres', 'bibliotheque', 'collaboration', 'collaboration_groups', 'test_table'];
    
    foreach ($standardTables as $tableName) {
        // Vérifier si la table a des entrées load
        $checkLoad = $pdo->prepare("
            SELECT COUNT(*) FROM sync_history 
            WHERE table_name = ? AND user_id = ? AND operation = 'load'
        ");
        $checkLoad->execute([$tableName, $userId]);
        
        if ($checkLoad->fetchColumn() === 0) {
            // Ajouter une entrée load
            $insertLoad = $pdo->prepare("
                INSERT INTO sync_history (table_name, user_id, device_id, operation, record_count, sync_timestamp)
                VALUES (?, ?, 'system', 'load', 0, NOW())
            ");
            $insertLoad->execute([$tableName, $userId]);
            
            $totalRepaired++;
            $repairedItems[] = [
                'table' => $tableName,
                'action' => 'added_load',
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
        
        // Vérifier si la table a des entrées sync
        $checkSync = $pdo->prepare("
            SELECT COUNT(*) FROM sync_history 
            WHERE table_name = ? AND user_id = ? AND operation = 'sync'
        ");
        $checkSync->execute([$tableName, $userId]);
        
        if ($checkSync->fetchColumn() === 0) {
            // Ajouter une entrée sync
            $insertSync = $pdo->prepare("
                INSERT INTO sync_history (table_name, user_id, device_id, operation, record_count, sync_timestamp)
                VALUES (?, ?, 'system', 'sync', 0, NOW())
            ");
            $insertSync->execute([$tableName, $userId]);
            
            $totalRepaired++;
            $repairedItems[] = [
                'table' => $tableName,
                'action' => 'added_sync',
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
    }
    
    return [
        'count' => $totalRepaired,
        'items' => $repairedItems
    ];
}

/**
 * Vérifier l'existence des tables pour un utilisateur
 */
function checkUserTables($pdo, $userId) {
    if (!$userId) {
        throw new Exception("UserID requis pour vérifier les tables");
    }
    
    $tables = ['documents', 'exigences', 'membres', 'bibliotheque', 'collaboration', 'collaboration_groups', 'test_table'];
    $result = [];
    
    foreach ($tables as $tableName) {
        $userTable = "{$tableName}_{$userId}";
        
        // Vérifier si la table existe
        $stmt = $pdo->query("SHOW TABLES LIKE '{$userTable}'");
        $tableExists = $stmt->rowCount() > 0;
        
        // Vérifier si des entrées existent dans l'historique de synchronisation
        $historyStmt = $pdo->prepare("
            SELECT COUNT(*) FROM sync_history 
            WHERE table_name = ? AND user_id = ?
        ");
        $historyStmt->execute([$tableName, $userId]);
        $hasHistory = $historyStmt->fetchColumn() > 0;
        
        $result[$tableName] = [
            'status' => $tableExists ? 'exists' : 'missing',
            'message' => $tableExists ? 'La table existe déjà' : 'La table n\'existe pas',
            'history' => $hasHistory ? 'exists' : 'missing'
        ];
        
        // Si la table n'existe pas, créer la table
        if (!$tableExists) {
            try {
                $created = TableManager::initializeTableForUser($pdo, $tableName, $userId);
                if ($created) {
                    $result[$tableName]['status'] = 'created';
                    $result[$tableName]['message'] = 'Table créée avec succès';
                }
            } catch (Exception $e) {
                $result[$tableName]['error'] = $e->getMessage();
            }
        }
    }
    
    return $result;
}

/**
 * Vider l'historique de synchronisation pour un utilisateur
 */
function clearSyncHistory($pdo, $userId) {
    if (!$userId) {
        throw new Exception("UserID requis pour vider l'historique");
    }
    
    $stmt = $pdo->prepare("DELETE FROM sync_history WHERE user_id = ?");
    $stmt->execute([$userId]);
    
    return $stmt->rowCount();
}

/**
 * Supprimer les duplications dans l'historique
 */
function removeDuplicateOperations($pdo, $userId) {
    if (!$userId) {
        throw new Exception("UserID requis pour supprimer les duplications");
    }
    
    // Supprimer les duplications exactes (même table, même opération, même timestamp)
    $stmt = $pdo->prepare("
        DELETE s1 FROM sync_history s1
        INNER JOIN sync_history s2 
        WHERE s1.id > s2.id 
        AND s1.table_name = s2.table_name 
        AND s1.user_id = s2.user_id 
        AND s1.operation = s2.operation
        AND s1.sync_timestamp = s2.sync_timestamp
        AND s1.user_id = ?
    ");
    $stmt->execute([$userId]);
    
    return $stmt->rowCount();
}

/**
 * Réinitialiser la file d'attente pour un utilisateur
 */
function resetUserSyncQueue($pdo, $userId) {
    if (!$userId) {
        throw new Exception("UserID requis pour réinitialiser la file d'attente");
    }
    
    // Ajouter des entrées dans l'historique pour marquer la réinitialisation
    $tables = ['documents', 'exigences', 'membres', 'bibliotheque', 'collaboration', 'collaboration_groups', 'test_table'];
    $count = 0;
    
    foreach ($tables as $tableName) {
        // Ajouter une entrée de réinitialisation
        $stmt = $pdo->prepare("
            INSERT INTO sync_history (table_name, user_id, device_id, operation, record_count, sync_timestamp)
            VALUES (?, ?, 'system', 'reset', 0, NOW())
        ");
        $stmt->execute([$tableName, $userId]);
        $count++;
    }
    
    return $count;
}
