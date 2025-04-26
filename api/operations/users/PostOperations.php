
<?php
require_once dirname(__DIR__) . '/BaseOperations.php';

class UserPostOperations extends BaseOperations {
    public function handlePostRequest() {
        $data = json_decode(file_get_contents("php://input"));
        error_log("UserPostOperations::handlePostRequest - Données reçues POST: " . json_encode($data));

        if (!$this->validateUserData($data)) {
            error_log("UserPostOperations - Validation des données utilisateur échouée");
            ResponseHandler::error("Données incomplètes ou invalides", 400);
            return;
        }

        try {
            if ($data->role === 'gestionnaire' && $this->model->countUsersByRole('gestionnaire') > 0) {
                error_log("UserPostOperations - Tentative de création d'un second compte gestionnaire rejetée");
                ResponseHandler::error("Un seul compte gestionnaire peut être créé", 409);
                return;
            }

            if ($this->model->emailExists($data->email)) {
                error_log("UserPostOperations - Email déjà utilisé: " . $data->email);
                ResponseHandler::error("Email déjà utilisé", 409);
                return;
            }

            // Assigner les valeurs à l'objet utilisateur
            $this->model->nom = $data->nom;
            $this->model->prenom = $data->prenom;
            $this->model->email = $data->email;
            $this->model->identifiant_technique = $data->identifiant_technique;
            $this->model->mot_de_passe = $data->mot_de_passe;
            $this->model->role = $data->role;

            error_log("UserPostOperations - Tentative de création de l'utilisateur: {$data->prenom} {$data->nom}");
            
            if (!$this->model->create()) {
                error_log("UserPostOperations - Échec de création de l'utilisateur sans exception");
                ResponseHandler::error("Échec de création de l'utilisateur", 500);
                return;
            }

            $lastId = $this->db->lastInsertId();
            error_log("UserPostOperations - Utilisateur créé avec ID: {$lastId}");
            
            if ($data->role === 'utilisateur') {
                $this->model->initializeUserDataFromManager($data->identifiant_technique);
            }

            ResponseHandler::success([
                'id' => $lastId,
                'identifiant_technique' => $data->identifiant_technique,
                'nom' => $data->nom,
                'prenom' => $data->prenom,
                'email' => $data->email,
                'role' => $data->role
            ], "Utilisateur créé avec succès", 201);

        } catch (Exception $e) {
            error_log("UserPostOperations - Erreur création utilisateur: " . $e->getMessage());
            ResponseHandler::error($e->getMessage(), 500);
        }
    }

    private function validateUserData($data) {
        return $this->validateData($data, [
            'nom',
            'prenom',
            'email',
            'identifiant_technique',
            'mot_de_passe',
            'role'
        ]);
    }
}
?>
