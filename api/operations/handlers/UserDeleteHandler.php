
<?php
require_once dirname(__DIR__) . '/../utils/ResponseHandler.php';
require_once dirname(__DIR__) . '/../models/User.php';

class UserDeleteHandler {
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
            error_log("Exception dans UserDeleteHandler: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la suppression: " . $e->getMessage(), 500);
        }
    }
}
?>
