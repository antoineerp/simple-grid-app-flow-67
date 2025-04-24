
<?php
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

$baseDir = dirname(__DIR__);
require_once $baseDir . '/config/database.php';
require_once $baseDir . '/middleware/RequestHandler.php';
require_once $baseDir . '/utils/ResponseHandler.php';
require_once $baseDir . '/models/Document.php';

// Handle CORS and preflight requests
RequestHandler::handleCORS();

// Log request information
error_log("DocumentsController - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

try {
    // Initialize database connection
    $database = new Database();
    $db = $database->getConnection(true);
    
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }
    
    // Initialiser le modèle Document
    $documentModel = new Document($db);

    // Récupérer et décoder les données JSON
    $requestBody = file_get_contents("php://input");
    $data = json_decode($requestBody);

    // Handle request based on HTTP method
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Récupérer les documents pour un utilisateur spécifique
            if (isset($_GET['user_id'])) {
                getDocumentsForUser($documentModel, $_GET['user_id']);
            } else {
                ResponseHandler::error("User ID requis", 400);
            }
            break;
            
        case 'POST':
            // Sauvegarder les documents pour un utilisateur
            if ($data && isset($data->user_id) && isset($data->documents)) {
                saveDocuments($documentModel, $data->user_id, $data->documents);
            } else {
                ResponseHandler::error("Données incomplètes", 400);
            }
            break;
            
        default:
            ResponseHandler::error("Méthode non autorisée", 405);
            break;
    }
} catch (Exception $e) {
    error_log("DocumentsController - Exception: " . $e->getMessage());
    ResponseHandler::error(
        "Erreur serveur: " . $e->getMessage(),
        500,
        ["debug_info" => get_class($e) . " à la ligne " . $e->getLine() . " dans " . $e->getFile()]
    );
}

/**
 * Récupère les documents pour un utilisateur spécifique
 */
function getDocumentsForUser($documentModel, $userId) {
    try {
        $result = $documentModel->getDocumentsForUser($userId);
        
        $documents = [];
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
            $documents[] = $row;
        }
        
        ResponseHandler::success([
            'success' => true,
            'documents' => $documents
        ]);
    } catch (PDOException $e) {
        error_log("Erreur lors de la récupération des documents: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Sauvegarde les documents pour un utilisateur
 */
function saveDocuments($documentModel, $userId, $documents) {
    try {
        $success = $documentModel->saveDocuments($userId, $documents);
        
        if ($success) {
            ResponseHandler::success([
                'success' => true,
                'message' => 'Documents sauvegardés avec succès',
                'count' => count($documents)
            ]);
        } else {
            ResponseHandler::error("Échec de la sauvegarde des documents", 500);
        }
    } catch (PDOException $e) {
        error_log("Erreur lors de la sauvegarde des documents: " . $e->getMessage());
        throw $e;
    }
}
?>
