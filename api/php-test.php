
<?php
// Simple script pour tester l'exécution PHP
header('Content-Type: application/json; charset=UTF-8');
echo json_encode([
    'status' => 'success',
    'message' => 'PHP est correctement configuré',
    'php_version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE'],
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
