
<?php
// Test minimal pour vérifier l'exécution PHP
header('Content-Type: application/json; charset=utf-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");

echo json_encode([
    'status' => 'success',
    'message' => 'PHP fonctionne correctement',
    'timestamp' => time(),
    'php_version' => phpversion()
]);
?>
