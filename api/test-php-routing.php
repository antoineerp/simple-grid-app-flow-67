
<?php
// Script de diagnostic des problèmes de routage PHP
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");
header("Pragma: no-cache");
header("Expires: 0");

// Informations de base sur l'environnement
$info = [
    'status' => 'success',
    'message' => 'Test de routage PHP exécuté avec succès',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
    'current_script' => $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
    'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Unknown',
];

// Vérifier l'existence de fichiers PHP clés
$files_to_check = [
    'simple-php-test.php' => $_SERVER['DOCUMENT_ROOT'] . '/api/simple-php-test.php',
    'test-json.php' => $_SERVER['DOCUMENT_ROOT'] . '/api/test-json.php',
    'test.php' => $_SERVER['DOCUMENT_ROOT'] . '/api/test.php',
    'index.php' => $_SERVER['DOCUMENT_ROOT'] . '/api/index.php'
];

$file_status = [];
foreach ($files_to_check as $name => $path) {
    $file_status[$name] = [
        'exists' => file_exists($path),
        'readable' => is_readable($path),
        'size' => file_exists($path) ? filesize($path) : 0,
        'path' => $path
    ];
}

// Vérifier la configuration des htaccess
$htaccess_main = $_SERVER['DOCUMENT_ROOT'] . '/.htaccess';
$htaccess_api = $_SERVER['DOCUMENT_ROOT'] . '/api/.htaccess';

$htaccess_info = [
    'main_exists' => file_exists($htaccess_main),
    'main_size' => file_exists($htaccess_main) ? filesize($htaccess_main) : 0,
    'api_exists' => file_exists($htaccess_api),
    'api_size' => file_exists($htaccess_api) ? filesize($htaccess_api) : 0,
];

// Tester la création d'un nouveau fichier PHP test
$test_file_path = $_SERVER['DOCUMENT_ROOT'] . '/api/routing-test-' . time() . '.php';
$test_file_content = '<?php
header("Content-Type: text/plain");
echo "Test de routage créé le ' . date('Y-m-d H:i:s') . '";
?>';

$file_creation = [
    'attempted' => true,
    'success' => false,
    'path' => $test_file_path,
    'message' => ''
];

try {
    $file_creation['success'] = file_put_contents($test_file_path, $test_file_content) !== false;
    if (!$file_creation['success']) {
        $file_creation['message'] = 'Échec de création du fichier';
    } else {
        $file_creation['message'] = 'Fichier créé avec succès';
        $file_creation['url'] = '/api/routing-test-' . time() . '.php';
    }
} catch (Exception $e) {
    $file_creation['message'] = 'Exception: ' . $e->getMessage();
}

// Construire la réponse complète
$response = [
    'info' => $info,
    'files' => $file_status,
    'htaccess' => $htaccess_info,
    'file_creation_test' => $file_creation,
    'environment_vars' => [
        'SERVER_PROTOCOL' => $_SERVER['SERVER_PROTOCOL'] ?? 'Unknown',
        'HTTP_HOST' => $_SERVER['HTTP_HOST'] ?? 'Unknown',
        'REMOTE_ADDR' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
        'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'] ?? 'Unknown',
        'REDIRECT_STATUS' => $_SERVER['REDIRECT_STATUS'] ?? 'Not set'
    ]
];

// Envoyer la réponse
echo json_encode($response, JSON_PRETTY_PRINT);
?>
