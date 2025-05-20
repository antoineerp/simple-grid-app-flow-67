
<?php
// Configuration des headers
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, HEAD");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journaliser la requête
error_log("=== EXÉCUTION DE api/info.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Si c'est une requête OPTIONS ou HEAD (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS' || $_SERVER['REQUEST_METHOD'] == 'HEAD') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'API opérationnelle - Preflight OK']);
    exit;
}

// Inclure la configuration de la base de données si possible
$db_config = null;
$db_error = null;

try {
    if (file_exists(__DIR__ . '/config/DatabaseConfig.php')) {
        require_once __DIR__ . '/config/DatabaseConfig.php';
        $dbConfig = new DatabaseConfig();
        $db_config = $dbConfig->getConfig();
    }
} catch (Exception $e) {
    $db_error = $e->getMessage();
    error_log("Erreur lors du chargement de la configuration de la base de données: " . $e->getMessage());
}

// Informations sur le serveur
$server_info = [
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
    'api_version' => '1.0.7',
    'http_host' => $_SERVER['HTTP_HOST'] ?? 'Unknown',
    'timestamp' => date('Y-m-d H:i:s'),
    'timezone' => date_default_timezone_get(),
];

// Préparer la réponse
$response = [
    'status' => 'success',
    'message' => 'API opérationnelle',
    'server' => $server_info,
    'database' => [
        'config_available' => ($db_config !== null),
        'host' => $db_config ? $db_config['host'] : 'p71x6d.myd.infomaniak.com',
        'database' => $db_config ? $db_config['db_name'] : 'p71x6d_system',
        'default_user' => 'p71x6d_richard'
    ]
];

// Ajouter des informations d'erreur si nécessaire
if ($db_error) {
    $response['database']['error'] = $db_error;
}

// Envoyer la réponse
echo json_encode($response);
?>
