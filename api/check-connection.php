
<?php
/**
 * Script simplifié pour vérifier la connexion, les headers, le routing
 * Permet de détecter des problèmes d'infrastructure sans toucher à la DB
 */

// Définir le type de contenu JSON
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'accès
error_log("=== EXÉCUTION DE check-connection.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Paramètres du serveur
$server_info = [
    'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu',
    'protocol' => $_SERVER['SERVER_PROTOCOL'] ?? 'Inconnu',
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'Inconnu',
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Inconnu',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Inconnu',
    'request_time' => date('Y-m-d H:i:s', $_SERVER['REQUEST_TIME'] ?? time()),
    'php_version' => PHP_VERSION,
    'extensions' => get_loaded_extensions(),
    'headers_sent' => headers_sent(),
    'api_folder_exists' => is_dir('api'),
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Inconnu',
    'api_path' => dirname(__FILE__),
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Inconnu'
];

// Vérifier si PDO MySQL est disponible
$pdo_mysql_available = in_array('mysql', PDO::getAvailableDrivers());

// Vérifier les fichiers de configuration
$config_files = [
    'config/database.php' => file_exists(__DIR__ . '/config/database.php'),
    'config/db_config.json' => file_exists(__DIR__ . '/config/db_config.json'),
    'config/env.php' => file_exists(__DIR__ . '/config/env.php')
];

// Vérifier les permissions
$permissions = [
    'api_dir_readable' => is_readable(__DIR__),
    'api_dir_writable' => is_writable(__DIR__),
    'config_dir_exists' => is_dir(__DIR__ . '/config'),
    'config_dir_readable' => is_dir(__DIR__ . '/config') ? is_readable(__DIR__ . '/config') : false,
    'temp_writable' => is_writable(sys_get_temp_dir()),
];

// Renvoyer les informations
echo json_encode([
    'status' => 'success',
    'message' => 'Vérification de connexion réussie',
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => $server_info,
    'pdo_mysql_available' => $pdo_mysql_available,
    'pdo_drivers' => PDO::getAvailableDrivers(),
    'config_files' => $config_files,
    'permissions' => $permissions
], JSON_PRETTY_PRINT);
?>
