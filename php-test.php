
<?php
// En-têtes pour JSON et CORS
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Informations de base
$result = [
    'test_name' => 'PHP Access Test',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'server_info' => [
        'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'server_name' => $_SERVER['SERVER_NAME'] ?? 'Unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
        'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown',
        'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Unknown',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown'
    ],
    'tests' => []
];

// Test 1: Vérification du répertoire API
$apiPath = __DIR__ . '/api';
$apiExists = file_exists($apiPath) && is_dir($apiPath);
$result['tests']['api_directory'] = [
    'status' => $apiExists ? 'success' : 'error',
    'message' => $apiExists ? 'Le répertoire API existe' : 'Le répertoire API n\'existe pas',
    'path' => $apiPath
];

// Test 2: Vérification des fichiers PHP spécifiques
$phpFiles = [
    '/api/php-system-check.php',
    '/api/php-execution-test.php',
    '/api/test.php',
    '/api/index.php'
];

foreach ($phpFiles as $file) {
    $fullPath = __DIR__ . $file;
    $exists = file_exists($fullPath);
    $result['tests']['files'][$file] = [
        'status' => $exists ? 'success' : 'error',
        'message' => $exists ? 'Le fichier existe' : 'Le fichier n\'existe pas',
        'path' => $fullPath,
        'size' => $exists ? filesize($fullPath) . ' octets' : 'N/A'
    ];
}

// Test 3: Vérification des chemins Infomaniak
$infomaniakPaths = [
    '/sites/qualiopi.ch',
    '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch'
];

foreach ($infomaniakPaths as $path) {
    $pathExists = file_exists($path);
    $result['tests']['infomaniak_paths'][$path] = [
        'status' => $pathExists ? 'success' : 'error',
        'message' => $pathExists ? 'Le chemin existe' : 'Le chemin n\'existe pas',
        'is_readable' => $pathExists ? is_readable($path) : false,
        'is_writable' => $pathExists ? is_writable($path) : false
    ];
}

// Test 4: Vérification des permissions .htaccess
$htaccessFiles = [
    '/.htaccess',
    '/api/.htaccess'
];

foreach ($htaccessFiles as $file) {
    $fullPath = __DIR__ . $file;
    $exists = file_exists($fullPath);
    $content = $exists ? (is_readable($fullPath) ? file_get_contents($fullPath) : 'Impossible de lire le fichier') : 'N/A';
    $result['tests']['htaccess'][$file] = [
        'status' => $exists ? 'success' : 'error',
        'message' => $exists ? 'Le fichier .htaccess existe' : 'Le fichier .htaccess n\'existe pas',
        'path' => $fullPath,
        'readable' => $exists ? is_readable($fullPath) : false,
        'content_preview' => $exists && is_readable($fullPath) ? substr($content, 0, 100) . '...' : 'Non disponible'
    ];
}

// Réponse JSON
echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
