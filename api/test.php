
<?php
// Script PHP minimal pour vérifier l'exécution
header('Content-Type: application/json; charset=UTF-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");

echo json_encode([
    'status' => 'success',
    'message' => 'PHP fonctionne',
    'timestamp' => date('Y-m-d H:i:s'),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'php_version' => phpversion()
]);
?>
