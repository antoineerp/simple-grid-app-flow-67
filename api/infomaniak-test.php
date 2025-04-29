
<?php
// Test simple d'exécution PHP sur Infomaniak
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Informations sur le serveur et l'environnement
$info = [
    "status" => "success",
    "message" => "PHP s'exécute correctement sur Infomaniak",
    "environment" => [
        "php_version" => phpversion(),
        "server" => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        "hostname" => $_SERVER['HTTP_HOST'] ?? 'Unknown',
        "document_root" => $_SERVER['DOCUMENT_ROOT'],
        "script_path" => $_SERVER['SCRIPT_FILENAME'],
        "timestamp" => date('Y-m-d H:i:s')
    ],
    "infomaniak_specific" => [
        "server_name" => gethostname(),
        "user" => get_current_user(),
        "is_infomaniak" => (stripos(gethostname(), 'infomaniak') !== false)
    ]
];

echo json_encode($info, JSON_PRETTY_PRINT);
?>
