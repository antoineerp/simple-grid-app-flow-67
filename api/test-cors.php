
<?php
// Test des configurations CORS
header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'preflight_ok', 'cors' => 'enabled']);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'CORS est correctement configuré',
    'request_details' => [
        'method' => $_SERVER['REQUEST_METHOD'],
        'headers' => getallheaders(),
        'time' => date('Y-m-d H:i:s')
    ],
    'cors_headers' => [
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers' => 'Content-Type, Authorization'
    ]
]);
?>
