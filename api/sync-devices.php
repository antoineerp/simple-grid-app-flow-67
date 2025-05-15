
<?php
/**
 * Script de synchronisation entre appareils
 * Ce script vérifie et assure la cohérence des données entre différents appareils
 */

// Activer la journalisation d'erreurs précise
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/sync_errors.log');

// Définir les en-têtes pour éviter les problèmes CORS
header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Device-ID");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), terminer
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Charger les dépendances
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/middleware/Auth.php';

try {
    // Récupérer et valider les paramètres de la requête
    $userId = isset($_GET['userId']) ? sanitizeValue($_GET['userId']) : '';
    $deviceId = isset($_GET['deviceId']) ? sanitizeValue($_GET['deviceId']) : getDeviceId();
    $table = isset($_GET['table']) ? sanitizeValue($_GET['table']) : '';
    
    // Valider l'authentification
    $allHeaders = getallheaders();
    $auth = new Auth($allHeaders);
    $userData = $auth->isAuth();
    
    if (!$userData) {
        throw new Exception("Utilisateur non authentifié");
    }
    
    // Se connecter à la base de données
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données");
    }
    
    // Journaliser la requête
    logRequest($userId, $deviceId, $table);
    
    // Si une table spécifique est demandée, synchroniser cette table uniquement
    if (!empty($table)) {
        $result = synchronizeTable($db, $table, $userId, $deviceId);
        echo json_encode([
            'status' => 'success',
            'message' => "Synchronisation de la table $table terminée",
            'result' => $result
        ]);
    } else {
        // Sinon, synchroniser toutes les tables pour cet utilisateur
        $tables = getAllUserTables($db, $userId);
        $results = [];
        
        foreach ($tables as $table) {
            $results[$table] = synchronizeTable($db, $table, $userId, $deviceId);
        }
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Synchronisation de toutes les tables terminée',
            'results' => $results
        ]);
    }
    
} catch (Exception $e) {
    // Journaliser et renvoyer l'erreur
    error_log("Erreur lors de la synchronisation: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de la synchronisation',
        'error' => $e->getMessage()
    ]);
}

/**
 * Synchronise une table spécifique pour un utilisateur
 */
function synchronizeTable($db, $table, $userId, $deviceId) {
    try {
        // Récupérer le dernier timestamp de synchronisation pour cet appareil
        $query = "SELECT last_sync, table_name FROM sync_tracking 
                 WHERE user_id = :userId AND device_id = :deviceId AND table_name = :tableName
                 ORDER BY last_sync DESC LIMIT 1";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->bindParam(':deviceId', $deviceId);
        $stmt->bindParam(':tableName', $table);
        $stmt->execute();
        
        $syncInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        $lastSync = $syncInfo ? $syncInfo['last_sync'] : null;
        
        // Mettre à jour le timestamp de synchronisation
        $now = date('Y-m-d H:i:s');
        
        // Si nous avons déjà un enregistrement, mettre à jour
        if ($syncInfo) {
            $query = "UPDATE sync_tracking 
                     SET last_sync = :now 
                     WHERE user_id = :userId AND device_id = :deviceId AND table_name = :tableName";
        } else {
            // Sinon, insérer un nouvel enregistrement
            $query = "INSERT INTO sync_tracking (user_id, device_id, table_name, last_sync) 
                     VALUES (:userId, :deviceId, :tableName, :now)";
        }
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->bindParam(':deviceId', $deviceId);
        $stmt->bindParam(':tableName', $table);
        $stmt->bindParam(':now', $now);
        $stmt->execute();
        
        return [
            'table' => $table,
            'last_sync' => $lastSync,
            'current_sync' => $now,
            'device_id' => $deviceId
        ];
    } catch (Exception $e) {
        error_log("Erreur lors de la synchronisation de la table $table: " . $e->getMessage());
        return ['error' => $e->getMessage()];
    }
}

/**
 * Récupère toutes les tables associées à un utilisateur
 */
function getAllUserTables($db, $userId) {
    try {
        // Échapper proprement l'identifiant utilisateur pour éviter les injections SQL
        $userIdSafe = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
        
        // Rechercher toutes les tables avec un suffixe _userId
        $query = "SHOW TABLES LIKE '%\_$userIdSafe'";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $tables = [];
        while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
            $fullTableName = $row[0];
            // Extraire le nom de base de la table (sans le suffixe _userId)
            $baseTableName = preg_replace("/_$userIdSafe$/", '', $fullTableName);
            $tables[] = $baseTableName;
        }
        
        return $tables;
    } catch (Exception $e) {
        error_log("Erreur lors de la récupération des tables pour l'utilisateur $userId: " . $e->getMessage());
        return [];
    }
}

/**
 * Journalise la requête de synchronisation
 */
function logRequest($userId, $deviceId, $table) {
    try {
        $logDir = __DIR__ . '/logs';
        if (!file_exists($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $logFile = $logDir . '/sync_requests.log';
        $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
        $userAgent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : 'unknown';
        
        $logData = date('Y-m-d H:i:s') . " | User: $userId | Device: $deviceId | Table: $table | IP: $ip | UA: $userAgent" . PHP_EOL;
        file_put_contents($logFile, $logData, FILE_APPEND);
    } catch (Exception $e) {
        error_log("Erreur lors de la journalisation: " . $e->getMessage());
    }
}

/**
 * Nettoie une valeur pour éviter les injections
 */
function sanitizeValue($value) {
    return preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $value);
}
?>
