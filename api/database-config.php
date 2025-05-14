
<?php
// Point d'entrée pour la configuration de la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Inclure les fichiers nécessaires
require_once __DIR__ . '/config/DatabaseConfig.php';

// Installer un gestionnaire d'erreur pour renvoyer des erreurs en JSON
function json_error_handler($errno, $errstr, $errfile, $errline) {
    if (!(error_reporting() & $errno)) {
        return;
    }
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $errstr,
        'file' => basename($errfile),
        'line' => $errline
    ]);
    exit;
}

set_error_handler("json_error_handler");

try {
    $config = new DatabaseConfig();
    
    // Traitement des requêtes en fonction de la méthode
    switch($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Récupérer la configuration (sans exposer le mot de passe complet)
            echo json_encode($config->getConfig());
            break;
            
        case 'POST':
            // Mettre à jour la configuration
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!$data || !isset($data['host']) || !isset($data['db_name']) || !isset($data['username'])) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Données incomplètes']);
                break;
            }
            
            $password = isset($data['password']) ? $data['password'] : '';
            
            if ($config->updateConfig($data['host'], $data['db_name'], $data['username'], $password)) {
                echo json_encode(['status' => 'success', 'message' => 'Configuration mise à jour']);
            } else {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Échec de la mise à jour']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['status' => 'error', 'message' => 'Méthode non autorisée']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
