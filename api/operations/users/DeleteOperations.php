
<?php
require_once dirname(__DIR__) . '/BaseOperations.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/Auth.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../middleware/ResponseHandler.php';

class UserDeleteOperations extends BaseOperations {
    public function handleDeleteRequest() {
        try {
            // Récupérer et vérifier le token d'authentification
            $headers = apache_request_headers();
            $auth = new Auth($headers);
            $userData = $auth->isAuth();
            
            if (!$userData) {
                ResponseHandler::error("Non autorisé", 401);
                return;
            }
            
            // Vérifier si l'utilisateur est admin
            if ($userData['data']['role'] !== 'admin' && $userData['data']['role'] !== 'administrateur') {
                ResponseHandler::error("Accès refusé. Droits d'administrateur requis.", 403);
                return;
            }

            // Récupérer les données
            $data = json_decode(file_get_contents("php://input"));
            error_log("Données reçues DELETE: " . json_encode($data));
            
            if (empty($data->id)) {
                ResponseHandler::error("ID non fourni", 400);
                return;
            }

            // Vérifier qu'on ne supprime pas le dernier administrateur
            $stmt = $this->model->getAdminCount();
            $adminCount = $stmt->fetchColumn();

            $userToDelete = $this->model->findById($data->id);
            if ($userToDelete && ($userToDelete['role'] === 'admin' || $userToDelete['role'] === 'administrateur') && $adminCount <= 1) {
                ResponseHandler::error("Impossible de supprimer le dernier administrateur", 400);
                return;
            }

            $this->model->id = $data->id;
            if ($this->model->delete()) {
                ResponseHandler::success(null, "Utilisateur supprimé avec succès");
            } else {
                ResponseHandler::error("Impossible de supprimer l'utilisateur", 503);
            }
        } catch (Exception $e) {
            error_log("Erreur lors de la suppression: " . $e->getMessage());
            ResponseHandler::error($e->getMessage(), 500);
        }
    }
}
?>
