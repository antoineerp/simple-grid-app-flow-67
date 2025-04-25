
<?php
// Script ultra-simple pour vérifier que PHP s'exécute
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

echo json_encode([
    "status" => "success",
    "message" => "PHP s'exécute correctement",
    "timestamp" => date("Y-m-d H:i:s"),
    "php_version" => phpversion()
]);
?>
