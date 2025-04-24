
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
            error_log("Validation des données utilisateur échouée");
            ResponseHandler::error("Données incomplètes ou invalides", 400);
            return;
        }

        try {
            error_log("Vérification du rôle gestionnaire: " . $data->role);
            if ($data->role === 'gestionnaire' && $this->user->countUsersByRole('gestionnaire') > 0) {
                error_log("Tentative de création d'un second compte gestionnaire rejetée");
                ResponseHandler::error("Un seul compte gestionnaire peut être créé", 409);
                return;
            }

            error_log("Vérification de l'email: " . $data->email);
            if ($this->user->emailExists($data->email)) {
                error_log("Email déjà utilisé: " . $data->email);
                ResponseHandler::error("Email déjà utilisé", 409);
                return;
            }

            // Assigner les valeurs à l'objet utilisateur
            $this->user->nom = $data->nom;
            $this->user->prenom = $data->prenom;
            $this->user->email = $data->email;
            $this->user->identifiant_technique = $data->identifiant_technique;
            $this->user->mot_de_passe = $data->mot_de_passe;
            $this->user->role = $data->role;

            error_log("Tentative de création de l'utilisateur: " . $data->nom . " " . $data->prenom);
            
            // Vérifier la création
            if ($this->user->create()) {
                $lastId = $this->db->lastInsertId();
                error_log("Utilisateur créé avec succès. ID: " . $lastId);
                
                if ($data->role === 'utilisateur') {
                    error_log("Initialisation des données utilisateur depuis le gestionnaire");
                    $this->user->initializeUserDataFromManager($data->identifiant_technique);
                }
                
                // Renvoyer une réponse avec les données minimales nécessaires
                $responseData = [
                    'id' => $lastId,
                    'identifiant_technique' => $data->identifiant_technique,
                    'nom' => $data->nom,
                    'prenom' => $data->prenom,
                    'email' => $data->email,
                    'role' => $data->role
                ];
                
                // S'assurer que les headers sont correctement définis
                header('Content-Type: application/json; charset=UTF-8');
                http_response_code(201);
                
                ResponseHandler::success(
                    $responseData,
                    "Utilisateur créé avec succès",
                    201
                );
            } else {
                error_log("Échec de création de l'utilisateur sans exception");
                ResponseHandler::error("Échec de création de l'utilisateur", 500);
            }
        } catch (Exception $e) {
            error_log("Erreur création utilisateur: " . $e->getMessage());
            ResponseHandler::error($e->getMessage(), 500);
        }
    }

    private function validateUserData($data) {
        error_log("Validation des données: " . json_encode($data));
        
        $isValid = !empty($data->nom) &&
               !empty($data->prenom) &&
               !empty($data->email) &&
               !empty($data->identifiant_technique) &&
               !empty($data->mot_de_passe) &&
               !empty($data->role);
               
        if (!$isValid) {
            error_log("Champs manquants: " . 
                (empty($data->nom) ? "nom " : "") .
                (empty($data->prenom) ? "prenom " : "") .
                (empty($data->email) ? "email " : "") .
                (empty($data->identifiant_technique) ? "identifiant_technique " : "") .
                (empty($data->mot_de_passe) ? "mot_de_passe " : "") .
                (empty($data->role) ? "role " : ""));
        }
               
        return $isValid;
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
        error_log("Données reçues PUT: " . json_encode($data));
        
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
        error_log("Données reçues DELETE: " . json_encode($data));
        
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
