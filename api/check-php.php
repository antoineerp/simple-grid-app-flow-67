
<?php
// Désactiver la mise en cache
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Journalisation
error_log("Exécution de check-php.php - Test PHP");

echo json_encode([
    "status" => "success",
    "message" => "PHP fonctionne correctement",
    "timestamp" => date("Y-m-d H:i:s"),
    "php_version" => phpversion(),
    "server_software" => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
]);
?>
