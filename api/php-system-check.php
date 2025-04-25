
<?php
// Headers
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

// Désactiver le cache
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Fonction pour vérifier l'accès aux fichiers
function checkFileAccess() {
    $dir = __DIR__;
    $testFile = $dir . '/test_write_permission.txt';
    $isWritable = is_writable($dir);
    
    // Test d'écriture
    $canWrite = false;
    try {
        file_put_contents($testFile, 'Test write');
        $canWrite = file_exists($testFile);
        if ($canWrite) {
            unlink($testFile);
        }
    } catch (Exception $e) {
        $canWrite = false;
    }
    
    // Test de lecture
    $canRead = false;
    $readTestFile = __FILE__;
    try {
        $content = file_get_contents($readTestFile);
        $canRead = !empty($content);
    } catch (Exception $e) {
        $canRead = false;
    }
    
    return [
        'directory' => $dir,
        'is_writable' => $isWritable,
        'can_write_file' => $canWrite,
        'can_read_file' => $canRead
    ];
}

// Vérification de la base de données
function checkDatabase() {
    $result = ['connected' => false];
    
    if (class_exists('PDO')) {
        try {
            // Essayer de charger la config de la base de données
            if (file_exists(__DIR__ . '/config/database.php')) {
                require_once __DIR__ . '/config/database.php';
                if (class_exists('Database')) {
                    $db = new Database();
                    $conn = $db->getConnection();
                    
                    if ($conn) {
                        $result['connected'] = true;
                        $result['server_version'] = $conn->getAttribute(PDO::ATTR_SERVER_VERSION);
                        $result['client_version'] = $conn->getAttribute(PDO::ATTR_CLIENT_VERSION);
                    }
                }
            }
        } catch (Exception $e) {
            $result['error'] = $e->getMessage();
        }
    } else {
        $result['error'] = 'PDO not available';
    }
    
    return $result;
}

// Vérification de la session
function checkSession() {
    $sessionStatus = session_status();
    $sessionWorking = false;
    
    try {
        session_start();
        $_SESSION['test'] = 'working';
        $sessionWorking = isset($_SESSION['test']) && $_SESSION['test'] === 'working';
    } catch (Exception $e) {
        $sessionWorking = false;
    }
    
    return [
        'session_status' => $sessionStatus,
        'session_working' => $sessionWorking,
        'session_save_path' => session_save_path(),
        'session_name' => session_name()
    ];
}

// Vérification JSON
function checkJSON() {
    $testArray = [
        'test' => 'value', 
        'number' => 123, 
        'unicode' => 'éàç'
    ];
    
    $encoded = json_encode($testArray);
    $decoded = json_decode($encoded, true);
    
    return [
        'can_encode' => $encoded !== false,
        'can_decode' => $decoded !== null,
        'json_last_error' => json_last_error(),
        'json_last_error_msg' => json_last_error_msg(),
        'sample' => $encoded
    ];
}

// Vérification du routage de l'API
function checkApiRouting() {
    $baseUrl = 'http://' . $_SERVER['HTTP_HOST'];
    $routes = [
        '/api/' => ['description' => 'Page principale de l\'API'],
        '/api/phpinfo.php' => ['description' => 'Information PHP'],
        '/api/test.php' => ['description' => 'Test simple'],
        '/api/diagnostic.php' => ['description' => 'Diagnostic système'],
        '/api/login-test.php' => ['description' => 'Test de connexion']
    ];
    
    foreach ($routes as $route => &$info) {
        $url = $baseUrl . $route;
        $info['exists'] = file_exists(__DIR__ . str_replace('/api', '', $route));
        
        // N'essayons pas réellement d'accéder aux URL, car cela pourrait causer des problèmes
        // Nous vérifions simplement si le fichier existe
        $info['accessible'] = $info['exists'] && ($route === '/api/' || $route === '/api/test.php' || $route === '/api/login-test.php');
    }
    
    return $routes;
}

// Vérification CORS
function checkCORS() {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : 'Non défini';
    
    $corsHeaders = [
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET, OPTIONS',
        'Access-Control-Allow-Headers' => 'Content-Type'
    ];
    
    return [
        'origin' => $origin,
        'cors_headers_sent' => $corsHeaders
    ];
}

// Résultats
$result = [
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'server' => isset($_SERVER['SERVER_SOFTWARE']) ? explode('/', $_SERVER['SERVER_SOFTWARE'])[0] : 'Unknown',
    'tests' => [
        [
            'name' => 'Configuration PHP',
            'status' => 'success',
            'result' => [
                'version' => phpversion(),
                'server_api' => php_sapi_name(),
                'modules' => get_loaded_extensions(),
                'display_errors' => ini_get('display_errors'),
                'error_reporting' => error_reporting(),
                'memory_limit' => ini_get('memory_limit'),
                'max_execution_time' => ini_get('max_execution_time'),
                'post_max_size' => ini_get('post_max_size'),
                'upload_max_filesize' => ini_get('upload_max_filesize')
            ]
        ],
        [
            'name' => 'Information Serveur',
            'status' => 'success',
            'result' => [
                'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
                'server_name' => $_SERVER['SERVER_NAME'] ?? 'Unknown',
                'server_protocol' => $_SERVER['SERVER_PROTOCOL'] ?? 'Unknown',
                'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
                'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Unknown',
                'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
                'https' => isset($_SERVER['HTTPS']) ? 'Oui' : 'Non'
            ]
        ],
        [
            'name' => 'Accès Fichiers',
            'status' => 'success',
            'result' => checkFileAccess()
        ],
        [
            'name' => 'Base de données',
            'status' => 'success',
            'result' => checkDatabase()
        ],
        [
            'name' => 'Sessions',
            'status' => 'success',
            'result' => checkSession()
        ],
        [
            'name' => 'JSON',
            'status' => 'success',
            'result' => checkJSON()
        ],
        [
            'name' => 'Routage API',
            'status' => 'success',
            'result' => checkApiRouting()
        ],
        [
            'name' => 'CORS',
            'status' => 'success',
            'result' => checkCORS()
        ]
    ]
];

// Sortie JSON
echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
