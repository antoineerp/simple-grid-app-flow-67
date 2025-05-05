
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

// Log request information for debugging
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
            // Capturer les données brutes
            $postData = file_get_contents("php://input");
            error_log("UsersController - Données POST brutes: " . $postData);
            
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
            
            // Log des données après décodage JSON pour debug
            error_log("UsersController - Données JSON décodées: " . json_encode($data));
            
            // Vérifier que les en-têtes de réponse sont correctement définis
            if (!headers_sent()) {
                header('Content-Type: application/json; charset=UTF-8');
            }
            
            // Appel à la méthode de traitement des requêtes POST
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
    error_log("UsersController - Exception: " . $e->getMessage() . " dans " . $e->getFile() . " à la ligne " . $e->getLine());
    
    // Nettoyer tout buffer de sortie existant
    if (ob_get_level()) {
        ob_clean();
    }
    
    // S'assurer que les en-têtes sont correctement définis
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=UTF-8');
    }
    
    ResponseHandler::error(
        "Erreur serveur: " . $e->getMessage(),
        500,
        ["debug_info" => get_class($e) . " à la ligne " . $e->getLine() . " dans " . $e->getFile()]
    );
}
?>
