
<?php
require_once dirname(__DIR__) . '/models/User.php';
require_once dirname(__DIR__) . '/utils/ResponseHandler.php';
require_once dirname(__FILE__) . '/users/CreateOperations.php';
require_once dirname(__FILE__) . '/users/ReadOperations.php';
require_once dirname(__FILE__) . '/users/UpdateOperations.php';
require_once dirname(__FILE__) . '/users/DeleteOperations.php';
require_once dirname(__DIR__) . '/services/TableManager.php';

class UserOperations {
    private $conn;
    private $model;
    private $createOps;
    private $readOps;
    private $updateOps;
    private $deleteOps;

    public function __construct($db) {
        $this->conn = $db;
        $this->model = new User($db);
        $this->createOps = new UserCreateOperations($db, $this->model);
        $this->readOps = new UserReadOperations($db, $this->model);
        $this->updateOps = new UserUpdateOperations($db, $this->model);
        $this->deleteOps = new UserDeleteOperations($db, $this->model);
        
        error_log("UserOperations initialisé avec connexion DB");
    }

    public function handleGetRequest() {
        $this->readOps->handleGetRequest();
    }

    public function handlePostRequest() {
        $this->createOps->handlePostRequest();
    }

    public function handlePutRequest() {
        $this->updateOps->handlePutRequest();
    }

    public function handleDeleteRequest() {
        $this->deleteOps->handleDeleteRequest();
    }
    
    /**
     * Initialise les tables standard pour un utilisateur
     * 
     * @param string $userId Identifiant technique de l'utilisateur
     * @return bool Succès de l'opération
     */
    public static function initializeUserTables($conn, $userId) {
        error_log("Initialisation des tables pour l'utilisateur: {$userId}");
        
        // Tableau des tables à créer pour chaque utilisateur
        $standardTables = [
            'documents',
            'membres',
            'exigences',
            'bibliotheque',
            'collaboration',
            'collaboration_groups'
        ];
        
        $tablesCreated = 0;
        
        foreach ($standardTables as $tableBase) {
            if (TableManager::initializeTableForUser($conn, $tableBase, $userId)) {
                $tablesCreated++;
            }
        }
        
        error_log("Tables initialisées pour {$userId}: {$tablesCreated}/{count($standardTables)}");
        return $tablesCreated == count($standardTables);
    }
}
?>
