
<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

$diagnostics = [
    'server_environment' => [
        'hostname' => gethostname(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown'
    ],
    'php_configuration' => [
        'version' => phpversion(),
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time')
    ],
    'extension_checks' => [
        'pdo_mysql' => extension_loaded('pdo_mysql') ? 'Available' : 'Not Available',
        'mysqli' => extension_loaded('mysqli') ? 'Available' : 'Not Available'
    ]
];

echo json_encode($diagnostics, JSON_PRETTY_PRINT);
?>
