
<?php
// Définir les en-têtes CORS explicitement
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

// Pour les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['message' => 'Preflight request successful']);
    exit;
}

// Analyser les en-têtes de la requête
$headers = getallheaders();
$request_details = [
    'method' => $_SERVER['REQUEST_METHOD'],
    'origin' => isset($headers['Origin']) ? $headers['Origin'] : 'Not specified',
    'requested_uri' => $_SERVER['REQUEST_URI'],
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Not specified',
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'Not specified',
    'request_headers' => $headers,
    'server_software' => $_SERVER['SERVER_SOFTWARE'],
    'php_version' => phpversion()
];

// Renvoyer les informations sur la requête
echo json_encode([
    'status' => 'success',
    'message' => 'CORS test successful',
    'request' => $request_details,
    'cors_headers_sent' => [
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age' => '3600'
    ],
    'php_execution' => 'PHP is executing correctly'
]);
