
<?php
// Diagnostic de la configuration PHP
header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *");
header("Cache-Control: no-cache, no-store, must-revalidate");

$diagnostics = [
    'php_running' => true,
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Non disponible',
    'http_host' => $_SERVER['HTTP_HOST'] ?? 'Non disponible',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Non disponible',
    'https' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
    'modules' => function_exists('apache_get_modules') ? apache_get_modules() : 'Non disponible',
    'extensions' => get_loaded_extensions(),
    'date_time' => date('Y-m-d H:i:s'),
    'timezone' => date_default_timezone_get(),
    'pdo_drivers' => PDO::getAvailableDrivers(),
    'headers_sent' => headers_sent(),
    'output_buffering' => ob_get_level()
];

// Tester la création de fichier (permissions)
$test_file = dirname(__FILE__) . '/test_write_permission.txt';
$file_write_test = @file_put_contents($test_file, 'Test write: ' . date('Y-m-d H:i:s'));
$diagnostics['can_write_files'] = $file_write_test !== false;
if (file_exists($test_file)) {
    @unlink($test_file);
}

// Vérifier si la connexion à la base de données fonctionne
try {
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_richard";
    $password = "Trottinette43!";
    
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5,
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    $diagnostics['db_connection'] = [
        'success' => true,
        'server_version' => $pdo->getAttribute(PDO::ATTR_SERVER_VERSION),
        'client_version' => $pdo->getAttribute(PDO::ATTR_CLIENT_VERSION)
    ];
} catch (PDOException $e) {
    $diagnostics['db_connection'] = [
        'success' => false,
        'error' => $e->getMessage()
    ];
}

// Vérifier les fichiers PHP clés
$key_files = [
    'test.php',
    'check.php',
    'users.php',
    'check-users.php',
    '.htaccess'
];

$diagnostics['files_exist'] = [];
foreach ($key_files as $file) {
    $diagnostics['files_exist'][$file] = file_exists(dirname(__FILE__) . '/' . $file);
}

echo json_encode($diagnostics, JSON_PRETTY_PRINT);
?>
