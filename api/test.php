
<?php
// Simple API test endpoint
header('Content-Type: application/json; charset=utf-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");

// Sortie simple pour confirmer que l'API fonctionne
echo json_encode([
    'status' => 200,
    'message' => 'API test endpoint fonctionnel',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion()
]);
?>
