
<?php
// Configuration en-têtes
header('Content-Type: application/json; charset=UTF-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Journalisation de l'accès pour diagnostic
error_log("=== Exécution de php-simple-test.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " | URI: " . $_SERVER['REQUEST_URI']);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Informations sur l'environnement
$php_info = [
    'version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'sapi' => php_sapi_name(),
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown',
    'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Unknown'
];

// Réponse JSON
$response = [
    'status' => 'success',
    'message' => 'PHP fonctionne correctement',
    'timestamp' => date('Y-m-d H:i:s'),
    'environment' => $php_info,
    'request' => [
        'method' => $_SERVER['REQUEST_METHOD'],
        'uri' => $_SERVER['REQUEST_URI'],
        'query' => $_GET
    ]
];

// Vérifier si des messages de diagnostic spécifiques sont demandés
if (isset($_GET['debug'])) {
    $response['debug'] = [
        'headers_sent' => headers_sent(),
        'output_buffering' => ini_get('output_buffering'),
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time')
    ];
}

// Envoyer la réponse JSON
echo json_encode($response);
?>
