
<?php
require_once dirname(__DIR__) . '/BaseOperations.php';

class UserGetOperations extends BaseOperations {
    public function handleGetRequest() {
        // Assurez-vous que les headers sont configurés correctement
        header('Content-Type: application/json; charset=UTF-8');
        
        // Journaliser l'appel pour le débogage
        error_log("UserGetOperations::handleGetRequest - Début");
        
        if (isset($_GET['email'])) {
            error_log("UserGetOperations - Recherche par email: " . $_GET['email']);
            $this->checkEmail($_GET['email']);
            return;
        }
        error_log("UserGetOperations - Récupération de tous les utilisateurs");
        $this->getAllUsers();
    }

    private function checkEmail($email) {
        error_log("UserGetOperations::checkEmail - Vérification de l'email: $email");
        $stmt = $this->model->findByEmailQuery($email);
        $num = $stmt ? $stmt->rowCount() : 0;
        error_log("UserGetOperations::checkEmail - Nombre d'utilisateurs trouvés: $num");
        
        $users_arr = ["records" => []];
        
        if ($num > 0) {
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                // Masquer le mot de passe dans la réponse
                $row['mot_de_passe'] = '******';
                array_push($users_arr["records"], $row);
            }
        }
        
        error_log("UserGetOperations::checkEmail - Réponse: " . json_encode($users_arr));
        ResponseHandler::success($users_arr);
    }

    private function getAllUsers() {
        error_log("UserGetOperations::getAllUsers - Début");
        
        try {
            // Force la création de la table si elle n'existe pas
            $this->model->createTableIfNotExists();
            
            // Récupère tous les utilisateurs
            $stmt = $this->model->read();
            $num = $stmt->rowCount();
            
            error_log("UserGetOperations::getAllUsers - Nombre d'utilisateurs trouvés: $num");
            
            // Initialise le tableau de réponse
            $users_arr = ["records" => []];
            
            if ($num > 0) {
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    // Masquer le mot de passe dans la réponse
                    $row['mot_de_passe'] = '******';
                    array_push($users_arr["records"], $row);
                }
                error_log("UserGetOperations::getAllUsers - Retourne " . count($users_arr["records"]) . " utilisateurs");
                ResponseHandler::success($users_arr);
            } else {
                error_log("UserGetOperations::getAllUsers - Aucun utilisateur trouvé");
                // Si aucun utilisateur n'est trouvé, retourner un tableau vide mais pas une erreur 404
                // pour éviter les problèmes côté client
                ResponseHandler::success($users_arr);
            }
        } catch (Exception $e) {
            error_log("UserGetOperations::getAllUsers - Erreur: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la récupération des utilisateurs: " . $e->getMessage(), 500);
        }
    }
}
?>
