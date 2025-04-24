
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
error_log("UserController - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

try {
    // Initialize database connection
    $database = new Database();
    $db = $database->getConnection(true);
    
    if (!$database->is_connected) {
        error_log("UserController - Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }

    error_log("UserController - Connexion à la base de données réussie");
    
    // Initialize user operations
    $userOps = new UserOperations($db);

    // Handle request based on HTTP method
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            error_log("UserController - Traitement de la requête GET");
            $userOps->handleGetRequest();
            break;
            
        case 'POST':
            error_log("UserController - Traitement de la requête POST");
            $inputData = file_get_contents("php://input");
            error_log("UserController - Données reçues: " . $inputData);
            $userOps->handlePostRequest();
            break;
            
        case 'PUT':
            error_log("UserController - Traitement de la requête PUT");
            $userOps->handlePutRequest();
            break;
            
        case 'DELETE':
            error_log("UserController - Traitement de la requête DELETE");
            $userOps->handleDeleteRequest();
            break;
            
        default:
            ResponseHandler::error("Méthode non autorisée", 405);
            break;
    }
} catch (Exception $e) {
    error_log("UserController - Exception: " . $e->getMessage() . " à la ligne " . $e->getLine() . " dans " . $e->getFile());
    ResponseHandler::error(
        "Erreur serveur: " . $e->getMessage(),
        500,
        ["debug_info" => get_class($e) . " à la ligne " . $e->getLine() . " dans " . $e->getFile()]
    );
}
?>
