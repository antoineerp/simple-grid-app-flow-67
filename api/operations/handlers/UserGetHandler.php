
<?php
require_once dirname(__DIR__) . '/../utils/ResponseHandler.php';
require_once dirname(__DIR__) . '/../models/User.php';

class UserGetHandler {
    private $user;

    public function __construct($user) {
        $this->user = $user;
    }

    public function handle() {
        if (isset($_GET['email'])) {
            $this->checkEmail($_GET['email']);
            return;
        }
        $this->getAllUsers();
    }

    private function checkEmail($email) {
        $stmt = $this->user->findByEmailQuery($email);
        $num = $stmt ? $stmt->rowCount() : 0;
        
        $users_arr = ["records" => []];
        
        if ($num > 0) {
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $row['mot_de_passe'] = '******';
                array_push($users_arr["records"], $row);
            }
        }
        
        ResponseHandler::success($users_arr);
    }

    private function getAllUsers() {
        $stmt = $this->user->read();
        $num = $stmt->rowCount();
        
        if ($num > 0) {
            $users_arr = ["records" => []];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $row['mot_de_passe'] = '******';
                array_push($users_arr["records"], $row);
            }
            ResponseHandler::success($users_arr);
        } else {
            ResponseHandler::error("Aucun utilisateur trouvé", 404);
        }
    }
}
?>
