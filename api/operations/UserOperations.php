
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
        try {
            // Récupérer et décoder les données JSON
            $inputData = file_get_contents("php://input");
            if (empty($inputData)) {
                ResponseHandler::error("Aucune donnée reçue", 400);
                return;
            }
            
            error_log("Données reçues POST: " . $inputData);
            
            // Décoder les données JSON
            $data = json_decode($inputData);
            if (json_last_error() !== JSON_ERROR_NONE) {
                ResponseHandler::error("Erreur de décodage JSON: " . json_last_error_msg(), 400);
                return;
            }
            
            // Validation des données
            if (!$this->validateUserData($data)) {
                ResponseHandler::error("Données incomplètes pour la création de l'utilisateur", 400);
                return;
            }
            
            // Vérifier si un gestionnaire existe déjà (si rôle = gestionnaire)
            if ($data->role === 'gestionnaire' && $this->user->countUsersByRole('gestionnaire') > 0) {
                ResponseHandler::error("Un seul compte gestionnaire peut être créé", 409);
                return;
            }
            
            // Vérifier si l'email existe déjà
            if ($this->user->emailExists($data->email)) {
                ResponseHandler::error("Email déjà utilisé", 409);
                return;
            }

            // Affecter les données à l'objet user
            $this->user->nom = $data->nom;
            $this->user->prenom = $data->prenom;
            $this->user->email = $data->email;
            $this->user->identifiant_technique = $data->identifiant_technique;
            $this->user->mot_de_passe = $data->mot_de_passe;
            $this->user->role = $data->role;

            // Créer l'utilisateur
            if ($this->user->create()) {
                $lastId = $this->db->lastInsertId();
                
                // Initialiser les données pour les utilisateurs standard
                if ($data->role === 'utilisateur') {
                    $this->user->initializeUserDataFromManager($lastId);
                }
                
                // Retourner une réponse de succès
                ResponseHandler::success(
                    ['id' => $lastId, 'identifiant_technique' => $data->identifiant_technique],
                    "Utilisateur créé avec succès",
                    201
                );
            } else {
                ResponseHandler::error("Erreur lors de la création de l'utilisateur", 500);
            }
        } catch (Exception $e) {
            error_log("Exception dans handlePostRequest: " . $e->getMessage() . " à la ligne " . $e->getLine());
            ResponseHandler::error("Erreur lors de la création de l'utilisateur: " . $e->getMessage(), 500);
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
        try {
            // Récupérer et décoder les données JSON
            $inputData = file_get_contents("php://input");
            if (empty($inputData)) {
                ResponseHandler::error("Aucune donnée reçue", 400);
                return;
            }
            
            // Décoder les données JSON
            $data = json_decode($inputData);
            if (json_last_error() !== JSON_ERROR_NONE) {
                ResponseHandler::error("Erreur de décodage JSON: " . json_last_error_msg(), 400);
                return;
            }
            
            // Validation des données
            if (!$this->validateUpdateData($data)) {
                ResponseHandler::error("Données incomplètes pour la mise à jour", 400);
                return;
            }

            // Affecter les données à l'objet user
            $this->user->id = $data->id;
            $this->user->nom = $data->nom;
            $this->user->prenom = $data->prenom;
            $this->user->email = $data->email;
            $this->user->role = $data->role;

            // Mettre à jour l'utilisateur
            if ($this->user->update()) {
                ResponseHandler::success(null, "Utilisateur mis à jour avec succès");
            } else {
                ResponseHandler::error("Impossible de mettre à jour l'utilisateur", 503);
            }
        } catch (Exception $e) {
            error_log("Exception dans handlePutRequest: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la mise à jour: " . $e->getMessage(), 500);
        }
    }

    public function handleDeleteRequest() {
        try {
            // Récupérer et décoder les données JSON
            $inputData = file_get_contents("php://input");
            if (empty($inputData)) {
                ResponseHandler::error("Aucune donnée reçue", 400);
                return;
            }
            
            // Décoder les données JSON
            $data = json_decode($inputData);
            if (json_last_error() !== JSON_ERROR_NONE) {
                ResponseHandler::error("Erreur de décodage JSON: " . json_last_error_msg(), 400);
                return;
            }
            
            if (empty($data->id)) {
                ResponseHandler::error("ID non fourni", 400);
                return;
            }

            $this->user->id = $data->id;
            if ($this->user->delete()) {
                ResponseHandler::success(null, "Utilisateur supprimé avec succès");
            } else {
                ResponseHandler::error("Impossible de supprimer l'utilisateur", 503);
            }
        } catch (Exception $e) {
            error_log("Exception dans handleDeleteRequest: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la suppression: " . $e->getMessage(), 500);
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
