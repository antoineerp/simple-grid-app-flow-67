
<?php
// Script simple de test d'exécution PHP qui renvoie un JSON
header('Content-Type: application/json; charset=UTF-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");
header("Pragma: no-cache");
header("Expires: 0");

echo json_encode([
    'status' => 'success',
    'message' => 'API PHP fonctionne correctement',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
]);
?>
