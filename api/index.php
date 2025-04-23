
<?php
// Point d'entrée API renforcé avec détection des erreurs d'exécution et journalisation améliorée
header('Content-Type: application/json; charset=utf-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Journaliser le début de l'exécution avec des informations détaillées
error_log("=== DÉBUT DE L'EXÉCUTION DE index.php à " . date('Y-m-d H:i:s') . " ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);
error_log("Serveur: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . " - PHP version: " . phpversion());

// Répondre aux requêtes OPTIONS pour le CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'CORS Preflight OK']);
    exit;
}

// Information sur l'environnement PHP
$php_info = [
    'version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'sapi' => php_sapi_name(),
    'execution_mode' => php_sapi_name(),
    'loaded_modules' => get_loaded_extensions(),
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
    'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Unknown'
];

// Version API
$api_version = '1.2.2';

// Créer la réponse
$response = [
    'status' => 'success',
    'message' => 'API active et fonctionnelle - Exécution PHP confirmée',
    'timestamp' => time(),
    'formatted_time' => date('Y-m-d H:i:s'),
    'api_version' => $api_version,
    'environment' => $php_info,
    'request_details' => [
        'method' => $_SERVER['REQUEST_METHOD'],
        'uri' => $_SERVER['REQUEST_URI'],
        'query_string' => $_SERVER['QUERY_STRING'] ?? '',
        'remote_addr' => $_SERVER['REMOTE_ADDR'],
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
    ]
];

// Détection de configuration spécifique à Infomaniak
if (stripos($_SERVER['SERVER_SOFTWARE'] ?? '', 'infomaniak') !== false || 
    stripos($_SERVER['HTTP_HOST'] ?? '', 'infomaniak') !== false ||
    stripos($_SERVER['HTTP_HOST'] ?? '', 'qualiopi.ch') !== false) {
    
    $response['server_type'] = 'Infomaniak';
    $response['server_note'] = 'Environnement Infomaniak détecté, configuration optimisée appliquée';
    
    // Vérifier si .htaccess est correctement appliqué
    if (!isset($_SERVER['REDIRECT_STATUS']) || $_SERVER['REDIRECT_STATUS'] != '200') {
        $response['htaccess_warning'] = 'Les règles .htaccess ne sont peut-être pas appliquées correctement';
    }
}

// Test de connexion à la base de données (si les fichiers existent)
if (file_exists(__DIR__ . '/config/database.php') && file_exists(__DIR__ . '/config/db_config.json')) {
    try {
        require_once __DIR__ . '/config/database.php';
        
        $database = new Database();
        $conn = $database->getConnection(false);
        
        if ($database->is_connected) {
            $response['database'] = [
                'status' => 'connected',
                'host' => $database->host,
                'db_name' => $database->db_name
            ];
        } else {
            $response['database'] = [
                'status' => 'error',
                'message' => $database->connection_error ?? 'Erreur de connexion'
            ];
        }
    } catch (Exception $e) {
        $response['database'] = [
            'status' => 'error',
            'message' => 'Exception: ' . $e->getMessage()
        ];
    }
} else {
    $response['database'] = [
        'status' => 'not_configured',
        'message' => 'Configuration introuvable'
    ];
}

// Journaliser la fin de l'exécution
error_log("Réponse générée avec succès. Status: " . $response['status']);
error_log("=== FIN DE L'EXÉCUTION DE index.php ===");

// Envoyer la réponse
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
