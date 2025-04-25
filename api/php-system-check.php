
<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

// Capturer les erreurs PHP pour les inclure dans la sortie
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Fonction pour capturer les erreurs PHP
function captureErrors() {
    $errors = [];
    set_error_handler(function($errno, $errstr, $errfile, $errline) use (&$errors) {
        $errors[] = [
            'type' => $errno,
            'message' => $errstr,
            'file' => $errfile,
            'line' => $errline
        ];
        // Ne pas terminer l'exécution du script
        return true;
    });
    return $errors;
}

// Fonction pour tester et retourner les résultats
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

$capturedErrors = captureErrors();
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
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'default_charset' => ini_get('default_charset'),
        'open_basedir' => ini_get('open_basedir')
    ];
});

// 2. Test Server Information
$tests[] = runTest('Information Serveur', function() {
    // Vérifier si les variables sont définies avant de les utiliser
    $serverInfo = [
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
        'server_name' => $_SERVER['SERVER_NAME'] ?? 'Non disponible',
        'server_protocol' => $_SERVER['SERVER_PROTOCOL'] ?? 'Non disponible',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible',
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Non disponible',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Non disponible',
        'https' => isset($_SERVER['HTTPS']) ? 'Oui' : 'Non',
        'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Non disponible',
        'request_time' => $_SERVER['REQUEST_TIME'] ?? 'Non disponible'
    ];
    
    // Ajouter des informations sur le serveur web
    if (function_exists('apache_get_version')) {
        $serverInfo['apache_version'] = apache_get_version();
    }
    
    // Détecter le VHost et les modules Apache
    if (function_exists('apache_get_modules')) {
        $serverInfo['apache_modules'] = apache_get_modules();
    }
    
    return $serverInfo;
});

// 3. Test File System Access
$tests[] = runTest('Accès Fichiers', function() {
    $testDir = __DIR__;
    $testFile = $testDir . '/test.txt';
    
    // Test write access
    $canWrite = false;
    try {
        file_put_contents($testFile, 'Test');
        $canWrite = file_exists($testFile);
    } catch (Exception $e) {
        throw new Exception('Échec d\'écriture: ' . $e->getMessage());
    }
    
    // Test read access
    $canRead = false;
    if ($canWrite) {
        try {
            $content = file_get_contents($testFile);
            $canRead = ($content === 'Test');
            unlink($testFile);
        } catch (Exception $e) {
            throw new Exception('Échec de lecture: ' . $e->getMessage());
        }
    }
    
    // Vérifier les permissions des répertoires clés
    $directoryPermissions = [];
    $testDirs = [
        'api' => dirname(__DIR__),
        'config' => __DIR__ . '/../config',
        'controllers' => __DIR__ . '/../controllers'
    ];
    
    foreach ($testDirs as $name => $dir) {
        if (file_exists($dir)) {
            $directoryPermissions[$name] = [
                'path' => $dir,
                'exists' => true,
                'is_readable' => is_readable($dir),
                'is_writable' => is_writable($dir),
                'permissions' => substr(sprintf('%o', fileperms($dir)), -4)
            ];
        } else {
            $directoryPermissions[$name] = [
                'path' => $dir,
                'exists' => false
            ];
        }
    }
    
    return [
        'directory' => $testDir,
        'is_writable' => is_writable($testDir),
        'can_write_file' => $canWrite,
        'can_read_file' => $canRead,
        'directory_permissions' => $directoryPermissions,
    ];
});

// 4. Test Database Connection
$tests[] = runTest('Base de données', function() {
    if (!extension_loaded('pdo_mysql')) {
        throw new Exception('Extension PDO MySQL non installée');
    }
    
    try {
        // Informations de connexion à la base de données
        $host = "p71x6d.myd.infomaniak.com";
        $dbname = "p71x6d_system";
        $username = "p71x6d_system";
        $password = "Trottinette43!";
        
        // Paramètres de connexion
        $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 5 // 5 secondes timeout
        ];
        
        // Tentative de connexion
        $start = microtime(true);
        $pdo = new PDO($dsn, $username, $password, $options);
        $connectionTime = round((microtime(true) - $start) * 1000, 2); // en ms
        
        // Tester une requête simple
        $stmt = $pdo->query("SELECT 1 AS test");
        $testResult = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Obtenir la version et d'autres infos
        $serverInfo = [
            'connected' => true,
            'server_version' => $pdo->getAttribute(PDO::ATTR_SERVER_VERSION),
            'client_version' => $pdo->getAttribute(PDO::ATTR_CLIENT_VERSION),
            'connection_time_ms' => $connectionTime,
            'basic_query_test' => $testResult ? 'success' : 'failed'
        ];
        
        // Tester les tables existantes
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $serverInfo['tables'] = $tables;
        
        // Vérifier l'existence de tables spécifiques
        $serverInfo['has_users_table'] = in_array('utilisateurs', $tables);
        $serverInfo['has_documents_table'] = in_array('documents', $tables);
        
        return $serverInfo;
    } catch (PDOException $e) {
        // Obtenir des informations détaillées sur l'erreur
        $errorInfo = [
            'message' => $e->getMessage(),
            'code' => $e->getCode(),
            'driver_code' => method_exists($e, 'errorInfo') ? $e->errorInfo()[1] : null,
        ];
        
        // Vérifier les problèmes spécifiques de connexion
        if (strpos($e->getMessage(), 'Connection refused') !== false) {
            $errorInfo['suggestion'] = 'Le serveur MySQL refuse la connexion. Vérifiez que le serveur est en cours d\'exécution et que l\'adresse est correcte.';
        } elseif (strpos($e->getMessage(), 'Access denied') !== false) {
            $errorInfo['suggestion'] = 'Identifiants incorrects. Vérifiez le nom d\'utilisateur et le mot de passe.';
        } elseif (strpos($e->getMessage(), 'Unknown database') !== false) {
            $errorInfo['suggestion'] = 'La base de données n\'existe pas. Vérifiez le nom de la base de données.';
        } elseif (strpos($e->getMessage(), 'Connection timed out') !== false) {
            $errorInfo['suggestion'] = 'Délai de connexion dépassé. Vérifiez que le serveur MySQL est accessible.';
        }
        
        throw new Exception(json_encode($errorInfo, JSON_UNESCAPED_UNICODE));
    }
});

// 5. Test Session Handling
$tests[] = runTest('Sessions', function() {
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }
    $session_info = [
        'session_save_path' => session_save_path(),
        'session_save_path_writable' => is_writable(session_save_path()),
        'session_name' => session_name()
    ];
    
    try {
        session_start();
        $_SESSION['test'] = 'test_value';
        $session_info['session_id'] = session_id();
        $session_info['session_started'] = true;
        $session_info['session_working'] = isset($_SESSION['test']) && $_SESSION['test'] === 'test_value';
        session_destroy();
    } catch (Exception $e) {
        $session_info['session_started'] = false;
        $session_info['session_error'] = $e->getMessage();
    }
    
    return $session_info;
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
        '/api/database-test.php' => 'Test base de données',
        '/api/login-test.php' => 'Test de connexion',
        '/api/check-users.php' => 'Vérification utilisateurs',
        '/api/auth' => 'Authentification'
    ];
    
    $results = [];
    foreach ($routes as $route => $description) {
        // Vérifier si le fichier existe au chemin attendu
        $routePath = $_SERVER['DOCUMENT_ROOT'] . $route;
        $exists = false;
        
        // Si la route se termine par .php, vérifier le fichier
        if (substr($route, -4) === '.php') {
            $exists = file_exists($routePath);
        } 
        // Sinon, c'est peut-être un contrôleur dans index.php
        else {
            // Supposons que tous les contrôleurs existent pour l'instant
            $exists = true;
        }
        
        $results[$route] = [
            'exists' => $exists,
            'description' => $description,
            'full_path' => $routePath
        ];
    }
    
    return $results;
});

// 8. Test CORS Headers
$tests[] = runTest('CORS', function() {
    $headers = [];
    
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
    } else {
        // Fallback pour récupérer les en-têtes HTTP
        foreach ($_SERVER as $key => $value) {
            if (substr($key, 0, 5) === 'HTTP_') {
                $header = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))));
                $headers[$header] = $value;
            }
        }
    }
    
    return [
        'origin' => $headers['Origin'] ?? ($headers['origin'] ?? 'Non défini'),
        'referer' => $headers['Referer'] ?? ($headers['referer'] ?? 'Non défini'),
        'user_agent' => $headers['User-Agent'] ?? ($headers['user-agent'] ?? 'Non défini'),
        'cors_headers_sent' => [
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'GET, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type'
        ]
    ];
});

// 9. Test API Execution
$tests[] = runTest('Exécution API', function() {
    $phpinfo_content = false;
    $phpinfo_error = null;
    
    try {
        ob_start();
        phpinfo(INFO_GENERAL);
        $phpinfo_content = ob_get_clean();
        $phpinfo_content = $phpinfo_content ? true : false;
    } catch (Exception $e) {
        $phpinfo_error = $e->getMessage();
    }
    
    // Vérifier l'inclusion de fichiers PHP
    $inclusionTests = [];
    $testFiles = [
        'config/database.php' => 'Configuration de la base de données',
        'phpinfo.php' => 'Informations PHP',
        'test.php' => 'Script de test'
    ];
    
    foreach ($testFiles as $file => $description) {
        $fullPath = __DIR__ . '/../' . $file;
        $inclusion = false;
        $error = null;
        
        if (file_exists($fullPath)) {
            try {
                ob_start();
                include($fullPath);
                ob_get_clean();
                $inclusion = true;
            } catch (Exception $e) {
                $error = $e->getMessage();
            }
        }
        
        $inclusionTests[$file] = [
            'exists' => file_exists($fullPath),
            'path' => $fullPath,
            'included' => $inclusion,
            'error' => $error,
            'description' => $description
        ];
    }
    
    // Test d'exécution shell
    $shell_exec_available = function_exists('shell_exec');
    $shell_result = null;
    $shell_error = null;
    
    if ($shell_exec_available) {
        try {
            $shell_result = shell_exec('php -v');
        } catch (Exception $e) {
            $shell_error = $e->getMessage();
        }
    }
    
    return [
        'phpinfo_available' => $phpinfo_content,
        'phpinfo_error' => $phpinfo_error,
        'file_inclusion_tests' => $inclusionTests,
        'shell_exec_available' => $shell_exec_available,
        'shell_exec_result' => $shell_result,
        'shell_exec_error' => $shell_error
    ];
});

// Prepare and send response
$response = [
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
    'tests' => $tests,
    'captured_errors' => $capturedErrors,
    'execution_time' => round(microtime(true) - $_SERVER['REQUEST_TIME_FLOAT'], 4) . 's'
];

// Restaurer le gestionnaire d'erreurs par défaut
restore_error_handler();

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
