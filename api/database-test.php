
<?php
// Fichier de test pour la connexion à la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Désactiver la mise en cache
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Capturer les erreurs PHP pour les inclure dans la sortie JSON
ob_start();

try {
    // Informations sur le serveur et l'environnement
    $serverInfo = [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Vérifier que les fichiers requis existent avant de les inclure
    $configFilePath = __DIR__ . '/config/database.php';
    
    if (!file_exists($configFilePath)) {
        throw new Exception("Fichier de configuration de la base de données non trouvé: " . $configFilePath);
    }
    
    // Inclure la configuration de la base de données
    require_once $configFilePath;
    
    // Vérifier que la classe Database a bien été définie
    if (!class_exists('Database')) {
        throw new Exception("La classe Database n'est pas définie dans le fichier de configuration");
    }
    
    // Créer une instance de Database
    $database = new Database();
    
    // Tester la connexion à la base de données
    $connection = $database->getConnection(false);
    $isConnected = $database->is_connected;
    
    // Préparer la réponse
    $response = [
        'status' => $isConnected ? 'success' : 'error',
        'message' => $isConnected ? 'Connexion à la base de données réussie' : 'Échec de la connexion à la base de données',
        'server_info' => $serverInfo
    ];
    
    // Si la connexion a réussi, ajouter des informations sur la base de données
    if ($isConnected) {
        $dbInfo = [];
        
        try {
            // Nom de la base de données
            $stmt = $connection->query("SELECT DATABASE() AS db_name");
            $dbInfo['database'] = $stmt->fetch(PDO::FETCH_ASSOC)['db_name'];
            
            // Liste des tables
            $stmt = $connection->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $dbInfo['tables'] = $tables;
            $dbInfo['table_count'] = count($tables);
            
            // Taille de la base de données
            $stmt = $connection->query("SELECT
                SUM(data_length + index_length) AS size
                FROM information_schema.TABLES
                WHERE table_schema = DATABASE()");
            $size = $stmt->fetch(PDO::FETCH_ASSOC)['size'];
            $dbInfo['size'] = $size ? round($size / (1024 * 1024), 2) . ' MB' : '0 MB';
            
            // Version du serveur
            $dbInfo['server_version'] = $connection->getAttribute(PDO::ATTR_SERVER_VERSION);
            $dbInfo['client_version'] = $connection->getAttribute(PDO::ATTR_CLIENT_VERSION);
            
            $response['db_info'] = $dbInfo;
        } catch (Exception $e) {
            $response['db_info_error'] = $e->getMessage();
        }
    } else {
        // Si la connexion a échoué, ajouter l'erreur à la réponse
        $response['error'] = $database->connection_error;
    }
    
    // Récupérer les erreurs capturées
    $phpOutput = ob_get_clean();
    if (!empty($phpOutput)) {
        $response['php_output'] = $phpOutput;
    }
    
    // Réponse JSON
    http_response_code($isConnected ? 200 : 500);
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    // Récupérer les erreurs capturées
    $phpOutput = ob_get_clean();
    
    // Réponse d'erreur
    $errorResponse = [
        'status' => 'error',
        'message' => 'Erreur lors du test de la base de données',
        'error' => $e->getMessage(),
        'server_info' => $serverInfo ?? []
    ];
    
    if (!empty($phpOutput)) {
        $errorResponse['php_output'] = $phpOutput;
    }
    
    http_response_code(500);
    echo json_encode($errorResponse, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>
