
<?php
// Entête pour afficher en JSON
header('Content-Type: application/json; charset=utf-8');

// Pour le CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Fonction pour afficher la version de PHP et d'autres informations
function getPhpInfo() {
    return [
        'php_version' => phpversion(),
        'extensions' => [
            'json' => extension_loaded('json'),
            'pdo' => extension_loaded('pdo'),
            'pdo_mysql' => extension_loaded('pdo_mysql'),
            'mbstring' => extension_loaded('mbstring')
        ],
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'],
        'script_filename' => $_SERVER['SCRIPT_FILENAME'],
        'request_uri' => $_SERVER['REQUEST_URI'],
        'execution_mode' => php_sapi_name()
    ];
}

// Vérifier l'accès aux fichiers importants
function checkFiles() {
    $files_to_check = [
        'api/index.php',
        'api/login-test.php',
        'api/auth.php',
        'api/.htaccess',
        'api/controllers/AuthController.php',
        'api/config/database.php'
    ];
    
    $results = [];
    foreach ($files_to_check as $file) {
        $full_path = $_SERVER['DOCUMENT_ROOT'] . '/' . $file;
        $readable = is_readable($full_path);
        $exists = file_exists($full_path);
        
        $results[$file] = [
            'exists' => $exists,
            'readable' => $readable,
            'size' => $exists ? filesize($full_path) : 0,
            'permissions' => $exists ? substr(sprintf('%o', fileperms($full_path)), -4) : 'N/A'
        ];
    }
    
    return $results;
}

// Tests de connexion pour vérifier les redirections
function testEndpoints() {
    $endpoints = [
        '/api/' => 'GET',
        '/api/login-test.php' => 'OPTIONS',
        '/api/auth.php' => 'OPTIONS'
    ];
    
    $results = [];
    foreach ($endpoints as $url => $method) {
        $full_url = 'http://' . $_SERVER['HTTP_HOST'] . $url;
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $full_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        
        if ($method === 'OPTIONS') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'OPTIONS');
        }
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $header = substr($response, 0, $header_size);
        $body = substr($response, $header_size);
        
        curl_close($ch);
        
        $results[$url] = [
            'http_code' => $http_code,
            'content_type' => extractHeader($header, 'Content-Type'),
            'access_control_allow_origin' => extractHeader($header, 'Access-Control-Allow-Origin'),
            'response_preview' => substr($body, 0, 100)
        ];
    }
    
    return $results;
}

function extractHeader($headers, $name) {
    $pattern = '/^' . preg_quote($name, '/') . ':\s*(.*)$/mi';
    if (preg_match($pattern, $headers, $matches)) {
        return $matches[1];
    }
    return null;
}

// Rassembler toutes les informations
$diagnostic = [
    'timestamp' => date('Y-m-d H:i:s'),
    'php_info' => getPhpInfo(),
    'files' => checkFiles(),
    'endpoints' => testEndpoints(),
    'environment' => [
        'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'],
        'REMOTE_ADDR' => $_SERVER['REMOTE_ADDR'],
        'HTTP_USER_AGENT' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
        'SERVER_NAME' => $_SERVER['SERVER_NAME'],
        'SERVER_PORT' => $_SERVER['SERVER_PORT']
    ]
];

// Afficher le diagnostic au format JSON
echo json_encode($diagnostic, JSON_PRETTY_PRINT);
