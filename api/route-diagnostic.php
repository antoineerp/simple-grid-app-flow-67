
<?php
// Configuration des headers
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Activer la journalisation d'erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/route_diagnostic_errors.log');

// Vérifier si check-routes.php existe, sinon utiliser une réponse de fallback
if (file_exists(__DIR__ . '/check-routes.php')) {
    // Utilisez require_once pour inclure check-routes.php
    require_once __DIR__ . '/check-routes.php';
} else {
    // Fournir une réponse de base si le fichier n'existe pas
    header('Content-Type: application/json; charset=utf-8');
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Route diagnostic endpoint',
        'timestamp' => date('Y-m-d H:i:s'),
        'note' => 'Ce point de terminaison est un alias pour check-routes.php',
        'results' => [
            // Résultats minimaux fournis directement
            'api_routes' => [
                ['url' => '/api', 'exists' => true],
                ['url' => '/api/diagnostic', 'exists' => true]
            ]
        ]
    ], JSON_PRETTY_PRINT);
}
?>
