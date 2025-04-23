
<?php
// Script de vérification d'exécution PHP
header('Content-Type: application/json; charset=utf-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Pour confirmer que PHP s'exécute
$execution_time = microtime(true);

echo json_encode([
    'status' => 'success',
    'message' => 'PHP s\'exécute correctement',
    'php_version' => phpversion(),
    'execution_time' => round((microtime(true) - $execution_time) * 1000, 2) . 'ms',
    'timestamp' => date('Y-m-d H:i:s'),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'server_name' => $_SERVER['SERVER_NAME'] ?? 'Unknown',
    'execution_path' => __FILE__
]);
?>
