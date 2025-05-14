
<?php
// Script de réparation d'urgence pour l'API PHP
header('Content-Type: application/json');

// Activer la journalisation des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/emergency_fix_errors.log');

// Journaliser l'accès
$access_log = fopen(__DIR__ . '/access.log', 'a');
fwrite($access_log, date('Y-m-d H:i:s') . " - Emergency Fix accessed from " . ($_SERVER['REMOTE_ADDR'] ?? 'Unknown IP') . "\n");
fclose($access_log);

// Fonction pour tester la connexion à la base de données
function test_database_connection() {
    try {
        $config_file = __DIR__ . '/config/db_config.json';
        
        if (!file_exists($config_file)) {
            throw new Exception("Fichier de configuration non trouvé: $config_file");
        }
        
        $config = json_decode(file_get_contents($config_file), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Erreur de décodage JSON: " . json_last_error_msg());
        }
        
        $dsn = "mysql:host=" . $config['host'] . ";dbname=" . $config['db_name'] . ";charset=utf8";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $start_time = microtime(true);
        $pdo = new PDO($dsn, $config['username'], $config['password'], $options);
        $time = round((microtime(true) - $start_time) * 1000, 2);
        
        // Vérifier que la connexion fonctionne avec une requête simple
        $stmt = $pdo->query("SELECT 1 as test, VERSION() as version");
        $result = $stmt->fetch();
        
        return [
            'success' => true,
            'connection_time' => $time,
            'mysql_version' => $result['version'],
            'php_version' => phpversion(),
            'pdo_drivers' => implode(', ', PDO::getAvailableDrivers())
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'error_type' => get_class($e)
        ];
    }
}

// Fonction pour créer un fichier de test PHP simple
function create_test_file() {
    try {
        $test_content = <<<EOT
<?php
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'message' => 'PHP test file executed successfully',
    'time' => date('c'),
    'php_version' => phpversion()
]);
?>
EOT;

        $file_path = __DIR__ . '/simple-test.php';
        $success = file_put_contents($file_path, $test_content) !== false;
        
        return [
            'success' => $success,
            'file_path' => $file_path
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Fonction pour vérifier les journaux PHP
function check_php_logs() {
    $logs = [];
    
    // Vérifier le journal d'erreurs PHP standard
    $error_log = ini_get('error_log');
    if (!empty($error_log) && file_exists($error_log)) {
        $logs['error_log'] = [
            'path' => $error_log,
            'exists' => true,
            'writable' => is_writable($error_log),
            'size' => filesize($error_log),
            'last_lines' => array_slice(file($error_log, FILE_IGNORE_NEW_LINES), -5)
        ];
    } else {
        $logs['error_log'] = [
            'path' => $error_log ?? 'Non défini',
            'exists' => false
        ];
    }
    
    // Vérifier le journal d'erreurs d'Apache (si accessible)
    $apache_log = '/var/log/apache2/error.log';
    if (file_exists($apache_log) && is_readable($apache_log)) {
        $logs['apache_log'] = [
            'path' => $apache_log,
            'exists' => true,
            'readable' => true,
            'size' => filesize($apache_log),
            'last_lines' => array_slice(file($apache_log, FILE_IGNORE_NEW_LINES), -5)
        ];
    }
    
    return $logs;
}

// Exécuter les diagnostics
$results = [
    'timestamp' => date('c'),
    'php_execution' => [
        'success' => true,
        'version' => phpversion(),
        'sapi' => php_sapi_name(),
        'extensions' => implode(', ', array_slice(get_loaded_extensions(), 0, 10)) . '...'
    ],
    'database_connection' => test_database_connection(),
    'test_file' => create_test_file(),
    'logs' => check_php_logs(),
    'server_info' => [
        'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Inconnu',
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Inconnu',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Inconnu'
    ],
    'fixes_applied' => [
        'api_dir_permission' => @chmod(__DIR__, 0755),
        'api_dir_permission_after' => sprintf('%o', fileperms(__DIR__) & 0777)
    ]
];

// Renvoyer les résultats au format JSON
echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
