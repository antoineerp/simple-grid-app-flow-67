
<?php
require_once dirname(__DIR__) . '/../utils/ResponseHandler.php';
require_once dirname(__DIR__) . '/../models/User.php';

class UserPutHandler {
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
            
            $data = json_decode($inputData);
            if (json_last_error() !== JSON_ERROR_NONE) {
                ResponseHandler::error("Erreur de décodage JSON: " . json_last_error_msg(), 400);
                return;
            }
            
            if (!$this->validateUpdateData($data)) {
                ResponseHandler::error("Données incomplètes pour la mise à jour", 400);
                return;
            }

            $this->assignUpdateData($data);

            if ($this->user->update()) {
                ResponseHandler::success(null, "Utilisateur mis à jour avec succès");
            } else {
                ResponseHandler::error("Impossible de mettre à jour l'utilisateur", 503);
            }
        } catch (Exception $e) {
            error_log("Exception dans UserPutHandler: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la mise à jour: " . $e->getMessage(), 500);
        }
    }

    private function validateUpdateData($data) {
        return !empty($data->id) &&
               !empty($data->nom) &&
               !empty($data->prenom) &&
               !empty($data->email) &&
               !empty($data->role);
    }

    private function assignUpdateData($data) {
        $this->user->id = $data->id;
        $this->user->nom = $data->nom;
        $this->user->prenom = $data->prenom;
        $this->user->email = $data->email;
        $this->user->role = $data->role;
    }
}
?>
