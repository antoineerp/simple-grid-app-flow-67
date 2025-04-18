
<?php
// Simple API test endpoint
header('Content-Type: application/json; charset=utf-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

// Si c'est une requête OPTIONS (CORS preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode([
        'status' => 200,
        'message' => 'Preflight OK'
    ]);
    exit;
}

// Sortie simple pour confirmer que l'API fonctionne
echo json_encode([
    'status' => 200,
    'message' => 'API test endpoint fonctionnel',
    'timestamp' => date('Y-m-d H:i:s'),
    'version' => 'v1.0.1'
]);
?>
