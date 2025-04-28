
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Configuration stricte des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0); 
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// Headers CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight request accepted']);
    exit;
}

// Journaliser l'accès
error_log("Accès au script config-test.php - Méthode: " . $_SERVER['REQUEST_METHOD']);

try {
    // Configuration par défaut
    $config = [
        'api_urls' => [
            'development' => '/api',
            'production' => '/api'
        ],
        'allowed_origins' => [
            'development' => '*',
            'production' => '*'
        ]
    ];
    
    // Fichier de configuration
    $configFile = __DIR__ . '/config/app_config.json';
    
    // Lire la configuration si elle existe
    if (file_exists($configFile)) {
        $configData = file_get_contents($configFile);
        $parsedConfig = json_decode($configData, true);
        if ($parsedConfig) {
            $config = $parsedConfig;
        }
    }
    
    // Envoyer la réponse
    http_response_code(200);
    echo json_encode($config);
} catch (Exception $e) {
    // Journaliser l'erreur
    error_log("Erreur dans config-test.php: " . $e->getMessage());
    
    // Envoyer une réponse d'erreur
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de la récupération de la configuration',
        'error' => $e->getMessage()
    ]);
} finally {
    // S'assurer que tout buffer est vidé
    if (ob_get_level()) ob_end_flush();
}
?>
