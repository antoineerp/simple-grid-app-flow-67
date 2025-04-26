
<?php
// Définir la constante pour autoriser l'accès direct
define('DIRECT_ACCESS_CHECK', true);

// Configuration stricte des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// En-têtes CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Configuration de base à renvoyer (sans informations sensibles)
$config = [
    "api_urls" => [
        "development" => "http://localhost:8080/api",
        "production" => "https://qualiopi.ch/api"
    ],
    "allowed_origins" => [
        "http://localhost:5173",
        "https://qualiopi.ch"
    ],
    "version" => "1.0.0",
    "environment" => "production",
    "timestamp" => date('Y-m-d H:i:s')
];

// Renvoyer la configuration au format JSON
http_response_code(200);
echo json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
exit;
?>
