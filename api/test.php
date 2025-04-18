
<?php
// Définir explicitement le type de contenu JSON et les en-têtes CORS
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Vérifier l'environnement du serveur
$documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? 'Non défini';
$scriptFilename = $_SERVER['SCRIPT_FILENAME'] ?? 'Non défini';
$requestUri = $_SERVER['REQUEST_URI'] ?? 'Non défini';
$serverSoftware = $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu';

// Vérifier l'existence des fichiers importants
$indexHtmlExists = file_exists($documentRoot . '/index.html') ? 'Oui' : 'Non';
$htaccessExists = file_exists($documentRoot . '/.htaccess') ? 'Oui' : 'Non';
$apiHtaccessExists = file_exists(dirname(__FILE__) . '/.htaccess') ? 'Oui' : 'Non';
$appJsExists = file_exists($documentRoot . '/dist/assets/index-*.js') ? 'Oui (via pattern)' : 'Non';

// Construire la réponse détaillée
$response = [
    'status' => 200,
    'message' => 'Diagnostic PHP - Si vous voyez ce message, PHP fonctionne correctement',
    'php_version' => phpversion(),
    'server_info' => [
        'software' => $serverSoftware,
        'document_root' => $documentRoot,
        'script_filename' => $scriptFilename,
        'request_uri' => $requestUri,
        'script_path' => __FILE__,
        'server_time' => date('Y-m-d H:i:s')
    ],
    'file_check' => [
        'index_html_exists' => $indexHtmlExists,
        'htaccess_exists' => $htaccessExists,
        'api_htaccess_exists' => $apiHtaccessExists,
        'app_js_exists' => $appJsExists
    ],
    'php_config' => [
        'loaded_extensions' => get_loaded_extensions(),
        'php_api' => php_sapi_name(),
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time'),
        'post_max_size' => ini_get('post_max_size'),
        'display_errors' => ini_get('display_errors')
    ],
    'instructions' => "Si vous ne voyez que cette page, le problème peut être lié à la configuration du serveur ou au routage. Vérifiez votre fichier .htaccess et assurez-vous que le module PHP est correctement configuré."
];

// Renvoyer la réponse JSON
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
