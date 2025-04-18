
<?php
// Définir explicitement l'encodage UTF-8
header('Content-Type: application/json; charset=utf-8');

// Désactiver la mise en cache
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Autoriser l'accès CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

// Informations PHP
$phpInfo = [
    'version' => phpversion(),
    'server_api' => php_sapi_name(),
    'extensions' => get_loaded_extensions(),
    'loaded_ini' => php_ini_loaded_file(),
    'timestamp' => date('Y-m-d H:i:s'),
    'environment' => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu'
];

// Vérifier les variables d'environnement
$phpInfo['environment_vars'] = [
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'non défini',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'non défini',
    'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'non défini',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'non défini',
    'query_string' => $_SERVER['QUERY_STRING'] ?? 'non défini'
];

// Renvoyer les informations au format JSON
echo json_encode([
    'status' => 'success',
    'message' => 'PHP fonctionne correctement',
    'data' => $phpInfo
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
