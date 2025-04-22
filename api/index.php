
<?php
// Point d'entrée API simple avec détection automatique de configuration
header('Content-Type: application/json; charset=utf-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

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
    'modules' => get_loaded_extensions(),
    'system' => PHP_OS,
    'time' => date('Y-m-d H:i:s')
];

// Vérifier l'accès aux fichiers
$files_access = [
    'config_dir' => is_dir(__DIR__ . '/config'),
    'database_php' => file_exists(__DIR__ . '/config/database.php'),
    'db_config_json' => file_exists(__DIR__ . '/config/db_config.json'),
    'env_php' => file_exists(__DIR__ . '/config/env.php')
];

// Version API
$api_version = '1.0.8';

// Créer la réponse
$response = [
    'status' => 'success',
    'message' => 'API système active et fonctionnelle',
    'timestamp' => time(),
    'formatted_time' => date('Y-m-d H:i:s'),
    'api_version' => $api_version,
    'environment' => $php_info,
    'files_access' => $files_access,
    'request_method' => $_SERVER['REQUEST_METHOD'],
    'request_uri' => $_SERVER['REQUEST_URI']
];

// Test de connexion à la base de données (si les fichiers existent)
if ($files_access['database_php'] && $files_access['db_config_json']) {
    try {
        require_once __DIR__ . '/config/database.php';
        
        $database = new Database();
        $conn = $database->getConnection(false);
        
        if ($database->is_connected) {
            $response['database'] = [
                'status' => 'connected',
                'host' => $database->host,
                'db_name' => $database->db_name,
                'username' => $database->username
            ];
        } else {
            $response['database'] = [
                'status' => 'error',
                'message' => $database->connection_error ?? 'Erreur de connexion non spécifiée',
                'config_exists' => true
            ];
        }
    } catch (Exception $e) {
        $response['database'] = [
            'status' => 'error',
            'message' => 'Exception lors du test de la base de données: ' . $e->getMessage(),
            'config_exists' => true
        ];
    }
} else {
    $response['database'] = [
        'status' => 'not_configured',
        'message' => 'Configuration de base de données introuvable',
        'config_exists' => false
    ];
}

// Envoyer la réponse
echo json_encode($response, JSON_PRETTY_PRINT);
?>
