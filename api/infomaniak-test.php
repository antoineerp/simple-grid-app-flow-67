
<?php
// Script de test spécifique pour Infomaniak avec diagnostic d'exécution PHP
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("X-PHP-Executed: true");

// Force l'affichage des erreurs pour le diagnostic
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Vérifier si PHP est correctement exécuté
$response = [
    'success' => true,
    'php_executed' => true,
    'timestamp' => date('Y-m-d H:i:s'),
    'message' => 'PHP est correctement exécuté sur Infomaniak',
    'test_type' => 'Vérification exécution PHP'
];

// Information sur le serveur
$response['server_info'] = [
    'php_version' => phpversion(),
    'sapi' => php_sapi_name(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
    'hostname' => gethostname(),
    'remote_addr' => $_SERVER['REMOTE_ADDR'],
    'server_name' => $_SERVER['SERVER_NAME'] ?? 'Non disponible',
    'request_uri' => $_SERVER['REQUEST_URI'],
    'document_root' => $_SERVER['DOCUMENT_ROOT']
];

// Vérifier l'environnement Infomaniak
$is_infomaniak = false;
if (isset($_SERVER['SERVER_SOFTWARE'])) {
    $is_infomaniak = (stripos($_SERVER['SERVER_SOFTWARE'], 'infomaniak') !== false);
} 
if (!$is_infomaniak && isset($_SERVER['SERVER_NAME'])) {
    $is_infomaniak = (stripos($_SERVER['SERVER_NAME'], 'infomaniak') !== false || 
                       stripos($_SERVER['SERVER_NAME'], 'qualiopi.ch') !== false);
}
$response['is_infomaniak_detected'] = $is_infomaniak;

// Vérifier les extensions PHP cruciales
$required_extensions = ['json', 'pdo', 'pdo_mysql', 'mysqli', 'curl', 'mbstring'];
$extensions_status = [];
foreach ($required_extensions as $ext) {
    $extensions_status[$ext] = extension_loaded($ext);
}
$response['extensions'] = $extensions_status;

// Vérifier les fichiers de configuration importants
$config_files = [
    '.htaccess' => file_exists('../.htaccess'),
    'api_htaccess' => file_exists('.htaccess'),
    'php.ini' => file_exists('php.ini'),
    'user.ini' => file_exists('.user.ini'),
    'index.php' => file_exists('index.php')
];
$response['config_files'] = $config_files;

// Lister tous les en-têtes de la réponse
$headers = [];
foreach (headers_list() as $header) {
    $headers[] = $header;
}
$response['response_headers'] = $headers;

// Retourner la réponse en JSON
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
