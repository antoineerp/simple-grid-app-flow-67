
<?php
// Script de diagnostic complet du serveur
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Informations générales
$serverInfo = [
    "php_version" => phpversion(),
    "server_software" => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
    "document_root" => $_SERVER['DOCUMENT_ROOT'],
    "request_time" => date('Y-m-d H:i:s', $_SERVER['REQUEST_TIME']),
    "remote_addr" => $_SERVER['REMOTE_ADDR'],
    "http_user_agent" => $_SERVER['HTTP_USER_AGENT'] ?? 'Non disponible'
];

// Vérifier les extensions PHP nécessaires
$requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'mbstring', 'curl'];
$extensionsStatus = [];
foreach ($requiredExtensions as $ext) {
    $extensionsStatus[$ext] = extension_loaded($ext);
}

// Vérifier les dossiers clés
$directories = [
    '.' => 'Répertoire racine',
    './assets' => 'Répertoire assets',
    './api' => 'Répertoire API'
];
$directoriesStatus = [];
foreach ($directories as $dir => $name) {
    $directoriesStatus[$name] = [
        'exists' => is_dir($dir),
        'writable' => is_writable($dir),
        'file_count' => is_dir($dir) ? count(scandir($dir)) - 2 : 0
    ];
}

// Vérifier les fichiers essentiels
$criticalFiles = [
    'api/index.php' => 'API Principal',
    'api/login-test.php' => 'Test de connexion',
    'api/.htaccess' => 'Configuration Apache API'
];
$filesStatus = [];
foreach ($criticalFiles as $file => $name) {
    $filesStatus[$name] = [
        'exists' => file_exists($file),
        'size' => file_exists($file) ? filesize($file) : 0,
        'readable' => file_exists($file) && is_readable($file)
    ];
}

// Tester la connexion à la base de données
$dbConnection = false;
$dbError = '';
try {
    $host = "p71x6d.myd.infomaniak.com";
    $db_name = "p71x6d_system";
    $username = "p71x6d_system";
    $password = "Trottinette43!";
    $dsn = "mysql:host=$host;dbname=$db_name;charset=utf8mb4";
    
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5,
    ];
    
    $conn = new PDO($dsn, $username, $password, $options);
    $dbVersion = $conn->query('SELECT VERSION() as version')->fetch();
    $dbConnection = true;
    $dbInfo = [
        'connected' => true,
        'version' => $dbVersion['version'] ?? 'Non disponible'
    ];
} catch (PDOException $e) {
    $dbConnection = false;
    $dbError = $e->getMessage();
    $dbInfo = [
        'connected' => false,
        'error' => $dbError,
        'code' => $e->getCode()
    ];
}

// Tester les services API
$apiEndpoints = [
    '/api/' => 'API racine',
    '/api/test.php' => 'Test simple',
    '/api/login-test.php' => 'Service de connexion'
];
$apiTests = [];
foreach ($apiEndpoints as $endpoint => $name) {
    $url = 'http://' . $_SERVER['HTTP_HOST'] . $endpoint;
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $apiTests[$name] = [
        'url' => $url,
        'http_code' => $httpCode,
        'response_size' => strlen($response)
    ];
}

// Assembler et renvoyer la réponse
$diagnosticResult = [
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => $serverInfo,
    'php_extensions' => $extensionsStatus,
    'directories' => $directoriesStatus,
    'critical_files' => $filesStatus,
    'database' => $dbInfo,
    'api_endpoints' => $apiTests,
    'environment' => getenv('APP_ENV') ?: 'Non défini',
];

echo json_encode($diagnosticResult, JSON_PRETTY_PRINT);
?>
