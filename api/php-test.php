
<?php
// Simple script to test PHP execution
header('Content-Type: application/json; charset=UTF-8');
echo json_encode([
    'status' => 'success',
    'message' => 'PHP is properly configured',
    'php_version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE'],
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
