
<?php
// Point d'entrée API simple et direct
header('Content-Type: application/json; charset=utf-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
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
    'sapi' => php_sapi_name()
];

// Version API
$api_version = '1.1.0';

// Créer la réponse
$response = [
    'status' => 'success',
    'message' => 'API active et fonctionnelle',
    'timestamp' => time(),
    'formatted_time' => date('Y-m-d H:i:s'),
    'api_version' => $api_version,
    'environment' => $php_info
];

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

// Envoyer la réponse
echo json_encode($response);
?>
