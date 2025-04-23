
<?php
// Basic PHP information file - good for testing PHP execution
header('Content-Type: application/json; charset=UTF-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");

echo json_encode([
    'status' => 'success',
    'message' => 'PHP is working correctly',
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
