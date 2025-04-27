
<?php
header('Content-Type: application/json');

$diagnostics = [
    'server_info' => [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Not Available',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Not Available',
    ],
    'php_extensions' => get_loaded_extensions(),
    'database_support' => [
        'pdo' => extension_loaded('pdo'),
        'pdo_mysql' => extension_loaded('pdo_mysql'),
        'mysqli' => extension_loaded('mysqli')
    ],
    'security_checks' => [
        'display_errors' => ini_get('display_errors'),
        'error_reporting' => ini_get('error_reporting'),
        'open_basedir' => ini_get('open_basedir'),
        'allow_url_fopen' => ini_get('allow_url_fopen')
    ]
];

echo json_encode($diagnostics, JSON_PRETTY_PRINT);
?>
