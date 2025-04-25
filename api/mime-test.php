
<?php
header("Content-Type: application/json; charset=UTF-8");

$supported_types = [
    'application/json' => 'JSON',
    'text/html' => 'HTML',
    'text/plain' => 'Text',
    'application/xml' => 'XML'
];

$response = [
    'status' => 'success',
    'mime_types' => $supported_types,
    'current_mime' => 'application/json',
    'php_info' => [
        'version' => phpversion(),
        'sapi' => php_sapi_name(),
        'extensions' => get_loaded_extensions(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'
    ]
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>
