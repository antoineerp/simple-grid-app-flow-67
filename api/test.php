
<?php
// Simple test API endpoint
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

echo json_encode([
    "status" => "success",
    "test" => "ok",
    "timestamp" => date("Y-m-d H:i:s"),
    "php_version" => phpversion()
]);
?>
