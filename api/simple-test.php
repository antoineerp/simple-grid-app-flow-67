
<?php
// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Simple JSON response to test if PHP is working
echo json_encode([
    'status' => 'success',
    'message' => 'PHP is working correctly',
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'],
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
