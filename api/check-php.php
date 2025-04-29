
<?php
// Script simple de vérification de PHP
header('Content-Type: application/json');

// Vérifier que PHP s'exécute 
$phpWorking = true;
$extensions = get_loaded_extensions();
$server = $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu';

echo json_encode([
    'success' => $phpWorking,
    'message' => 'PHP fonctionne correctement!',
    'php_version' => PHP_VERSION,
    'server' => $server,
    'extensions' => $extensions,
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
