
<?php
require_once dirname(dirname(__FILE__)) . '/BaseOperations.php';

class UserPostOperations extends BaseOperations {
    public function handlePostRequest() {
        // Nettoyer tout buffer de sortie existant
        if (ob_get_level()) ob_clean();
        
        // Assurez-vous que les headers sont configurés correctement
        header('Content-Type: application/json; charset=UTF-8');
        
        // Journaliser l'appel pour le débogage
        error_log("UserPostOperations::handlePostRequest - Début");
        
        try {
            // Récupérer les données POST en JSON
            $json_data = file_get_contents("php://input");
            error_log("UserPostOperations - Données POST brutes: " . $json_data);
            
            if (empty($json_data)) {
                ResponseHandler::error("Aucune donnée reçue", 400);
                return;
            }
            
            $data = json_decode($json_data);
            if (json_last_error() !== JSON_ERROR_NONE) {
                ResponseHandler::error("JSON invalide: " . json_last_error_msg(), 400);
                return;
            }
            
            // Vérifier que les données nécessaires sont présentes
            if (!isset($data->nom) || !isset($data->prenom) || !isset($data->email) || !isset($data->role)) {
                ResponseHandler::error("Données incomplètes pour la création de l'utilisateur", 400);
                return;
            }
            
            // Préparer les données pour la création d'un nouvel utilisateur
            $this->model->nom = $data->nom;
            $this->model->prenom = $data->prenom;
            $this->model->email = $data->email;
            $this->model->role = $data->role;
            
            // Définir l'identifiant technique s'il est fourni, sinon en créer un
            $this->model->identifiant_technique = isset($data->identifiant_technique) ? 
                $data->identifiant_technique : 
                $this->generateIdentifiantTechnique($data->nom, $data->prenom);
                
            // Définir le mot de passe s'il est fourni
            if (isset($data->mot_de_passe) && !empty($data->mot_de_passe)) {
                $this->model->mot_de_passe = $data->mot_de_passe;
            }
            
            // Créer l'utilisateur
            if ($this->model->create()) {
                ResponseHandler::success([
                    "message" => "Utilisateur créé avec succès",
                    "user" => [
                        "id" => $this->model->id,
                        "nom" => $this->model->nom,
                        "prenom" => $this->model->prenom,
                        "email" => $this->model->email,
                        "identifiant_technique" => $this->model->identifiant_technique,
                        "role" => $this->model->role
                    ]
                ], 201);
            } else {
                ResponseHandler::error("Impossible de créer l'utilisateur", 500);
            }
        } catch (Exception $e) {
            error_log("UserPostOperations::handlePostRequest - Erreur: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la création de l'utilisateur: " . $e->getMessage(), 500);
        }
    }
    
    private function generateIdentifiantTechnique($nom, $prenom) {
        // Supprimer les espaces et les caractères spéciaux
        $nom = preg_replace('/[^a-z0-9]/i', '', $nom);
        $prenom = preg_replace('/[^a-z0-9]/i', '', $prenom);
        
        // Convertir en minuscules
        $nom = strtolower($nom);
        $prenom = strtolower($prenom);
        
        // Générer un identifiant au format prenom_nom avec un suffixe aléatoire
        $base = substr($prenom, 0, 3) . "_" . $nom;
        $suffix = "_" . substr(md5(uniqid()), 0, 6);
        
        return "user_" . $base . $suffix;
    }
}
?>
