
<?php
// Test PHP détaillé avec configuration CORS et diagnostic
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'preflight_ok', 'message' => 'CORS préflight accepté']);
    exit;
}

// Force l'affichage des erreurs pour le diagnostic
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Vérifier l'interprétation PHP
if (!function_exists('json_encode')) {
    echo '{"error": "L\'extension JSON n\'est pas disponible", "php_executed": true}';
    exit;
}

// Vérifier les configurations du serveur
$server_info = [
    'php_version' => phpversion(),
    'sapi_name' => php_sapi_name(),
    'extensions' => get_loaded_extensions(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Non disponible'
];

// Vérifier les fichiers importants
$file_checks = [
    '.htaccess' => file_exists('../.htaccess'),
    'api_htaccess' => file_exists('.htaccess'),
    'index.php' => file_exists('index.php'),
    'php.ini' => file_exists('php.ini')
];

// Vérifier les en-têtes de la réponse actuelle
$headers = [];
foreach (headers_list() as $header) {
    $headers[] = $header;
}

// Le corps de la réponse
$response = [
    'success' => true,
    'message' => 'Le serveur PHP fonctionne correctement',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_executed' => true,
    'server_info' => $server_info,
    'file_checks' => $file_checks,
    'response_headers' => $headers,
    'request_method' => $_SERVER['REQUEST_METHOD'],
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Non disponible'
];

// Retourner la réponse en JSON
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
