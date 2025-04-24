
<?php
require_once dirname(__DIR__) . '/../utils/ResponseHandler.php';
require_once dirname(__DIR__) . '/../models/User.php';

class UserPostHandler {
    private $user;

    public function __construct($user) {
        $this->user = $user;
    }

    public function handle() {
        try {
            $inputData = file_get_contents("php://input");
            if (empty($inputData)) {
                ResponseHandler::error("Aucune donnée reçue", 400);
                return;
            }
            
            error_log("Données reçues POST: " . $inputData);
            
            $data = json_decode($inputData);
            if (json_last_error() !== JSON_ERROR_NONE) {
                ResponseHandler::error("Erreur de décodage JSON: " . json_last_error_msg(), 400);
                return;
            }
            
            if (!$this->validateUserData($data)) {
                ResponseHandler::error("Données incomplètes pour la création de l'utilisateur", 400);
                return;
            }

            if ($data->role === 'gestionnaire' && $this->user->countUsersByRole('gestionnaire') > 0) {
                ResponseHandler::error("Un seul compte gestionnaire peut être créé", 409);
                return;
            }

            if ($this->user->emailExists($data->email)) {
                ResponseHandler::error("Email déjà utilisé", 409);
                return;
            }

            $this->assignUserData($data);

            if ($this->user->create()) {
                $lastId = $this->user->conn->lastInsertId();
                
                if ($data->role === 'utilisateur') {
                    $this->user->initializeUserDataFromManager($lastId);
                }
                
                ResponseHandler::success(
                    ['id' => $lastId, 'identifiant_technique' => $data->identifiant_technique],
                    "Utilisateur créé avec succès",
                    201
                );
            } else {
                ResponseHandler::error("Erreur lors de la création de l'utilisateur", 500);
            }
        } catch (Exception $e) {
            error_log("Exception dans UserPostHandler: " . $e->getMessage() . " à la ligne " . $e->getLine());
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

    private function assignUserData($data) {
        $this->user->nom = $data->nom;
        $this->user->prenom = $data->prenom;
        $this->user->email = $data->email;
        $this->user->identifiant_technique = $data->identifiant_technique;
        $this->user->mot_de_passe = $data->mot_de_passe;
        $this->user->role = $data->role;
    }
}
?>
