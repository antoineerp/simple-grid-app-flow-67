
<?php
require_once dirname(__DIR__) . '/models/User.php';
require_once dirname(__DIR__) . '/utils/ResponseHandler.php';
require_once __DIR__ . '/users/GetOperations.php';
require_once __DIR__ . '/users/PostOperations.php';
require_once __DIR__ . '/users/PutOperations.php';
require_once __DIR__ . '/users/DeleteOperations.php';

class UserOperations {
    private $db;
    private $user;
    private $getOps;
    private $postOps;
    private $putOps;
    private $deleteOps;

    public function __construct($db) {
        $this->db = $db;
        $this->user = new User($db);
        
        // S'assurer que toutes les opérations reçoivent le même modèle d'utilisateur
        $this->getOps = new UserGetOperations($db, $this->user);
        $this->postOps = new UserPostOperations($db, $this->user);
        $this->putOps = new UserPutOperations($db, $this->user);
        $this->deleteOps = new UserDeleteOperations($db, $this->user);
    }

    public function handleGetRequest() {
        $this->getOps->handleGetRequest();
    }

    public function handlePostRequest() {
        $this->postOps->handlePostRequest();
    }

    public function handlePutRequest() {
        $this->putOps->handlePutRequest();
    }

    public function handleDeleteRequest() {
        $this->deleteOps->handleDeleteRequest();
    }
}
?>
