
<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Simple API response
$response = [
    "status" => "success",
    "message" => "FormaCert API is running correctly",
    "version" => "1.0.0",
    "timestamp" => date('Y-m-d H:i:s'),
    "environment" => [
        "php_version" => phpversion(),
        "server" => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        "host" => $_SERVER['HTTP_HOST'] ?? 'Unknown'
    ]
];

// Output as JSON
echo json_encode($response, JSON_PRETTY_PRINT);
?>
