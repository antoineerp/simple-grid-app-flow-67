
<?php
// Script de test d'authentification avec détection d'environnement
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Vérifier si la requête est OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Détecter l'environnement
$isProduction = strpos($_SERVER['HTTP_HOST'] ?? '', 'qualiopi.ch') !== false;
$isStaging = strpos($_SERVER['HTTP_HOST'] ?? '', '.lovable.') !== false;
$environment = $isProduction ? 'production' : ($isStaging ? 'staging' : 'development');

// Renvoyer une réponse de test
echo json_encode([
    'success' => true,
    'message' => 'Service d\'authentification disponible',
    'status' => 200,
    'timestamp' => date('Y-m-d H:i:s'),
    'auth_available' => true,
    'environment' => $environment,
    'server_info' => [
        'host' => $_SERVER['HTTP_HOST'] ?? 'unknown',
        'uri' => $_SERVER['REQUEST_URI'] ?? '/',
        'php_version' => phpversion()
    ]
]);
?>
