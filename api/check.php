
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
?>
