
<?php
// Tester l'exécution correcte de PHP
header('Content-Type: application/json; charset=UTF-8');

// Force l'affichage des erreurs 
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Test d'exécution PHP
echo json_encode([
    'success' => true,
    'message' => 'Le serveur PHP fonctionne correctement',
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'],
    'execution_time' => date('Y-m-d H:i:s'),
    'client_ip' => $_SERVER['REMOTE_ADDR'],
    'request_method' => $_SERVER['REQUEST_METHOD']
]);
?>
