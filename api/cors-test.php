
<?php
// En-têtes CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'preflight_ok', 'message' => 'CORS préflight accepté']);
    exit;
}

// Le corps de la réponse
$response = [
    'status' => 'success',
    'message' => 'Test CORS réussi',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'request_details' => [
        'method' => $_SERVER['REQUEST_METHOD'],
        'headers' => getallheaders(),
        'get_params' => $_GET,
        'post_params' => $_POST
    ]
];

// Si l'extension json est disponible, utiliser json_encode, sinon créer manuellement
if (function_exists('json_encode')) {
    echo json_encode($response);
} else {
    // Fallback basique pour json_encode si l'extension n'est pas disponible
    echo '{"status":"success","message":"Test CORS réussi","timestamp":"' . date('Y-m-d H:i:s') . '","php_version":"' . phpversion() . '"}';
}
?>
