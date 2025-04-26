
<?php
require_once dirname(__DIR__) . '/BaseOperations.php';

class UserPutOperations extends BaseOperations {
    public function handlePutRequest() {
        $data = json_decode(file_get_contents("php://input"));
        error_log("Données reçues PUT: " . json_encode($data));
        
        if (!$this->validateUpdateData($data)) {
            ResponseHandler::error("Données incomplètes pour la mise à jour", 400);
            return;
        }

        try {
            $this->model->id = $data->id;
            $this->model->nom = $data->nom;
            $this->model->prenom = $data->prenom;
            $this->model->email = $data->email;
            $this->model->role = $data->role;

            if ($this->model->update()) {
                ResponseHandler::success(null, "Utilisateur mis à jour avec succès");
            } else {
                ResponseHandler::error("Impossible de mettre à jour l'utilisateur", 503);
            }
        } catch (Exception $e) {
            ResponseHandler::error($e->getMessage(), 500);
        }
    }

    private function validateUpdateData($data) {
        return $this->validateData($data, [
            'id',
            'nom',
            'prenom',
            'email',
            'role'
        ]);
    }
}
?>
