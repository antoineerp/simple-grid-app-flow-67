
<?php
require_once dirname(dirname(__FILE__)) . '/BaseOperations.php';

class UserPutOperations extends BaseOperations {
    public function handlePutRequest() {
        // Nettoyer tout buffer de sortie existant
        if (ob_get_level()) ob_clean();
        
        // Assurez-vous que les headers sont configurés correctement
        header('Content-Type: application/json; charset=UTF-8');
        
        // Journaliser l'appel pour le débogage
        error_log("UserPutOperations::handlePutRequest - Début");
        
        try {
            // Récupérer les données PUT
            $json_data = file_get_contents("php://input");
            error_log("UserPutOperations - Données PUT brutes: " . $json_data);
            
            if (empty($json_data)) {
                ResponseHandler::error("Aucune donnée reçue", 400);
                return;
            }
            
            $data = json_decode($json_data);
            if (json_last_error() !== JSON_ERROR_NONE) {
                ResponseHandler::error("JSON invalide: " . json_last_error_msg(), 400);
                return;
            }
            
            // Vérifier que l'ID est présent
            if (!isset($data->id)) {
                ResponseHandler::error("ID de l'utilisateur non spécifié", 400);
                return;
            }
            
            // Récupérer l'utilisateur existant
            $user = $this->model->findById($data->id);
            if (!$user) {
                ResponseHandler::error("Utilisateur non trouvé", 404);
                return;
            }
            
            // Mettre à jour uniquement les champs fournis
            $this->model->id = $data->id;
            $this->model->nom = isset($data->nom) ? $data->nom : $user['nom'];
            $this->model->prenom = isset($data->prenom) ? $data->prenom : $user['prenom'];
            $this->model->email = isset($data->email) ? $data->email : $user['email'];
            $this->model->role = isset($data->role) ? $data->role : $user['role'];
            
            // Mettre à jour l'utilisateur
            if ($this->model->update()) {
                ResponseHandler::success([
                    "message" => "Utilisateur mis à jour avec succès",
                    "user" => [
                        "id" => $this->model->id,
                        "nom" => $this->model->nom,
                        "prenom" => $this->model->prenom,
                        "email" => $this->model->email,
                        "role" => $this->model->role
                    ]
                ]);
            } else {
                ResponseHandler::error("Impossible de mettre à jour l'utilisateur", 500);
            }
        } catch (Exception $e) {
            error_log("UserPutOperations::handlePutRequest - Erreur: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la mise à jour de l'utilisateur: " . $e->getMessage(), 500);
        }
    }
}
?>
