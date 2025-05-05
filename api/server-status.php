
<?php
// Désactiver la mise en cache
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

// Vérifier les extensions PHP nécessaires
$extensions = [
    'pdo',
    'pdo_mysql', 
    'json', 
    'mbstring'
];

$extensionStatus = [];
foreach ($extensions as $ext) {
    $extensionStatus[$ext] = extension_loaded($ext);
}

// Tester les permissions des répertoires clés
$directories = [
    '.' => 'Répertoire courant',
    '..' => 'Répertoire parent',
    './config' => 'Répertoire de configuration',
];

$directoryStatus = [];
foreach ($directories as $dir => $name) {
    $path = realpath($dir);
    $directoryStatus[$name] = [
        'path' => $path,
        'exists' => file_exists($path),
        'readable' => is_readable($path),
        'writable' => is_writable($path)
    ];
}

// Vérifier les fichiers de log
$logFile = __DIR__ . '/php_errors.log';
$logStatus = [
    'path' => $logFile,
    'exists' => file_exists($logFile),
    'readable' => is_readable($logFile),
    'writable' => is_writable($logFile),
    'size' => file_exists($logFile) ? filesize($logFile) : 0
];

// Vérifier l'environnement PHP
$phpEnvironment = [
    'version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
    'document_root' => $_SERVER['DOCUMENT_ROOT'],
    'memory_limit' => ini_get('memory_limit'),
    'max_execution_time' => ini_get('max_execution_time'),
    'display_errors' => ini_get('display_errors'),
    'log_errors' => ini_get('log_errors'),
    'error_log_path' => ini_get('error_log')
];

// Collecter les informations système
$systemInfo = [
    'time' => date('Y-m-d H:i:s'),
    'timezone' => date_default_timezone_get(),
    'os' => PHP_OS,
    'server_ip' => $_SERVER['SERVER_ADDR'] ?? 'Non disponible',
    'client_ip' => $_SERVER['REMOTE_ADDR'] ?? 'Non disponible',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Non disponible'
];

// Assembler la réponse
$response = [
    'status' => 'success',
    'message' => 'Serveur opérationnel',
    'timestamp' => time(),
    'datetime' => date('Y-m-d H:i:s'),
    'extensions' => $extensionStatus,
    'directories' => $directoryStatus,
    'log_file' => $logStatus,
    'php_environment' => $phpEnvironment,
    'system_info' => $systemInfo
];

// Renvoyer la réponse JSON
echo json_encode($response, JSON_PRETTY_PRINT);
?>
