
<?php
// Simple test file to verify PHP execution
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

// Extra debug information
$debug = [
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'document_root' => $_SERVER['DOCUMENT_ROOT'],
    'script_filename' => $_SERVER['SCRIPT_FILENAME'],
    'hostname' => gethostname(),
    'current_dir' => getcwd(),
    'timestamp' => date('Y-m-d H:i:s')
];

echo json_encode([
    'success' => true,
    'message' => 'PHP is executing correctly on Infomaniak',
    'debug' => $debug
], JSON_PRETTY_PRINT);
?>
