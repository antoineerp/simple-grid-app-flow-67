<?php
// Enable strict error reporting but don't display errors in response
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// Set necessary headers
header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check if we need to perform any specific action
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'update_sync_history') {
    // Update sync_history table structure
    handleSyncHistoryUpdate();
} elseif ($action === 'sync_stats') {
    // Get sync stats for a user
    handleSyncStats();
} elseif ($action === 'cleanup_duplicates') {
    // Nettoyer les entrées dupliquées de l'historique de synchronisation
    handleSyncHistoryCleanup();
} elseif ($action === 'standardize_ids') {
    // Modifier la fonction pour prendre en compte le paramètre tableName
    handleStandardizeIds();
} elseif ($action === 'check_sync_consistency') {
    // Nouvelle action pour vérifier la cohérence entre les tables
    handleCheckSyncConsistency();
} else {
    // Default action: return basic system info
    
    // Create response data
    $response = [
        'status' => 'success',
        'message' => 'API Connection successful',
        'timestamp' => date('Y-m-d H:i:s'),
        'php_version' => phpversion(),
        'server_info' => [
            'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'protocol' => $_SERVER['SERVER_PROTOCOL'] ?? 'Unknown'
        ]
    ];
    
    // Return response
    echo json_encode($response, JSON_PRETTY_PRINT);
}

/**
 * Handle updating the sync_history table structure
 */
function handleSyncHistoryUpdate() {
    try {
        // Connect to database
        require_once 'config/database.php';
        $database = new Database();
        $conn = $database->getConnection();
        
        if (!$conn) {
            throw new Exception("Impossible de se connecter à la base de données");
        }
        
        // Check if operation column exists
        $stmt = $conn->prepare("SHOW COLUMNS FROM sync_history LIKE 'operation'");
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            // Add operation column if it doesn't exist
            $conn->exec("ALTER TABLE sync_history ADD COLUMN operation VARCHAR(20) NOT NULL DEFAULT 'sync'");
            echo json_encode([
                'status' => 'success',
                'message' => 'Colonne operation ajoutée à la table sync_history'
            ]);
        } else {
            echo json_encode([
                'status' => 'success',
                'message' => 'La colonne operation existe déjà dans la table sync_history'
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

/**
 * Handle retrieving sync stats for a user
 */
function handleSyncStats() {
    try {
        // Get user ID from request
        $userId = isset($_GET['userId']) ? $_GET['userId'] : null;
        
        if (!$userId) {
            throw new Exception("ID utilisateur non fourni");
        }
        
        // Sanitize user ID
        $userId = preg_replace('/[^a-zA-Z0-9_]/', '', $userId);
        
        // Connect to database
        require_once 'config/database.php';
        $database = new Database();
        $conn = $database->getConnection();
        
        if (!$conn) {
            throw new Exception("Impossible de se connecter à la base de données");
        }
        
        // Get sync stats
        $stmt = $conn->prepare("SELECT 
                                    table_name, 
                                    operation,
                                    COUNT(*) as count, 
                                    MAX(sync_timestamp) as last_sync, 
                                    SUM(record_count) as total_records
                                FROM sync_history 
                                WHERE user_id = ? 
                                GROUP BY table_name, operation
                                ORDER BY last_sync DESC");
        $stmt->execute([$userId]);
        
        $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get device info
        $deviceStmt = $conn->prepare("SELECT 
                                        device_id,
                                        COUNT(*) as sync_count,
                                        MAX(sync_timestamp) as last_sync
                                    FROM sync_history 
                                    WHERE user_id = ? 
                                    GROUP BY device_id
                                    ORDER BY last_sync DESC");
        $deviceStmt->execute([$userId]);
        
        $devices = $deviceStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'status' => 'success',
            'userId' => $userId,
            'stats' => $stats,
            'devices' => $devices
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

/**
 * Nettoie les entrées dupliquées dans l'historique de synchronisation
 * qui ont été créées à la même seconde pour le même utilisateur et appareil
 */
function handleSyncHistoryCleanup() {
    try {
        // Connect to database
        require_once 'config/database.php';
        $database = new Database();
        $conn = $database->getConnection();
        
        if (!$conn) {
            throw new Exception("Impossible de se connecter à la base de données");
        }
        
        // Trouver les entrées dupliquées à la même seconde (même timestamp arrondi à la seconde)
        // pour le même utilisateur, appareil, table et opération
        $conn->exec("CREATE TEMPORARY TABLE IF NOT EXISTS temp_duplicate_syncs AS
            SELECT MIN(id) as keep_id, COUNT(*) as duplicate_count,
                   table_name, user_id, device_id, operation, 
                   DATE_FORMAT(sync_timestamp, '%Y-%m-%d %H:%i:%s') as sync_second
            FROM sync_history
            GROUP BY table_name, user_id, device_id, operation, DATE_FORMAT(sync_timestamp, '%Y-%m-%d %H:%i:%s')
            HAVING COUNT(*) > 1");
        
        // Compter combien d'entrées seront supprimées
        $countStmt = $conn->query("SELECT SUM(duplicate_count - 1) as total_duplicates FROM temp_duplicate_syncs");
        $duplicateCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total_duplicates'] ?? 0;
        
        if ($duplicateCount > 0) {
            // Supprimer les entrées dupliquées (garder seulement la première de chaque groupe)
            $conn->exec("DELETE s FROM sync_history s
                        JOIN temp_duplicate_syncs t ON 
                            s.table_name = t.table_name AND
                            s.user_id = t.user_id AND
                            s.device_id = t.device_id AND
                            s.operation = t.operation AND
                            DATE_FORMAT(s.sync_timestamp, '%Y-%m-%d %H:%i:%s') = t.sync_second AND
                            s.id != t.keep_id");
            
            // Nettoyer la table temporaire
            $conn->exec("DROP TEMPORARY TABLE IF EXISTS temp_duplicate_syncs");
            
            echo json_encode([
                'status' => 'success',
                'message' => "Nettoyage terminé. {$duplicateCount} entrées dupliquées ont été supprimées.",
                'duplicatesRemoved' => (int)$duplicateCount
            ]);
        } else {
            echo json_encode([
                'status' => 'success',
                'message' => "Aucune entrée dupliquée trouvée dans la table sync_history.",
                'duplicatesRemoved' => 0
            ]);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

/**
 * Standardise les IDs existants pour un utilisateur spécifique
 * Cette fonction est modifiée pour accepter un nom de table spécifique
 */
function handleStandardizeIds() {
    try {
        // Récupérer le ID utilisateur cible
        $userId = isset($_GET['userId']) ? $_GET['userId'] : null;
        $tableName = isset($_GET['tableName']) ? $_GET['tableName'] : null;
        
        if (!$userId) {
            throw new Exception("ID utilisateur non fourni");
        }
        
        // Assainir l'ID utilisateur
        $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
        
        require_once 'config/database.php';
        require_once 'services/DataSyncService.php';
        
        $database = new Database();
        $conn = $database->getConnection();
        $service = new DataSyncService('membres'); // On utilise membres juste pour accéder aux méthodes
        
        if (!$conn) {
            throw new Exception("Impossible de se connecter à la base de données");
        }
        
        // Créer la table de mappage d'IDs si elle n'existe pas
        $conn->exec("CREATE TABLE IF NOT EXISTS `id_mapping` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `original_id` VARCHAR(100) NOT NULL,
            `uuid_id` VARCHAR(36) NOT NULL,
            `table_name` VARCHAR(50) NOT NULL,
            `user_id` VARCHAR(50) NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY `uniq_mapping` (`original_id`, `table_name`, `user_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        
        // Démarrer une transaction
        $conn->beginTransaction();
        
        try {
            $totalProcessed = 0;
            $totalConverted = 0;
            $tablesProcessed = 0;
            
            // Si un nom de table spécifique est fourni, ne traiter que cette table
            if ($tableName) {
                $tableFullName = "{$tableName}_{$safeUserId}";
                $result = processTableForStandardization($conn, $service, $tableFullName, $safeUserId, $tableName);
                $totalProcessed += $result['totalRecords'];
                $totalConverted += $result['convertedRecords'];
                $tablesProcessed = 1;
            } else {
                // Sinon, récupérer toutes les tables de l'utilisateur
                $tables = [];
                $tableQuery = $conn->query("SHOW TABLES LIKE '%\_$safeUserId'");
                while ($row = $tableQuery->fetch(PDO::FETCH_NUM)) {
                    $tables[] = $row[0];
                }
                
                foreach ($tables as $table) {
                    // Extraire le nom de base de la table (sans le suffixe utilisateur)
                    $baseTableName = preg_replace("/_$safeUserId$/", '', $table);
                    $result = processTableForStandardization($conn, $service, $table, $safeUserId, $baseTableName);
                    $totalProcessed += $result['totalRecords'];
                    $totalConverted += $result['convertedRecords'];
                    $tablesProcessed++;
                }
            }
            
            // Valider la transaction
            $conn->commit();
            
            echo json_encode([
                'status' => 'success',
                'message' => $tableName 
                    ? "Standardisation des IDs terminée pour $tableName."
                    : "Standardisation des IDs terminée pour toutes les tables.",
                'totalProcessed' => $totalProcessed,
                'totalConverted' => $totalConverted,
                'tablesProcessed' => $tablesProcessed,
                'tableName' => $tableName
            ]);
        } catch (Exception $e) {
            $conn->rollBack();
            throw new Exception("Erreur lors de la standardisation des IDs: " . $e->getMessage());
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

/**
 * Traite une table pour la standardisation des IDs
 */
function processTableForStandardization($conn, $service, $tableName, $userId, $baseTableName) {
    // Vérifier si la table existe
    $checkTable = $conn->query("SHOW TABLES LIKE '{$tableName}'");
    if ($checkTable->rowCount() === 0) {
        return ['totalRecords' => 0, 'convertedRecords' => 0];
    }
    
    // Récupérer tous les enregistrements
    $stmt = $conn->prepare("SELECT * FROM `{$tableName}`");
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $totalRecords = count($records);
    $convertedRecords = 0;
    
    // Vérifier si la colonne ID existe
    $columnsResult = $conn->query("SHOW COLUMNS FROM `{$tableName}` LIKE 'id'");
    if ($columnsResult->rowCount() === 0) {
        return ['totalRecords' => $totalRecords, 'convertedRecords' => 0];
    }
    
    foreach ($records as $record) {
        if (!isset($record['id'])) continue;
        
        $id = $record['id'];
        
        // Vérifier si l'ID est déjà un UUID valide (format 8-4-4-4-12)
        if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id)) {
            // Générer un nouvel UUID
            $newId = $service->generateUuid();
            
            // Enregistrer le mappage de l'ancien au nouvel ID
            $mapStmt = $conn->prepare("INSERT IGNORE INTO `id_mapping` 
                                    (original_id, uuid_id, table_name, user_id) 
                                    VALUES (?, ?, ?, ?)");
            $mapStmt->execute([$id, $newId, $baseTableName, $userId]);
            
            // Mettre à jour l'ID
            $updateStmt = $conn->prepare("UPDATE `{$tableName}` SET `id` = ? WHERE `id` = ?");
            if ($updateStmt->execute([$newId, $id])) {
                $convertedRecords++;
            }
        }
    }
    
    return ['totalRecords' => $totalRecords, 'convertedRecords' => $convertedRecords];
}

/**
 * Vérifie la cohérence de synchronisation entre les tables
 */
function handleCheckSyncConsistency() {
    try {
        // Récupérer le ID utilisateur cible
        $userId = isset($_GET['userId']) ? $_GET['userId'] : null;
        
        if (!$userId) {
            throw new Exception("ID utilisateur non fourni");
        }
        
        // Assainir l'ID utilisateur
        $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
        
        require_once 'config/database.php';
        $database = new Database();
        $conn = $database->getConnection();
        
        if (!$conn) {
            throw new Exception("Impossible de se connecter à la base de données");
        }
        
        // Récupérer toutes les tables de l'utilisateur
        $tables = [];
        $tableQuery = $conn->query("SHOW TABLES LIKE '%\_$safeUserId'");
        while ($row = $tableQuery->fetch(PDO::FETCH_NUM)) {
            $tables[] = $row[0];
        }
        
        if (count($tables) === 0) {
            echo json_encode([
                'status' => 'warning',
                'message' => "Aucune table trouvée pour l'utilisateur $safeUserId"
            ]);
            return;
        }
        
        // Vérifier les statistiques de synchronisation
        $syncStats = [];
        $incohérences = [];
        
        // Récupérer les dernières synchronisations par table
        $stmt = $conn->prepare("SELECT 
                                    table_name, 
                                    MAX(sync_timestamp) as last_sync, 
                                    COUNT(*) as sync_count,
                                    GROUP_CONCAT(DISTINCT operation) as operations
                                FROM sync_history 
                                WHERE user_id = ? 
                                GROUP BY table_name");
        $stmt->execute([$safeUserId]);
        $tableSyncs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Analyser les résultats
        $lastSyncTimes = [];
        foreach ($tableSyncs as $sync) {
            $tableName = $sync['table_name'];
            $lastSync = $sync['last_sync'];
            $syncCount = $sync['sync_count'];
            $operations = explode(',', $sync['operations']);
            
            $lastSyncTimes[$tableName] = $lastSync;
            
            $syncStats[$tableName] = [
                'last_sync' => $lastSync,
                'sync_count' => $syncCount,
                'operations' => $operations
            ];
            
            // Vérifier les opérations manquantes
            if (!in_array('sync', $operations)) {
                $incohérences[] = "La table '$tableName' n'a jamais été synchronisée (opération 'sync' manquante)";
            }
            if (!in_array('load', $operations)) {
                $incohérences[] = "La table '$tableName' n'a jamais été chargée (opération 'load' manquante)";
            }
        }
        
        // Vérifier les écarts de temps entre les dernières synchronisations
        $maxDiffMinutes = 0;
        $tablesWithMaxDiff = ['table1' => '', 'table2' => ''];
        
        foreach ($lastSyncTimes as $table1 => $time1) {
            foreach ($lastSyncTimes as $table2 => $time2) {
                if ($table1 != $table2) {
                    $t1 = strtotime($time1);
                    $t2 = strtotime($time2);
                    $diffMinutes = abs($t1 - $t2) / 60;
                    
                    if ($diffMinutes > $maxDiffMinutes) {
                        $maxDiffMinutes = $diffMinutes;
                        $tablesWithMaxDiff['table1'] = $table1;
                        $tablesWithMaxDiff['table2'] = $table2;
                    }
                }
            }
        }
        
        // Vérifier les identifiants non standardisés
        $nonStandardIds = [];
        foreach ($tables as $table) {
            $idStmt = $conn->prepare("SELECT id FROM `{$table}` WHERE id NOT REGEXP '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'");
            $idStmt->execute();
            $nonStandardCount = $idStmt->rowCount();
            
            if ($nonStandardCount > 0) {
                $baseTableName = preg_replace("/_$safeUserId$/", '', $table);
                $nonStandardIds[$baseTableName] = $nonStandardCount;
                $incohérences[] = "La table '$baseTableName' contient $nonStandardCount IDs non standardisés";
            }
        }
        
        // Construire le rapport
        $details = [
            'tables' => count($tables),
            'sync_stats' => $syncStats,
            'max_sync_time_diff_minutes' => $maxDiffMinutes,
            'tables_with_max_diff' => $tablesWithMaxDiff,
            'non_standard_ids' => $nonStandardIds,
            'inconsistencies' => $incohérences
        ];
        
        // Déterminer l'état global
        $status = count($incohérences) === 0 ? 'success' : 'warning';
        $message = count($incohérences) === 0 
            ? "La synchronisation est cohérente entre toutes les tables"
            : "Des incohérences de synchronisation ont été détectées";
        
        echo json_encode([
            'status' => $status,
            'message' => $message,
            'details' => $details
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}
?>
