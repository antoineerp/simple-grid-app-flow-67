
<?php
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

$baseDir = dirname(__DIR__);
require_once $baseDir . '/config/database.php';
require_once $baseDir . '/middleware/RequestHandler.php';
require_once $baseDir . '/utils/ResponseHandler.php';
require_once $baseDir . '/models/Exigence.php';

// Handle CORS and preflight requests
RequestHandler::handleCORS();

// Log request information
error_log("ExigencesController - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

try {
    // Initialize database connection
    $database = new Database();
    $db = $database->getConnection(true);
    
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }
    
    // Initialiser le modèle Exigence
    $exigenceModel = new Exigence($db);

    // Récupérer et décoder les données JSON
    $requestBody = file_get_contents("php://input");
    $data = json_decode($requestBody);

    // Handle request based on HTTP method
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Récupérer les exigences pour un utilisateur spécifique
            if (isset($_GET['user_id'])) {
                getExigencesForUser($exigenceModel, $_GET['user_id']);
            } else {
                ResponseHandler::error("User ID requis", 400);
            }
            break;
            
        case 'POST':
            // Sauvegarder les exigences pour un utilisateur
            if ($data && isset($data->user_id) && isset($data->exigences)) {
                saveExigences($exigenceModel, $data->user_id, $data->exigences);
            } else {
                ResponseHandler::error("Données incomplètes", 400);
            }
            break;
            
        default:
            ResponseHandler::error("Méthode non autorisée", 405);
            break;
    }
} catch (Exception $e) {
    error_log("ExigencesController - Exception: " . $e->getMessage());
    ResponseHandler::error(
        "Erreur serveur: " . $e->getMessage(),
        500,
        ["debug_info" => get_class($e) . " à la ligne " . $e->getLine() . " dans " . $e->getFile()]
    );
}

/**
 * Récupère les exigences pour un utilisateur spécifique
 */
function getExigencesForUser($exigenceModel, $userId) {
    try {
        $result = $exigenceModel->getExigencesForUser($userId);
        
        $exigences = [];
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
            $exigences[] = $row;
        }
        
        ResponseHandler::success([
            'success' => true,
            'exigences' => $exigences
        ]);
    } catch (PDOException $e) {
        error_log("Erreur lors de la récupération des exigences: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Sauvegarde les exigences pour un utilisateur
 */
function saveExigences($exigenceModel, $userId, $exigences) {
    try {
        $success = $exigenceModel->saveExigences($userId, $exigences);
        
        if ($success) {
            ResponseHandler::success([
                'success' => true,
                'message' => 'Exigences sauvegardées avec succès',
                'count' => count($exigences)
            ]);
        } else {
            ResponseHandler::error("Échec de la sauvegarde des exigences", 500);
        }
    } catch (PDOException $e) {
        error_log("Erreur lors de la sauvegarde des exigences: " . $e->getMessage());
        throw $e;
    }
}
?>
