
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
    
    // Vérifier si la configuration de la base de données existe
    $configFilePath = __DIR__ . '/config/database.php';
    
    if (!file_exists($configFilePath)) {
        throw new Exception("Fichier de configuration de la base de données non trouvé: " . $configFilePath);
    }
    
    // Réponse de base pour indiquer que le test est en cours
    $response = [
        'status' => 'pending',
        'message' => 'Test de connexion à la base de données en cours',
        'server_info' => $serverInfo,
        'config_file' => [
            'path' => $configFilePath,
            'exists' => file_exists($configFilePath)
        ]
    ];
    
    // Tenter d'inclure la configuration de la base de données
    try {
        require_once $configFilePath;
        $response['config_loaded'] = true;
    } catch (Exception $e) {
        throw new Exception("Erreur lors du chargement de la configuration: " . $e->getMessage());
    }
    
    // Vérifier que la classe Database a bien été définie
    if (!class_exists('Database')) {
        throw new Exception("La classe Database n'est pas définie dans le fichier de configuration");
    }
    
    // Créer une instance de Database
    try {
        $database = new Database();
        $response['database_instance'] = 'created';
    } catch (Exception $e) {
        throw new Exception("Erreur lors de la création de l'instance Database: " . $e->getMessage());
    }
    
    // Tester la connexion à la base de données
    try {
        $connection = $database->getConnection(false);
        $isConnected = $database->is_connected;
        
        // Préparer la réponse
        $response['status'] = $isConnected ? 'success' : 'error';
        $response['message'] = $isConnected ? 'Connexion à la base de données réussie' : 'Échec de la connexion à la base de données';
        
        // Si la connexion a réussi, ajouter des informations sur la base de données
        if ($isConnected && $connection) {
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
                
                // Version du serveur
                $dbInfo['server_version'] = $connection->getAttribute(PDO::ATTR_SERVER_VERSION);
                $dbInfo['client_version'] = $connection->getAttribute(PDO::ATTR_CLIENT_VERSION);
                
                $response['db_info'] = $dbInfo;
            } catch (Exception $e) {
                $response['db_info_error'] = $e->getMessage();
            }
        } else {
            // Si la connexion a échoué, ajouter l'erreur à la réponse
            $response['error'] = $database->connection_error ?? 'Erreur de connexion non spécifiée';
        }
    } catch (Exception $e) {
        throw new Exception("Erreur lors du test de connexion: " . $e->getMessage());
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
        'server_info' => $serverInfo ?? [],
        'trace' => $e->getTraceAsString()
    ];
    
    if (!empty($phpOutput)) {
        $errorResponse['php_output'] = $phpOutput;
    }
    
    http_response_code(500);
    echo json_encode($errorResponse, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>
