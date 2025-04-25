
<?php
// Test simple d'exécution PHP et CORS
header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

echo json_encode([
    'status' => 'success',
    'message' => 'PHP fonctionne correctement avec CORS',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'],
    'host' => $_SERVER['HTTP_HOST']
]);
?>
