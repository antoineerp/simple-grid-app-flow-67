
<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

// Informations sur la configuration Apache et les modules
$apache_info = [
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible',
    'server_name' => $_SERVER['SERVER_NAME'] ?? 'Non disponible',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Non disponible',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Non disponible',
    'htaccess_loaded' => function_exists('apache_get_modules') ? (in_array('mod_rewrite', apache_get_modules()) ? 'Oui' : 'Non') : 'Non détectable',
];

// Information sur le module mod_rewrite
$mod_rewrite_info = [
    'installed' => function_exists('apache_get_modules') ? (in_array('mod_rewrite', apache_get_modules()) ? 'Oui' : 'Non') : 'Non détectable',
];

// Information sur la configuration PHP
$php_info = [
    'version' => phpversion(),
    'sapi' => php_sapi_name(),
    'cgi_mode' => (stripos(php_sapi_name(), 'cgi') !== false || stripos(php_sapi_name(), 'fastcgi') !== false) ? 'Oui' : 'Non',
    'ini_loaded' => php_ini_loaded_file() ?: 'Non détectable',
];

// Analyse des redirections
$redirection_test = [];
$redirection_test['api_detection'] = strpos($_SERVER['REQUEST_URI'] ?? '', '/api/') !== false ? 'Requête API détectée' : 'Pas une requête API';

// Création d'un rapport complet
$report = [
    'status' => 'success',
    'message' => 'Rapport de configuration pour débogage des redirections',
    'timestamp' => date('Y-m-d H:i:s'),
    'apache_info' => $apache_info,
    'mod_rewrite_info' => $mod_rewrite_info,
    'php_info' => $php_info,
    'redirection_test' => $redirection_test,
    'server_variables' => $_SERVER,
];

// Retourner le rapport au format JSON
echo json_encode($report, JSON_PRETTY_PRINT);
?>
