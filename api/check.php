
<?php
// Enable strict error reporting but don't display errors in response
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// Set necessary headers
header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Create response data
$response = [
    'status' => 'success',
    'message' => 'API Connection successful',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'server_info' => [
        'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'protocol' => $_SERVER['SERVER_PROTOCOL'] ?? 'Unknown'
    ]
];

// Return response
echo json_encode($response, JSON_PRETTY_PRINT);
?>
