
<?php
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

require_once dirname(__DIR__) . '/utils/ResponseHandler.php';
require_once dirname(__DIR__) . '/operations/users/GetOperations.php';
require_once dirname(__DIR__) . '/operations/users/PostOperations.php';
require_once dirname(__DIR__) . '/operations/users/PutOperations.php';
require_once dirname(__DIR__) . '/operations/users/DeleteOperations.php';
require_once dirname(__DIR__) . '/models/User.php';

class UserOperations {
    protected $conn;
    protected $model;
    
    public function __construct($db) {
        $this->conn = $db;
        $this->model = new User($db);
        
        // Force l'utilisation de la table utilisateurs_p71x6d_richard
        $this->model->table = 'utilisateurs_p71x6d_richard';
        error_log("UserOperations: Utilisation forcée de la table {$this->model->table}");
    }
    
    public function handleGetRequest() {
        $getOps = new UserGetOperations();
        $getOps->model = $this->model;
        $getOps->conn = $this->conn;
        $getOps->handleGetRequest();
    }
    
    public function handlePostRequest() {
        $postOps = new UserPostOperations();
        $postOps->model = $this->model;
        $postOps->conn = $this->conn;
        $postOps->handlePostRequest();
    }
    
    public function handlePutRequest() {
        $putOps = new UserPutOperations();
        $putOps->model = $this->model;
        $putOps->conn = $this->conn;
        $putOps->handlePutRequest();
    }
    
    public function handleDeleteRequest() {
        $deleteOps = new UserDeleteOperations();
        $deleteOps->model = $this->model;
        $deleteOps->conn = $this->conn;
        $deleteOps->handleDeleteRequest();
    }
}

class BaseOperations {
    public $model;
    public $conn;
}
