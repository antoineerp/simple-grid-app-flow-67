
<?php
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

$baseDir = dirname(__DIR__);
require_once $baseDir . '/config/database.php';
require_once $baseDir . '/middleware/RequestHandler.php';
require_once $baseDir . '/utils/ResponseHandler.php';
require_once $baseDir . '/middleware/Auth.php';
require_once $baseDir . '/operations/SelectionOperations.php';

// Gérer CORS et requêtes preflight
RequestHandler::handleCORS();

// Journaliser les informations sur la requête pour débogage
error_log("SelectionsController - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);
error_log("SelectionsController - Données brutes: " . file_get_contents("php://input"));

try {
    // Récupérer les en-têtes pour l'authentification
    $allHeaders = getallheaders();
    $auth = new Auth($allHeaders);
    $userData = $auth->isAuth();
    
    if (!$userData) {
        ResponseHandler::error("Non authentifié", 401);
        exit;
    }
    
    // Vérifier que l'ID utilisateur existe dans les données d'authentification
    if (!isset($userData->user->id)) {
        ResponseHandler::error("Données utilisateur incomplètes", 401);
        exit;
    }
    
    $userId = $userData->user->id;
    
    // Initialiser la connexion à la base de données
    $database = new Database();
    $db = $database->getConnection(true);
    
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }

    // Initialiser les opérations de sélection
    $selectionOps = new SelectionOperations($db);
    
    // Traiter la requête selon la méthode HTTP
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Récupérer les sélections de l'utilisateur
            $selections = $selectionOps->getUserSelections($userId);
            ResponseHandler::success(['selections' => $selections]);
            break;
            
        case 'POST':
            // Capturer et valider les données de la requête
            $postData = json_decode(file_get_contents("php://input"));
            
            if (empty($postData)) {
                ResponseHandler::error("Aucune donnée reçue", 400);
                break;
            }
            
            // Vérifier les champs requis
            if (!isset($postData->checkboxId) || !isset($postData->isSelected)) {
                ResponseHandler::error("Données incomplètes: checkboxId et isSelected requis", 400);
                break;
            }
            
            // Mettre à jour la sélection
            $result = $selectionOps->updateSelection($userId, $postData->checkboxId, $postData->isSelected);
            
            if ($result) {
                ResponseHandler::success(['message' => 'Sélection mise à jour avec succès']);
            } else {
                ResponseHandler::error("Échec de la mise à jour de la sélection", 500);
            }
            break;
            
        case 'PUT':
            // Mise à jour en masse des sélections
            $putData = json_decode(file_get_contents("php://input"));
            
            if (empty($putData) || !isset($putData->selections) || !is_array($putData->selections)) {
                ResponseHandler::error("Données invalides pour la mise à jour en masse", 400);
                break;
            }
            
            $result = $selectionOps->bulkUpdateSelections($userId, $putData->selections);
            
            if ($result) {
                ResponseHandler::success(['message' => 'Sélections mises à jour avec succès']);
            } else {
                ResponseHandler::error("Échec de la mise à jour des sélections", 500);
            }
            break;
            
        default:
            ResponseHandler::error("Méthode non autorisée", 405);
            break;
    }
} catch (Exception $e) {
    error_log("SelectionsController - Exception: " . $e->getMessage() . " dans " . $e->getFile() . " à la ligne " . $e->getLine());
    
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
