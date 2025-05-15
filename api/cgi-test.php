
<?php
// Ce fichier permet de tester si PHP s'exécute correctement via CGI/FastCGI

// Désactiver la mise en cache
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// Définir le type de contenu
header('Content-Type: application/json');

// Informations sur la configuration PHP
$php_info = [
    'php_version' => phpversion(),
    'sapi_name' => php_sapi_name(),
    'modules' => get_loaded_extensions(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
    'server_name' => $_SERVER['SERVER_NAME'] ?? 'Non disponible',
    'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Non disponible',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Non disponible',
    'query_string' => $_SERVER['QUERY_STRING'] ?? 'Non disponible',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible',
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Non disponible',
    'timestamp' => date('Y-m-d H:i:s'),
    'timezone' => date_default_timezone_get(),
    'execution_mode' => (strpos(php_sapi_name(), 'cgi') !== false || strpos(php_sapi_name(), 'fastcgi') !== false) ? 'CGI/FastCGI' : 'Module Apache'
];

// Renvoyer les informations au format JSON
echo json_encode([
    'status' => 'success',
    'message' => 'PHP est correctement exécuté',
    'php_info' => $php_info
], JSON_PRETTY_PRINT);
?>
