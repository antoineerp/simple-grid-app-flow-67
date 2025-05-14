
<?php
// Script de test simple pour l'API
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Activer la journalisation des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/test_errors.log');

// Informations du serveur
$server_info = [
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible',
    'script_path' => $_SERVER['SCRIPT_FILENAME'] ?? 'Non disponible',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Non disponible',
    'http_host' => $_SERVER['HTTP_HOST'] ?? 'Non disponible',
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Non disponible',
    'current_dir' => getcwd(),
    'timestamp' => date('Y-m-d H:i:s')
];

// Extensions PHP
$extensions = get_loaded_extensions();
sort($extensions);

// Tests des chemins
$paths_test = [
    'api_dir' => [
        'path' => __DIR__,
        'exists' => is_dir(__DIR__),
        'writable' => is_writable(__DIR__)
    ],
    'config_dir' => [
        'path' => __DIR__ . '/config',
        'exists' => is_dir(__DIR__ . '/config'),
        'writable' => is_dir(__DIR__ . '/config') ? is_writable(__DIR__ . '/config') : null
    ],
    'log_dir' => [
        'path' => __DIR__ . '/logs',
        'exists' => is_dir(__DIR__ . '/logs'),
        'writable' => is_dir(__DIR__ . '/logs') ? is_writable(__DIR__ . '/logs') : null
    ]
];

// Configuration de la BD
$db_config_file = __DIR__ . '/config/db_config.json';
$db_config = [];
$db_test = [
    'config_exists' => file_exists($db_config_file),
    'config_readable' => file_exists($db_config_file) ? is_readable($db_config_file) : null,
    'connection_test' => null,
    'error' => null
];

if ($db_test['config_exists'] && $db_test['config_readable']) {
    $db_config = json_decode(file_get_contents($db_config_file), true);
    $db_test['config_valid'] = $db_config !== null;
    
    if ($db_test['config_valid']) {
        try {
            $dsn = "mysql:host={$db_config['host']};dbname={$db_config['db_name']}";
            $options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION];
            
            $pdo = new PDO($dsn, $db_config['username'], $db_config['password'], $options);
            $db_test['connection_test'] = true;
            $db_test['version'] = $pdo->query('SELECT VERSION() as version')->fetch(PDO::FETCH_ASSOC)['version'];
        } catch (PDOException $e) {
            $db_test['connection_test'] = false;
            $db_test['error'] = $e->getMessage();
        }
    }
}

// Construire la réponse JSON
$response = [
    'status' => 'success',
    'message' => 'API test successful',
    'server_info' => $server_info,
    'php_extensions' => $extensions,
    'paths_test' => $paths_test,
    'db_test' => $db_test
];

// Envoyer la réponse JSON
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
