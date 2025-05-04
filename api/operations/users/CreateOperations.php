
<?php
require_once dirname(dirname(__FILE__)) . '/BaseOperations.php';
require_once dirname(dirname(dirname(__FILE__))) . '/services/TableManager.php';

class UserCreateOperations extends BaseOperations {
    public function handlePostRequest() {
        // Nettoyer tout buffer de sortie existant
        if (ob_get_level()) ob_clean();
        
        // Assurez-vous que les headers sont configurés correctement
        header('Content-Type: application/json; charset=UTF-8');
        
        // Journaliser l'appel pour le débogage
        error_log("UserCreateOperations::handlePostRequest - Début");
        
        try {
            // Récupérer les données POST
            $json_data = file_get_contents("php://input");
            error_log("UserCreateOperations - Données POST brutes: " . $json_data);
            
            if (empty($json_data)) {
                ResponseHandler::error("Aucune donnée reçue", 400);
                return;
            }
            
            $data = json_decode($json_data);
            if (json_last_error() !== JSON_ERROR_NONE) {
                ResponseHandler::error("JSON invalide: " . json_last_error_msg(), 400);
                return;
            }

            // Vérifier si l'email existe déjà
            if ($this->model->emailExists($data->email)) {
                ResponseHandler::error("Cet email existe déjà", 400);
                return;
            }
            
            // Vérifier si l'identifiant technique existe déjà
            if (isset($data->identifiant_technique) && $this->model->identifiantExists($data->identifiant_technique)) {
                // Générer un nouveau identifiant si celui fourni existe déjà
                $timestamp = time();
                $randomStr = substr(md5(uniqid(mt_rand(), true)), 0, 8);
                $data->identifiant_technique = "p71x6d_" . preg_replace('/[^a-z0-9]/', '', strtolower($data->prenom)) 
                    . "_" . preg_replace('/[^a-z0-9]/', '', strtolower($data->nom)) 
                    . "_{$randomStr}_{$timestamp}";
                error_log("Nouvel identifiant technique généré: {$data->identifiant_technique}");
            }
            
            // Vérifier les restrictions sur le rôle
            if ($data->role === 'gestionnaire') {
                // Vérifier si un gestionnaire existe déjà
                $manager = $this->model->getManager();
                if ($manager) {
                    ResponseHandler::error("Un seul compte gestionnaire est autorisé. {$manager['email']} est déjà gestionnaire.", 400);
                    return;
                }
            }
            
            // Hachage du mot de passe
            $data->mot_de_passe = password_hash($data->mot_de_passe, PASSWORD_DEFAULT);
            
            // Définir les champs du modèle
            $this->model->id = isset($data->id) ? $data->id : uniqid();
            $this->model->nom = $data->nom;
            $this->model->prenom = $data->prenom;
            $this->model->email = $data->email;
            $this->model->mot_de_passe = $data->mot_de_passe;
            $this->model->identifiant_technique = isset($data->identifiant_technique) ? $data->identifiant_technique : "";
            $this->model->role = isset($data->role) ? $data->role : "utilisateur";

            // Créer l'utilisateur
            if ($this->model->create()) {
                // Initialiser les tables pour le nouvel utilisateur
                $tableStatus = UserOperations::initializeUserTables($this->conn, $this->model->identifiant_technique);
                
                ResponseHandler::success([
                    "message" => "Utilisateur créé avec succès" . ($tableStatus ? " et tables initialisées" : ""),
                    "id" => $this->model->id,
                    "identifiant_technique" => $this->model->identifiant_technique,
                    "tables_initialized" => $tableStatus
                ], 201);
            } else {
                ResponseHandler::error("Impossible de créer l'utilisateur", 500);
            }
        } catch (Exception $e) {
            error_log("UserCreateOperations::handlePostRequest - Erreur: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la création de l'utilisateur: " . $e->getMessage(), 500);
        }
    }
}
?>
