
<?php
// Header pour indiquer que nous renvoyons du JSON
header('Content-Type: application/json');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, HEAD, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Information sur l'API
$apiInfo = [
    'status' => 'success',
    'message' => 'API PHP disponible',
    'version' => '1.0.7',
    'environment' => [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'host' => $_SERVER['HTTP_HOST'] ?? 'Unknown',
        'timezone' => date_default_timezone_get()
    ],
    'timestamp' => date('Y-m-d H:i:s')
];

// Afficher les informations
echo json_encode($apiInfo);
?>
