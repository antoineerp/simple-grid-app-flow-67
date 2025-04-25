
<?php
// Test PHP avec configuration minimale et explicite
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");

echo json_encode([
    'status' => 'success',
    'message' => 'PHP fonctionne correctement',
    'php_version' => phpversion(),
    'timestamp' => date('Y-m-d H:i:s'),
    'server_details' => [
        'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
        'host' => $_SERVER['HTTP_HOST'] ?? 'Non spécifié'
    ]
]);
?>
