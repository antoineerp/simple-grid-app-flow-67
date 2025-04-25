
<?php
// Définir les en-têtes CORS explicitement et de manière plus complète
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

// Journaliser les requêtes pour le débogage
error_log("CORS Test - Méthode: " . $_SERVER['REQUEST_METHOD']);

// Pour les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode([
        'status' => 'preflight_ok', 
        'message' => 'CORS préflight accepté', 
        'allowed_methods' => ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE']
    ]);
    exit;
}

// Récupérer les détails de la requête de manière plus robuste
$request_details = [
    'method' => $_SERVER['REQUEST_METHOD'],
    'origin' => $_SERVER['HTTP_ORIGIN'] ?? 'Non spécifié',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Non spécifié',
    'headers' => getallheaders(),
    'get_params' => $_GET,
    'post_params' => $_POST
];

// Réponse avec plus de détails
$response = [
    'status' => 'success',
    'message' => 'Test CORS réussi',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'],
    'request' => $request_details,
    'cors_headers' => [
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age' => '3600'
    ]
];

// Utiliser json_encode avec des options pour un meilleur débogage
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
