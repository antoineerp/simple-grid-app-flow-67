
<?php
require_once dirname(__DIR__) . '/BaseOperations.php';

class UserGetOperations extends BaseOperations {
    public function handleGetRequest() {
        if (isset($_GET['email'])) {
            $this->checkEmail($_GET['email']);
            return;
        }
        $this->getAllUsers();
    }

    private function checkEmail($email) {
        $stmt = $this->model->findByEmailQuery($email);
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
        error_log("UserGetOperations - Getting all users");
        $stmt = $this->model->read();
        $num = $stmt->rowCount();
        
        error_log("UserGetOperations - Found {$num} users");
        
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
