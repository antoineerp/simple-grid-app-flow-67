
<?php
require_once dirname(__DIR__) . '/models/User.php';
require_once dirname(__DIR__) . '/utils/ResponseHandler.php';

class UserOperations {
    private $user;
    private $db;

    public function __construct($db) {
        $this->db = $db;
        $this->user = new User($db);
    }

    public function handleGetRequest() {
        if (isset($_GET['email'])) {
            $this->checkEmail($_GET['email']);
            return;
        }
        $this->getAllUsers();
    }

    public function handlePostRequest() {
        $data = json_decode(file_get_contents("php://input"));
        error_log("Données reçues POST: " . json_encode($data));

        if (!$this->validateUserData($data)) {
            ResponseHandler::error("Données incomplètes", 400);
            return;
        }

        try {
            if ($data->role === 'gestionnaire' && $this->user->countUsersByRole('gestionnaire') > 0) {
                ResponseHandler::error("Un seul compte gestionnaire peut être créé", 409);
                return;
            }

            if ($this->user->emailExists($data->email)) {
                ResponseHandler::error("Email déjà utilisé", 409);
                return;
            }

            $this->user->nom = $data->nom;
            $this->user->prenom = $data->prenom;
            $this->user->email = $data->email;
            $this->user->identifiant_technique = $data->identifiant_technique;
            $this->user->mot_de_passe = $data->mot_de_passe;
            $this->user->role = $data->role;

            if ($this->user->create()) {
                $lastId = $this->db->lastInsertId();
                if ($this->user->role === 'utilisateur') {
                    $this->user->initializeUserDataFromManager($lastId);
                }
                ResponseHandler::success(
                    ['id' => $lastId],
                    "Utilisateur créé avec succès",
                    201
                );
            }
        } catch (Exception $e) {
            error_log("Erreur création utilisateur: " . $e->getMessage());
            ResponseHandler::error($e->getMessage(), 500);
        }
    }

    private function validateUserData($data) {
        return !empty($data->nom) &&
               !empty($data->prenom) &&
               !empty($data->email) &&
               !empty($data->identifiant_technique) &&
               !empty($data->mot_de_passe) &&
               !empty($data->role);
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

    public function handlePutRequest() {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$this->validateUpdateData($data)) {
            ResponseHandler::error("Données incomplètes pour la mise à jour", 400);
            return;
        }

        try {
            $this->user->id = $data->id;
            $this->user->nom = $data->nom;
            $this->user->prenom = $data->prenom;
            $this->user->email = $data->email;
            $this->user->role = $data->role;

            if ($this->user->update()) {
                ResponseHandler::success(null, "Utilisateur mis à jour avec succès");
            } else {
                ResponseHandler::error("Impossible de mettre à jour l'utilisateur", 503);
            }
        } catch (Exception $e) {
            ResponseHandler::error($e->getMessage(), 500);
        }
    }

    public function handleDeleteRequest() {
        $data = json_decode(file_get_contents("php://input"));
        
        if (empty($data->id)) {
            ResponseHandler::error("ID non fourni", 400);
            return;
        }

        try {
            $this->user->id = $data->id;
            if ($this->user->delete()) {
                ResponseHandler::success(null, "Utilisateur supprimé avec succès");
            } else {
                ResponseHandler::error("Impossible de supprimer l'utilisateur", 503);
            }
        } catch (Exception $e) {
            ResponseHandler::error($e->getMessage(), 500);
        }
    }

    private function validateUpdateData($data) {
        return !empty($data->id) &&
               !empty($data->nom) &&
               !empty($data->prenom) &&
               !empty($data->email) &&
               !empty($data->role);
    }
}
?>
