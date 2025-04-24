
<?php
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

$baseDir = dirname(__DIR__);
require_once $baseDir . '/config/database.php';
require_once $baseDir . '/middleware/RequestHandler.php';
require_once $baseDir . '/utils/ResponseHandler.php';
require_once $baseDir . '/operations/UserOperations.php';

// Handle CORS and preflight requests
RequestHandler::handleCORS();

// Log request information
error_log("UsersController - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);
error_log("UsersController - Données brutes: " . file_get_contents("php://input"));

try {
    // Initialize database connection
    $database = new Database();
    $db = $database->getConnection(true);
    
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }

    // Initialize user operations
    $userOps = new UserOperations($db);

    // Handle request based on HTTP method
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $userOps->handleGetRequest();
            break;
            
        case 'POST':
            // Fixer les problèmes de contenu vide ou mal formaté
            $postData = file_get_contents("php://input");
            if (empty($postData)) {
                ResponseHandler::error("Aucune donnée reçue", 400);
                break;
            }
            
            // S'assurer que le JSON est valide
            $data = json_decode($postData);
            if (json_last_error() !== JSON_ERROR_NONE) {
                ResponseHandler::error("JSON invalide: " . json_last_error_msg(), 400);
                break;
            }
            
            $userOps->handlePostRequest();
            break;
            
        case 'PUT':
            $userOps->handlePutRequest();
            break;
            
        case 'DELETE':
            $userOps->handleDeleteRequest();
            break;
            
        default:
            ResponseHandler::error("Méthode non autorisée", 405);
            break;
    }
} catch (Exception $e) {
    error_log("UsersController - Exception: " . $e->getMessage());
    ResponseHandler::error(
        "Erreur serveur: " . $e->getMessage(),
        500,
        ["debug_info" => get_class($e) . " à la ligne " . $e->getLine() . " dans " . $e->getFile()]
    );
}
?>
