
<?php
// Définir les headers CORS et JSON
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Forced-DB-User, X-User-Prefix");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Gérer CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Informations API
$endpoints = [
    'test' => '/api/test.php - Test de fonctionnement de l\'API',
    'check' => '/api/check.php - Vérification simple de l\'API',
    'auth_test' => '/api/auth-test.php - Test d\'authentification',
    'db_connection' => '/api/check-db-connection.php - Test de connexion à la base de données',
    'users' => '/api/users.php - Gestion des utilisateurs',
    'check_users' => '/api/check-users.php - Vérification des utilisateurs',
    'diagnostic' => '/api/diagnostic.php - Diagnostic complet du système'
];

echo json_encode([
    'status' => 'success',
    'message' => 'API Documentation',
    'api_version' => '1.0.8',
    'endpoints' => $endpoints,
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
