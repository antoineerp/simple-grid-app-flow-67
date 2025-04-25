
<?php
header("Content-Type: application/json; charset=UTF-8");

// Vérification complète de la configuration serveur pour le diagnostic
$server_info = [
    'php_version' => phpversion(),
    'sapi' => php_sapi_name(),
    'loaded_extensions' => get_loaded_extensions(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
    'server_name' => $_SERVER['SERVER_NAME'] ?? 'Non disponible',
    'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Non disponible',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Non disponible'
];

// Vérification des fichiers critiques
$files_to_check = [
    '.htaccess',
    '.user.ini',
    'index.php',
    'php-execution-test.php',
    'bibliotheque-load.php',
    'check-users.php'
];

$file_status = [];
foreach ($files_to_check as $file) {
    $file_status[$file] = [
        'exists' => file_exists($file),
        'readable' => is_readable($file),
        'size' => file_exists($file) ? filesize($file) : 'N/A'
    ];
}

// Vérification des configurations PHP
$php_config = [
    'display_errors' => ini_get('display_errors'),
    'error_reporting' => ini_get('error_reporting'),
    'log_errors' => ini_get('log_errors'),
    'error_log' => ini_get('error_log'),
    'max_execution_time' => ini_get('max_execution_time'),
    'memory_limit' => ini_get('memory_limit'),
    'default_charset' => ini_get('default_charset')
];

// Tente d'écrire un log pour voir si les logs fonctionnent
error_log("Test log généré par server-config-check.php le " . date('Y-m-d H:i:s'));

$log_test = [
    'test_log_written' => true,
    'log_location' => ini_get('error_log') ?: 'Configuration standard du serveur',
    'timestamp' => date('Y-m-d H:i:s')
];

// Renvoyer toutes les informations
echo json_encode([
    'status' => 'success',
    'message' => 'Vérification de la configuration serveur',
    'server_info' => $server_info,
    'php_config' => $php_config,
    'file_status' => $file_status,
    'log_test' => $log_test
], JSON_PRETTY_PRINT);
?>
