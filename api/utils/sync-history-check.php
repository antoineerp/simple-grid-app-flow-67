
<?php
/**
 * Utilitaire de vérification de l'historique de synchronisation
 * Pour diagnostiquer et réparer les problèmes de synchronisation
 */

// Activer la journalisation d'erreurs précise
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/sync_errors.log');

// Définir les en-têtes pour éviter les problèmes CORS
header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Device-ID");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), terminer
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Charger les dépendances
require_once __DIR__ . '/../config/database.php';

try {
    // Récupérer et valider les paramètres de la requête
    $userId = isset($_GET['userId']) ? sanitizeValue($_GET['userId']) : '1';
    $action = isset($_GET['action']) ? $_GET['action'] : 'check';
    
    // Se connecter à la base de données
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Erreur de connexion à la base de données");
    }
    
    // Exécuter l'action demandée
    switch ($action) {
        case 'cleanup':
            cleanupSyncHistory($db, $userId);
            break;
        case 'stats':
            getSyncStats($db, $userId);
            break;
        case 'repair':
            repairMissingRecords($db, $userId);
            break;
        case 'check':
        default:
            checkSyncHistory($db, $userId);
            break;
    }
    
} catch (Exception $e) {
    // Journaliser et renvoyer l'erreur
    error_log("Erreur lors de la vérification de l'historique de synchronisation: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de la vérification de l\'historique',
        'error' => $e->getMessage()
    ]);
}

/**
 * Nettoie les enregistrements dupliqués dans l'historique de synchronisation
 */
function cleanupSyncHistory($db, $userId) {
    try {
        // Créer une table temporaire pour identifier les doublons
        $db->exec("CREATE TEMPORARY TABLE IF NOT EXISTS tmp_duplicates AS
            SELECT MIN(id) as keep_id, table_name, user_id, device_id, operation, sync_timestamp
            FROM sync_history
            WHERE user_id = :userId
            GROUP BY table_name, user_id, device_id, operation, sync_timestamp
            HAVING COUNT(*) > 1");
        
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM tmp_duplicates");
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $duplicatesCount = $result['total'];
        
        // Supprimer les doublons
        if ($duplicatesCount > 0) {
            $db->exec("DELETE sh FROM sync_history sh
                JOIN tmp_duplicates td ON sh.table_name = td.table_name 
                    AND sh.user_id = td.user_id 
                    AND sh.device_id = td.device_id 
                    AND sh.operation = td.operation
                    AND sh.sync_timestamp = td.sync_timestamp
                WHERE sh.id != td.keep_id AND sh.user_id = :userId");
                
            $stmt = $db->prepare("SELECT * FROM sync_history WHERE user_id = :userId ORDER BY sync_timestamp DESC LIMIT 50");
            $stmt->execute(['userId' => $userId]);
            $recentEntries = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Nettoyage des doublons terminé',
                'duplicatesRemoved' => $duplicatesCount,
                'recentEntries' => $recentEntries
            ]);
        } else {
            echo json_encode([
                'status' => 'success',
                'message' => 'Aucun doublon trouvé dans l\'historique de synchronisation'
            ]);
        }
    } catch (Exception $e) {
        throw new Exception("Erreur lors du nettoyage des doublons: " . $e->getMessage());
    }
}

/**
 * Vérifie l'historique de synchronisation
 */
function checkSyncHistory($db, $userId) {
    try {
        // Récupérer la liste des tables
        $stmt = $db->prepare("SELECT DISTINCT table_name FROM sync_history WHERE user_id = :userId");
        $stmt->execute(['userId' => $userId]);
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Récupérer le résumé par table
        $tableStats = [];
        foreach ($tables as $tableName) {
            $stmt = $db->prepare("SELECT 
                COUNT(*) as total_operations, 
                MAX(sync_timestamp) as last_sync, 
                COUNT(DISTINCT device_id) as device_count,
                SUM(CASE WHEN operation = 'sync' THEN 1 ELSE 0 END) as sync_count,
                SUM(CASE WHEN operation = 'load' THEN 1 ELSE 0 END) as load_count
                FROM sync_history 
                WHERE user_id = :userId AND table_name = :tableName");
            $stmt->execute(['userId' => $userId, 'tableName' => $tableName]);
            $tableStats[$tableName] = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        // Récupérer les 20 dernières opérations
        $stmt = $db->prepare("SELECT * FROM sync_history WHERE user_id = :userId ORDER BY sync_timestamp DESC LIMIT 20");
        $stmt->execute(['userId' => $userId]);
        $recentOperations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Vérifier les enregistrements manquants
        $missingRecords = [];
        foreach ($tables as $tableName) {
            // Vérifier s'il y a des opérations de synchronisation sans chargement correspondant
            $stmt = $db->prepare("SELECT s.device_id, s.sync_timestamp 
                FROM sync_history s 
                LEFT JOIN sync_history l ON s.table_name = l.table_name 
                    AND s.user_id = l.user_id 
                    AND s.device_id = l.device_id 
                    AND l.operation = 'load'
                WHERE s.user_id = :userId AND s.table_name = :tableName AND s.operation = 'sync'
                AND l.id IS NULL");
            $stmt->execute(['userId' => $userId, 'tableName' => $tableName]);
            $syncWithoutLoad = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($syncWithoutLoad) > 0) {
                $missingRecords[$tableName] = [
                    'type' => 'sync_without_load',
                    'count' => count($syncWithoutLoad),
                    'records' => $syncWithoutLoad
                ];
            }
        }
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Vérification de l\'historique de synchronisation terminée',
            'tables' => $tables,
            'tableStats' => $tableStats,
            'recentOperations' => $recentOperations,
            'missingRecords' => $missingRecords
        ]);
    } catch (Exception $e) {
        throw new Exception("Erreur lors de la vérification de l'historique: " . $e->getMessage());
    }
}

/**
 * Obtenez des statistiques de synchronisation
 */
function getSyncStats($db, $userId) {
    try {
        // Récupérer les statistiques globales
        $stmt = $db->prepare("SELECT 
            COUNT(*) as total_operations,
            COUNT(DISTINCT table_name) as table_count,
            COUNT(DISTINCT device_id) as device_count,
            MIN(sync_timestamp) as first_sync,
            MAX(sync_timestamp) as last_sync,
            SUM(CASE WHEN operation = 'sync' THEN 1 ELSE 0 END) as sync_count,
            SUM(CASE WHEN operation = 'load' THEN 1 ELSE 0 END) as load_count
            FROM sync_history 
            WHERE user_id = :userId");
        $stmt->execute(['userId' => $userId]);
        $globalStats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Récupérer les statistiques par table (dernière synchronisation)
        $stmt = $db->prepare("SELECT 
            sh1.table_name,
            MAX(sh1.sync_timestamp) AS derniere_synchro,
            GROUP_CONCAT(DISTINCT sh1.operation) AS operations,
            COUNT(DISTINCT sh1.device_id) AS nb_appareils,
            (
                SELECT COUNT(*) 
                FROM sync_history sh2 
                WHERE sh2.table_name = sh1.table_name 
                    AND sh2.user_id = sh1.user_id 
                    AND sh2.sync_timestamp = (
                        SELECT MAX(sync_timestamp) 
                        FROM sync_history 
                        WHERE table_name = sh1.table_name AND user_id = sh1.user_id
                    )
            ) AS nb_operations_simultanées
            FROM sync_history sh1
            WHERE sh1.user_id = :userId
            GROUP BY sh1.table_name
            ORDER BY derniere_synchro DESC");
        $stmt->execute(['userId' => $userId]);
        $tableStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Récupérer les statistiques par appareil
        $stmt = $db->prepare("SELECT 
            device_id,
            COUNT(*) as operation_count,
            MIN(sync_timestamp) as first_operation,
            MAX(sync_timestamp) as last_operation
            FROM sync_history
            WHERE user_id = :userId
            GROUP BY device_id
            ORDER BY last_operation DESC");
        $stmt->execute(['userId' => $userId]);
        $deviceStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Statistiques de synchronisation',
            'globalStats' => $globalStats,
            'tableStats' => $tableStats,
            'deviceStats' => $deviceStats
        ]);
    } catch (Exception $e) {
        throw new Exception("Erreur lors de la récupération des statistiques: " . $e->getMessage());
    }
}

/**
 * Réparer les enregistrements manquants dans l'historique de synchronisation
 */
function repairMissingRecords($db, $userId) {
    try {
        // Récupérer la liste des tables
        $stmt = $db->prepare("SELECT DISTINCT table_name FROM sync_history WHERE user_id = :userId");
        $stmt->execute(['userId' => $userId]);
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $repairedRecords = [];
        foreach ($tables as $tableName) {
            // Vérifier s'il y a des opérations de synchronisation sans chargement correspondant
            $stmt = $db->prepare("SELECT s.device_id, s.sync_timestamp, s.table_name
                FROM sync_history s 
                LEFT JOIN sync_history l ON s.table_name = l.table_name 
                    AND s.user_id = l.user_id 
                    AND s.device_id = l.device_id 
                    AND l.operation = 'load'
                WHERE s.user_id = :userId AND s.table_name = :tableName AND s.operation = 'sync'
                AND l.id IS NULL");
            $stmt->execute(['userId' => $userId, 'tableName' => $tableName]);
            $syncWithoutLoad = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($syncWithoutLoad) > 0) {
                // Ajouter les enregistrements manquants
                $insertStmt = $db->prepare("INSERT INTO sync_history 
                    (table_name, user_id, device_id, record_count, operation, sync_timestamp) 
                    VALUES (:tableName, :userId, :deviceId, 0, 'load', :syncTimestamp)");
                
                foreach ($syncWithoutLoad as $record) {
                    $insertStmt->execute([
                        'tableName' => $record['table_name'],
                        'userId' => $userId,
                        'deviceId' => $record['device_id'],
                        'syncTimestamp' => $record['sync_timestamp']
                    ]);
                }
                
                $repairedRecords[$tableName] = count($syncWithoutLoad);
            }
        }
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Réparation des enregistrements manquants terminée',
            'repairedRecords' => $repairedRecords
        ]);
    } catch (Exception $e) {
        throw new Exception("Erreur lors de la réparation des enregistrements manquants: " . $e->getMessage());
    }
}

/**
 * Nettoie une valeur pour éviter les injections
 */
function sanitizeValue($value) {
    return preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $value);
}
?>
