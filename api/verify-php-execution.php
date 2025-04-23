
<?php
// Script de vérification d'exécution PHP robuste
header('Content-Type: application/json; charset=utf-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Pour confirmer que PHP s'exécute
$execution_time = microtime(true);

// Journaliser l'exécution
error_log("PHP verification script executed - " . date('Y-m-d H:i:s'));

// Vérifier la structure pour débogage
$paths = [
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown',
    'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Unknown',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
];

// Créer la réponse
echo json_encode([
    'status' => 'success',
    'message' => 'PHP s\'exécute correctement',
    'php_version' => phpversion(),
    'execution_time' => round((microtime(true) - $execution_time) * 1000, 2) . 'ms',
    'timestamp' => date('Y-m-d H:i:s'),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'server_name' => $_SERVER['SERVER_NAME'] ?? 'Unknown',
    'execution_path' => __FILE__,
    'paths' => $paths,
    'environment' => defined('PHP_SAPI') ? PHP_SAPI : 'unknown'
]);
?>
