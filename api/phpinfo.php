
<?php
// Headers pour JSON et CORS
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

// Capturer la sortie de phpinfo()
ob_start();
phpinfo(INFO_GENERAL | INFO_CONFIGURATION | INFO_MODULES);
$phpinfo = ob_get_clean();

// Extraire des informations utiles
$info = [
    'php_version' => phpversion(),
    'server_api' => php_sapi_name(),
    'system' => php_uname(),
    'loaded_modules' => get_loaded_extensions(),
    'memory_limit' => ini_get('memory_limit'),
    'max_execution_time' => ini_get('max_execution_time'),
    'full_phpinfo_html' => $phpinfo
];

echo json_encode($info, JSON_PRETTY_PRINT);
?>
