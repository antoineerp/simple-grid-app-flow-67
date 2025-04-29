
<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Vérifier si PHP fonctionne correctement
echo json_encode([
    "status" => "success",
    "message" => "API PHP fonctionne correctement",
    "php_version" => phpversion(),
    "server" => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
]);
?>
