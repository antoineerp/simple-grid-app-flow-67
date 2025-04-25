
<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

// Function to test and return results
function runTest($name, $callback) {
    try {
        $result = $callback();
        return [
            'name' => $name,
            'status' => 'success',
            'result' => $result
        ];
    } catch (Exception $e) {
        return [
            'name' => $name,
            'status' => 'error',
            'error' => $e->getMessage()
        ];
    }
}

$tests = [];

// 1. Test PHP Version and Basic Configuration
$tests[] = runTest('Configuration PHP', function() {
    return [
        'version' => phpversion(),
        'server_api' => php_sapi_name(),
        'modules' => get_loaded_extensions(),
        'display_errors' => ini_get('display_errors'),
        'error_reporting' => error_reporting(),
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time'),
        'post_max_size' => ini_get('post_max_size'),
        'upload_max_filesize' => ini_get('upload_max_filesize')
    ];
});

// 2. Test Server Information
$tests[] = runTest('Information Serveur', function() {
    return [
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
        'server_name' => $_SERVER['SERVER_NAME'] ?? 'Non disponible',
        'server_protocol' => $_SERVER['SERVER_PROTOCOL'] ?? 'Non disponible',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible',
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Non disponible',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Non disponible',
        'https' => isset($_SERVER['HTTPS']) ? 'Oui' : 'Non'
    ];
});

// 3. Test File System Access
$tests[] = runTest('Accès Fichiers', function() {
    $testDir = __DIR__;
    $testFile = $testDir . '/test.txt';
    
    // Test write access
    file_put_contents($testFile, 'Test');
    $canWrite = file_exists($testFile);
    
    // Test read access
    $canRead = false;
    if ($canWrite) {
        $content = file_get_contents($testFile);
        $canRead = ($content === 'Test');
        unlink($testFile);
    }
    
    return [
        'directory' => $testDir,
        'is_writable' => is_writable($testDir),
        'can_write_file' => $canWrite,
        'can_read_file' => $canRead
    ];
});

// 4. Test Database Connection
$tests[] = runTest('Base de données', function() {
    if (!extension_loaded('pdo_mysql')) {
        throw new Exception('Extension PDO MySQL non installée');
    }
    
    try {
        $host = "p71x6d.myd.infomaniak.com";
        $dbname = "p71x6d_system";
        $username = "p71x6d_system";
        $password = "Trottinette43!";
        
        $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
        $pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        
        return [
            'connected' => true,
            'server_version' => $pdo->getAttribute(PDO::ATTR_SERVER_VERSION),
            'client_version' => $pdo->getAttribute(PDO::ATTR_CLIENT_VERSION)
        ];
    } catch (PDOException $e) {
        throw new Exception('Erreur de connexion: ' . $e->getMessage());
    }
});

// 5. Test Session Handling
$tests[] = runTest('Sessions', function() {
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }
    session_start();
    $_SESSION['test'] = 'test_value';
    $sessionWorking = isset($_SESSION['test']) && $_SESSION['test'] === 'test_value';
    session_destroy();
    
    return [
        'session_status' => session_status(),
        'session_working' => $sessionWorking,
        'session_save_path' => session_save_path(),
        'session_name' => session_name()
    ];
});

// 6. Test JSON Handling
$tests[] = runTest('JSON', function() {
    $testArray = ['test' => 'value', 'number' => 123, 'unicode' => 'éàç'];
    $encoded = json_encode($testArray);
    $decoded = json_decode($encoded, true);
    
    return [
        'can_encode' => $encoded !== false,
        'can_decode' => $decoded !== null,
        'json_last_error' => json_last_error(),
        'json_last_error_msg' => json_last_error_msg(),
        'sample' => $encoded
    ];
});

// 7. Test API Routing
$tests[] = runTest('Routage API', function() {
    $routes = [
        '/api/' => 'Page principale de l\'API',
        '/api/phpinfo.php' => 'Information PHP',
        '/api/test.php' => 'Test simple',
        '/api/diagnostic.php' => 'Diagnostic système',
        '/api/login-test.php' => 'Test de connexion'
    ];
    
    $results = [];
    foreach ($routes as $route => $description) {
        $exists = file_exists($_SERVER['DOCUMENT_ROOT'] . $route);
        $results[$route] = [
            'exists' => $exists,
            'description' => $description,
            'accessible' => $exists ? @file_get_contents('http://' . $_SERVER['HTTP_HOST'] . $route) !== false : false
        ];
    }
    
    return $results;
});

// 8. Test CORS Headers
$tests[] = runTest('CORS', function() {
    $headers = getallheaders();
    return [
        'origin' => $headers['Origin'] ?? 'Non défini',
        'cors_headers_sent' => [
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'GET, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type'
        ]
    ];
});

// Prepare and send response
$response = [
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
    'tests' => $tests
];

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
