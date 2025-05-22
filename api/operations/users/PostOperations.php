
<?php
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

require_once dirname(dirname(__DIR__)) . '/utils/ResponseHandler.php';
require_once dirname(dirname(__DIR__)) . '/models/User.php';
require_once dirname(__DIR__) . '/BaseOperations.php';

class UserPostOperations extends BaseOperations {
    
    public function handlePostRequest() {
        try {
            // Récupérer les données POST
            $data = json_decode(file_get_contents("php://input"), true);
            
            error_log("UserPostOperations - Données reçues: " . json_encode($data));
            
            if (!$data) {
                // Si aucune donnée n'est reçue, vérifier si des données sont envoyées en format form
                if (empty($_POST)) {
                    ResponseHandler::error('Aucune donnée reçue.', 400);
                    return;
                }
                $data = $_POST;
            }
            
            // Vérifier les champs requis
            if (!isset($data['nom']) || !isset($data['prenom']) || !isset($data['email']) || !isset($data['role'])) {
                ResponseHandler::error('Données incomplètes. Les champs nom, prenom, email et role sont requis.', 400);
                return;
            }
            
            // S'assurer que le modèle User est défini
            if (!$this->model || !($this->model instanceof User)) {
                ResponseHandler::error("Erreur interne: Le modèle User n'est pas défini correctement.", 500);
                return;
            }
            
            // S'assurer que la table est définie à utilisateurs_p71x6d_richard
            $this->model->table = 'utilisateurs_p71x6d_richard';
            error_log("UserPostOperations: Utilisation forcée de la table {$this->model->table}");
            
            // HARDCODER le nom de table directement dans la requête SQL pour déboguer
            error_log("UserPostOperations: Table avant l'assignation: " . $this->model->table);
            
            // Assigner les valeurs au modèle
            $this->model->nom = htmlspecialchars(strip_tags($data['nom']));
            $this->model->prenom = htmlspecialchars(strip_tags($data['prenom']));
            $this->model->email = htmlspecialchars(strip_tags($data['email']));
            $this->model->role = htmlspecialchars(strip_tags($data['role']));
            
            // Mot de passe (optionnel)
            if (isset($data['mot_de_passe']) && !empty($data['mot_de_passe'])) {
                $this->model->mot_de_passe = $data['mot_de_passe'];
            }
            
            // Identifiant technique (optionnel)
            if (isset($data['identifiant_technique']) && !empty($data['identifiant_technique'])) {
                $this->model->identifiant_technique = $data['identifiant_technique'];
            }
            
            // Création forcée dans p71x6d_richard en double-vérification
            error_log("UserPostOperations: Création de l'utilisateur {$this->model->prenom} {$this->model->nom} dans la table {$this->model->table}");
            
            // Créer l'utilisateur
            if ($this->model->create()) {
                error_log("UserPostOperations: Utilisateur créé avec succès dans la table {$this->model->table}, ID: " . $this->model->id);
                
                ResponseHandler::success([
                    'message' => 'Utilisateur créé avec succès.',
                    'user' => [
                        'id' => $this->model->id,
                        'identifiant_technique' => $this->model->identifiant_technique,
                        'nom' => $this->model->nom,
                        'prenom' => $this->model->prenom,
                        'email' => $this->model->email,
                        'role' => $this->model->role,
                        'date_creation' => $this->model->date_creation
                    ]
                ], 201);
            } else {
                $errorMsg = "Échec de la création de l'utilisateur.";
                
                // Vérifier si l'erreur est due à un email existant
                if ($this->model->emailExists()) {
                    $errorMsg .= " L'email est déjà utilisé.";
                }
                
                error_log("UserPostOperations: " . $errorMsg);
                ResponseHandler::error($errorMsg, 400);
            }
            
        } catch (Exception $e) {
            error_log("UserPostOperations - Exception: " . $e->getMessage());
            ResponseHandler::error('Erreur serveur: ' . $e->getMessage(), 500);
        }
    }
}
?>
