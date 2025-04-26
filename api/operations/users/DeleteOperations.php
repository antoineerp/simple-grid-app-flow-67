
<?php
require_once dirname(__DIR__) . '/BaseOperations.php';

class UserDeleteOperations extends BaseOperations {
    public function handleDeleteRequest() {
        $data = json_decode(file_get_contents("php://input"));
        error_log("Données reçues DELETE: " . json_encode($data));
        
        if (empty($data->id)) {
            ResponseHandler::error("ID non fourni", 400);
            return;
        }

        try {
            $this->model->id = $data->id;
            if ($this->model->delete()) {
                ResponseHandler::success(null, "Utilisateur supprimé avec succès");
            } else {
                ResponseHandler::error("Impossible de supprimer l'utilisateur", 503);
            }
        } catch (Exception $e) {
            ResponseHandler::error($e->getMessage(), 500);
        }
    }
}
?>
