
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Définir les en-têtes
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Répondre avec un simple JSON
echo json_encode([
    'status' => 'success',
    'message' => 'PHP fonctionne correctement',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'server_info' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'
]);
?>
