<?php
// Script de test direct et simplifié de la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Journalisation
error_log("=== DÉBUT DU TEST DE CONNEXION À LA BASE DE DONNÉES ===");

try {
    // Configuration de la base de données (depuis db_config.json)
    $config_file = __DIR__ . '/config/db_config.json';
    if (!file_exists($config_file)) {
        throw new Exception("Fichier de configuration non trouvé: $config_file");
    }
    
    $json = file_get_contents($config_file);
    $config = json_decode($json, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Erreur de décodage JSON: " . json_last_error_msg());
    }
    
    if (!isset($config['host']) || !isset($config['username'])) {
        throw new Exception("Configuration incomplète dans db_config.json");
    }
    
    $host = $config['host'];
    $dbname = $config['db_name'] ?? '';
    $username = $config['username'];
    $password = $config['password'] ?? '';
    
    // Tester la connexion PDO directement
    try {
        $dsn = "mysql:host={$host};charset=utf8";
        if (!empty($dbname)) {
            $dsn .= ";dbname={$dbname}";
        }
        
        $pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        $version = $pdo->query('SELECT VERSION()')->fetchColumn();
        
        $tables = [];
        if (!empty($dbname)) {
            $tables_result = $pdo->query("SHOW TABLES");
            if ($tables_result) {
                $tables = $tables_result->fetchAll(PDO::FETCH_COLUMN);
            }
        }
        
        $pdo_info = [
            'status' => 'success',
            'version' => $version,
            'tables_count' => count($tables),
            'tables' => $tables
        ];
    } catch (PDOException $e) {
        $pdo_info = [
            'status' => 'error',
            'message' => 'Erreur PDO: ' . $e->getMessage()
        ];
    }
    
    // Récupérer des informations sur le serveur
    $server_info = [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Inconnu',
        'request_time' => date('Y-m-d H:i:s'),
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Inconnue',
        'script_path' => __FILE__
    ];
    
    // Vérifier les extensions PHP requises
    $php_extensions = [
        'pdo' => extension_loaded('pdo'),
        'pdo_mysql' => extension_loaded('pdo_mysql'),
        'mysqli' => extension_loaded('mysqli'),
        'json' => extension_loaded('json'),
        'mbstring' => extension_loaded('mbstring')
    ];
    
    // Tenter une connexion MySQLi
    $mysqli_info = [];
    if (extension_loaded('mysqli')) {
        try {
            $mysqli = new mysqli($host, $username, $password, $dbname);
            
            if ($mysqli->connect_error) {
                $mysqli_info = [
                    'status' => 'error',
                    'message' => 'Erreur de connexion: ' . $mysqli->connect_error
                ];
            } else {
                $tables = [];
                $tables_result = $mysqli->query("SHOW TABLES");
                if ($tables_result) {
                    while ($row = $tables_result->fetch_array()) {
                        $tables[] = $row[0];
                    }
                }
                
                $mysqli_info = [
                    'status' => 'success',
                    'version' => $mysqli->server_info,
                    'tables_count' => count($tables),
                    'tables' => $tables
                ];
                
                $mysqli->close();
            }
        } catch (Exception $e) {
            $mysqli_info = [
                'status' => 'error',
                'message' => 'Exception: ' . $e->getMessage()
            ];
        }
    } else {
        $mysqli_info = [
            'status' => 'error',
            'message' => 'Extension MySQLi non disponible'
        ];
    }
    
    // Compiler toutes les informations et renvoyer le résultat
    echo json_encode([
        'timestamp' => date('Y-m-d H:i:s'),
        'server_info' => $server_info,
        'php_extensions' => $php_extensions,
        'config' => [
            'host' => $host,
            'db_name' => $dbname,
            'username' => $username,
            'password_set' => !empty($password)
        ],
        'mysqli_test' => $mysqli_info,
        'pdo_test' => $pdo_info
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    error_log("Exception dans le test de connexion: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du test de connexion: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
} finally {
    error_log("=== FIN DU TEST DE CONNEXION À LA BASE DE DONNÉES ===");
}
?>
