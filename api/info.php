
<?php
// Header JSON pour éviter les erreurs de parsing
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Informations de base sur le serveur PHP
$info = array(
    'status' => 'success',
    'message' => 'Le serveur PHP fonctionne correctement',
    'php_version' => phpversion(),
    'server_info' => $_SERVER['SERVER_SOFTWARE'] ?? 'Information non disponible',
    'document_root' => $_SERVER['DOCUMENT_ROOT'],
    'script_filename' => $_SERVER['SCRIPT_FILENAME'],
    'request_uri' => $_SERVER['REQUEST_URI'],
    'timestamp' => date('Y-m-d H:i:s'),
);

// Retourner les informations au format JSON
echo json_encode($info, JSON_PRETTY_PRINT);
?>
