
<?php
// Définir les headers CORS et JSON
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Forced-DB-User, X-User-Prefix");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Gérer CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Vérifier si l'autorisation est fournie
$headers = getallheaders();
$auth_provided = isset($headers['Authorization']) && !empty($headers['Authorization']);

// Réponse pour indiquer que l'API fonctionne
echo json_encode([
    'status' => 'success',
    'success' => true,
    'message' => 'API auth-test réussie',
    'auth_provided' => $auth_provided,
    'timestamp' => date('Y-m-d H:i:s'),
    'endpoint' => 'auth-test.php'
]);
?>
