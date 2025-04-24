
<?php
require_once dirname(__DIR__) . '/models/User.php';
require_once dirname(__DIR__) . '/utils/ResponseHandler.php';
require_once __DIR__ . '/handlers/UserGetHandler.php';
require_once __DIR__ . '/handlers/UserPostHandler.php';
require_once __DIR__ . '/handlers/UserPutHandler.php';
require_once __DIR__ . '/handlers/UserDeleteHandler.php';

class UserOperations {
    private $user;
    private $db;

    public function __construct($db) {
        $this->db = $db;
        $this->user = new User($db);
    }

    public function handleGetRequest() {
        $handler = new UserGetHandler($this->user);
        $handler->handle();
    }

    public function handlePostRequest() {
        $handler = new UserPostHandler($this->user);
        $handler->handle();
    }

    public function handlePutRequest() {
        $handler = new UserPutHandler($this->user);
        $handler->handle();
    }

    public function handleDeleteRequest() {
        $handler = new UserDeleteHandler($this->user);
        $handler->handle();
    }
}
?>
