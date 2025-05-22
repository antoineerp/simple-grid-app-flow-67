
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
            
            // TOUJOURS utiliser la table utilisateurs_p71x6d_richard
            $this->model->table = 'utilisateurs_p71x6d_richard';
            error_log("UserPostOperations: Utilisation FORCÉE de la table {$this->model->table}");
            
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
            
            // Vérifier si cette email existe déjà UNIQUEMENT dans la table p71x6d_richard
            $stmt = $this->model->conn->prepare("SELECT COUNT(*) as count FROM utilisateurs_p71x6d_richard WHERE email = :email");
            $stmt->bindParam(":email", $this->model->email);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result['count'] > 0) {
                ResponseHandler::error("L'email est déjà utilisé dans cette instance.", 400);
                return;
            }
            
            // Création directe dans la table p71x6d_richard
            $query = "INSERT INTO utilisateurs_p71x6d_richard 
                      (identifiant_technique, nom, prenom, email, mot_de_passe, role, date_creation) 
                      VALUES 
                      (:identifiant_technique, :nom, :prenom, :email, :mot_de_passe, :role, NOW())";
            
            $stmt = $this->model->conn->prepare($query);
            
            // Générer un mot de passe haché si nécessaire
            $passwordToSave = isset($this->model->mot_de_passe) ? 
                              password_hash($this->model->mot_de_passe, PASSWORD_DEFAULT) : 
                              null;
                              
            // Générer un identifiant technique s'il n'existe pas
            $idTechnique = $this->model->identifiant_technique ?? uniqid("user_");
            
            // Bind des paramètres
            $stmt->bindParam(":identifiant_technique", $idTechnique);
            $stmt->bindParam(":nom", $this->model->nom);
            $stmt->bindParam(":prenom", $this->model->prenom);
            $stmt->bindParam(":email", $this->model->email);
            $stmt->bindParam(":mot_de_passe", $passwordToSave);
            $stmt->bindParam(":role", $this->model->role);
            
            if ($stmt->execute()) {
                $this->model->id = $this->model->conn->lastInsertId();
                $this->model->identifiant_technique = $idTechnique;
                $this->model->date_creation = date('Y-m-d H:i:s');
                
                error_log("UserPostOperations: Utilisateur créé avec succès dans p71x6d_richard, ID: " . $this->model->id);
                
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
                error_log("UserPostOperations: Échec de la création de l'utilisateur dans p71x6d_richard");
                ResponseHandler::error("Échec de la création de l'utilisateur.", 400);
            }
            
        } catch (Exception $e) {
            error_log("UserPostOperations - Exception: " . $e->getMessage());
            ResponseHandler::error('Erreur serveur: ' . $e->getMessage(), 500);
        }
    }
}
?>
