
<?php
// Test API minimal
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'status' => 'ok',
    'message' => 'API PHP fonctionne',
    'timestamp' => time(),
    'php_version' => phpversion()
]);
?>
