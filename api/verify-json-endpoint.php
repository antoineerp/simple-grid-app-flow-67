
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Cette API teste si le point de terminaison peut répondre en JSON correctement
echo json_encode([
    'success' => true,
    'message' => 'API JSON fonctionnelle',
    'timestamp' => date('c'),
    'endpoint' => 'verify-json-endpoint'
]);
?>
