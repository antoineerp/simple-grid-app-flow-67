
<?php
// Point d'entrée principal de l'API
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

echo json_encode([
    "status" => "success", 
    "message" => "API is working", 
    "timestamp" => date("Y-m-d H:i:s"),
    "php_version" => phpversion(),
    "server_info" => [
        "software" => $_SERVER["SERVER_SOFTWARE"] ?? "Unknown",
        "name" => $_SERVER["SERVER_NAME"] ?? "Unknown", 
        "script" => $_SERVER["SCRIPT_NAME"] ?? "Unknown"
    ]
]);
?>
