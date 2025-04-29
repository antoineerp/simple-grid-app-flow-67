
<?php
// Fichier de diagnostic simplifié
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Cache-Control: no-cache, no-store, must-revalidate");

echo json_encode([
    "status" => "success",
    "message" => "PHP est correctement exécuté",
    "php_version" => phpversion(),
    "server" => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu',
    "timestamp" => date("Y-m-d H:i:s")
]);
?>
