
<?php
// Fichier d'information API pour test de fonctionnalité PHP
header('Content-Type: application/json; charset=utf-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

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
