
<?php
// Headers pour s'assurer que la réponse est en JSON
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Générer une réponse JSON de test pour vérifier que PHP s'exécute
$response = array(
    'success' => true,
    'message' => 'PHP s\'exécute correctement',
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non défini',
    'server_name' => $_SERVER['SERVER_NAME'] ?? 'Non défini',
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Non défini',
    'timestamp' => time(),
    'datetime' => date('Y-m-d H:i:s'),
    'test_string' => 'Cette chaîne confirme que le script PHP est interprété'
);

// Envoyer la réponse JSON
echo json_encode($response, JSON_PRETTY_PRINT);
?>
