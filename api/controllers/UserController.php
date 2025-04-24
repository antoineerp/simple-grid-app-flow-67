
<?php
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

error_log("====== DÉBUT DU CONTRÔLEUR UTILISATEURS ======");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " | URI: " . $_SERVER['REQUEST_URI']);

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
        error_log("UserController - ERREUR CRITIQUE: Connexion à la base de données échouée: " . ($database->connection_error ?? "Erreur inconnue"));
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }

    error_log("UserController - Connexion à la base de données réussie");
    
    // Initialize user operations
    $userOps = new UserOperations($db);
    error_log("UserController - UserOperations initialisé");

    // Handle request based on HTTP method
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            error_log("UserController - Traitement de la requête GET");
            $userOps->handleGetRequest();
            break;
            
        case 'POST':
            error_log("UserController - Traitement de la requête POST");
            $inputData = file_get_contents("php://input");
            
            if (empty($inputData)) {
                error_log("UserController - ERREUR: Aucune donnée reçue dans POST");
                ResponseHandler::error("Aucune donnée reçue", 400);
                return;
            } else {
                error_log("UserController - Données reçues: " . $inputData);
                
                // Masquer le mot de passe dans les logs
                $logData = json_decode($inputData, true);
                if ($logData && isset($logData['mot_de_passe'])) {
                    $logData['mot_de_passe'] = '******';
                    error_log("UserController - Données pour traitement (mot de passe masqué): " . json_encode($logData));
                }
            }
            
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
            error_log("UserController - ERREUR: Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
            ResponseHandler::error("Méthode non autorisée", 405);
            break;
    }
} catch (Exception $e) {
    error_log("UserController - EXCEPTION CRITIQUE: " . $e->getMessage() . " à la ligne " . $e->getLine() . " dans " . $e->getFile());
    error_log("UserController - Trace: " . $e->getTraceAsString());
    ResponseHandler::error(
        "Erreur serveur interne: " . $e->getMessage(),
        500,
        ["debug_info" => get_class($e) . " à la ligne " . $e->getLine() . " dans " . $e->getFile()]
    );
}
error_log("====== FIN DU CONTRÔLEUR UTILISATEURS ======");
?>
