
<?php
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/middleware/RequestHandler.php';
require_once dirname(__DIR__) . '/utils/ResponseHandler.php';
require_once dirname(__DIR__) . '/operations/UserOperations.php';
require_once dirname(__DIR__) . '/operations/users/DeleteOperations.php';

class UsersController {
    private $database;
    private $connection;
    private $userOperations;
    private $deleteOperations;
    
    public function __construct() {
        // Initialiser la connexion à la base de données
        try {
            $this->database = new Database();
            $this->connection = $this->database->getConnection(true);
            
            if (!$this->connection) {
                throw new Exception("Impossible de se connecter à la base de données");
            }
            
            $this->userOperations = new UserOperations($this->connection);
            $this->deleteOperations = new UserDeleteOperations($this->connection);
        } catch (Exception $e) {
            error_log("UsersController::__construct - Exception: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function processRequest() {
        try {
            // Vérifier l'action demandée (si spécifiée)
            if (isset($_GET['action'])) {
                switch ($_GET['action']) {
                    case 'ensure_tables':
                        // Action pour vérifier et créer les tables de tous les utilisateurs
                        $result = $this->userOperations->ensureAllUserTablesExist();
                        ResponseHandler::success([
                            'success' => !empty($result),
                            'message' => !empty($result) ? 'Tables vérifiées et créées avec succès pour tous les utilisateurs' : 'Échec lors de la vérification des tables',
                            'results' => $result
                        ]);
                        return;
                        
                    case 'create_tables_for_user':
                        // Action pour créer les tables d'un utilisateur spécifique
                        if (!isset($_GET['userId'])) {
                            ResponseHandler::error("Paramètre userId manquant", 400);
                            return;
                        }
                        $result = $this->userOperations->createUserTables($_GET['userId']);
                        ResponseHandler::success([
                            'success' => $result['success'] ?? false,
                            'message' => $result['success'] ? "Tables créées avec succès pour l'utilisateur {$_GET['userId']}" : "Échec lors de la création des tables pour l'utilisateur {$_GET['userId']}",
                            'tables_created' => $result['tables_created'] ?? []
                        ]);
                        return;
                }
            }
            
            // Traiter la requête selon la méthode HTTP
            switch ($_SERVER['REQUEST_METHOD']) {
                case 'GET':
                    $this->userOperations->handleGetRequest();
                    break;
                    
                case 'POST':
                    $this->userOperations->handlePostRequest();
                    break;
                    
                case 'PUT':
                    $this->userOperations->handlePutRequest();
                    break;
                    
                case 'DELETE':
                    $this->deleteOperations->handleDeleteRequest();
                    break;
                    
                default:
                    ResponseHandler::error("Méthode non autorisée", 405);
                    break;
            }
        } catch (Exception $e) {
            error_log("UsersController::processRequest - Exception: " . $e->getMessage());
            ResponseHandler::error('Erreur serveur: ' . $e->getMessage(), 500);
        }
    }
}
?>
