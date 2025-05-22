
<?php
// Tester la bonne exécution du PHP
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// La simple présence de JSON valide en sortie indique que PHP s'exécute correctement
echo json_encode([
    'status' => 'success',
    'message' => 'Le PHP s\'exécute correctement',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'server_info' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'
]);
?>
