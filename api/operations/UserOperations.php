
<?php
require_once dirname(__DIR__) . '/models/User.php';
require_once dirname(__DIR__) . '/utils/ResponseHandler.php';
require_once dirname(__FILE__) . '/BaseOperations.php';

class UserOperations extends BaseOperations {
    
    public function handleGetRequest() {
        error_log("UserOperations::handleGetRequest - Début");
        
        try {
            if (isset($_GET['email'])) {
                error_log("UserOperations - Recherche par email: " . $_GET['email']);
                $this->checkEmail($_GET['email']);
                return;
            }
            error_log("UserOperations - Récupération de tous les utilisateurs");
            $this->getAllUsers();
        } catch (Exception $e) {
            error_log("UserOperations::handleGetRequest - Erreur: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la récupération des utilisateurs: " . $e->getMessage(), 500);
        }
    }
    
    private function checkEmail($email) {
        try {
            error_log("UserOperations::checkEmail - Vérification de l'email: $email");
            $stmt = $this->model->findByEmailQuery($email);
            $num = $stmt ? $stmt->rowCount() : 0;
            error_log("UserOperations::checkEmail - Nombre d'utilisateurs trouvés: $num");
            
            $users_arr = ["records" => []];
            
            if ($num > 0) {
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    // Masquer le mot de passe dans la réponse
                    $row['mot_de_passe'] = '******';
                    array_push($users_arr["records"], $row);
                }
            }
            
            error_log("UserOperations::checkEmail - Réponse: " . json_encode($users_arr));
            ResponseHandler::success($users_arr);
        } catch (Exception $e) {
            error_log("UserOperations::checkEmail - Erreur: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la vérification de l'email: " . $e->getMessage(), 500);
        }
    }
    
    private function getAllUsers() {
        error_log("UserOperations::getAllUsers - Début");
        
        try {
            // Force la création de la table si elle n'existe pas
            $this->model->createTableIfNotExists();
            
            // Récupère tous les utilisateurs
            $stmt = $this->model->read();
            $num = $stmt->rowCount();
            
            error_log("UserOperations::getAllUsers - Nombre d'utilisateurs trouvés: $num");
            
            // Initialise le tableau de réponse
            $users_arr = ["records" => []];
            
            if ($num > 0) {
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    // Masquer le mot de passe dans la réponse
                    $row['mot_de_passe'] = '******';
                    array_push($users_arr["records"], $row);
                }
                error_log("UserOperations::getAllUsers - Retourne " . count($users_arr["records"]) . " utilisateurs");
                ResponseHandler::success($users_arr);
            } else {
                error_log("UserOperations::getAllUsers - Aucun utilisateur trouvé");
                // Si aucun utilisateur n'est trouvé, retourner un tableau vide mais pas une erreur 404
                // pour éviter les problèmes côté client
                ResponseHandler::success($users_arr);
            }
        } catch (Exception $e) {
            error_log("UserOperations::getAllUsers - Erreur: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la récupération des utilisateurs: " . $e->getMessage(), 500);
        }
    }
    
    public function handlePostRequest() {
        error_log("UserOperations::handlePostRequest - Début");
        
        try {
            // Récupérer les données POST
            $data = json_decode(file_get_contents("php://input"));
            error_log("UserOperations::handlePostRequest - Données reçues: " . json_encode($data));
            
            // Vérifier que les données nécessaires sont présentes
            if (!isset($data->nom) || !isset($data->prenom) || !isset($data->email) || !isset($data->role)) {
                throw new Exception("Données incomplètes pour la création de l'utilisateur");
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
                throw new Exception("Impossible de créer l'utilisateur");
            }
        } catch (Exception $e) {
            error_log("UserOperations::handlePostRequest - Erreur: " . $e->getMessage());
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
    
    public function handlePutRequest() {
        error_log("UserOperations::handlePutRequest - Début");
        
        try {
            // Récupérer les données PUT
            $data = json_decode(file_get_contents("php://input"));
            error_log("UserOperations::handlePutRequest - Données reçues: " . json_encode($data));
            
            // Vérifier que l'ID est présent
            if (!isset($data->id)) {
                throw new Exception("ID de l'utilisateur non spécifié");
            }
            
            // Récupérer l'utilisateur existant
            $user = $this->model->findById($data->id);
            if (!$user) {
                throw new Exception("Utilisateur non trouvé");
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
                throw new Exception("Impossible de mettre à jour l'utilisateur");
            }
        } catch (Exception $e) {
            error_log("UserOperations::handlePutRequest - Erreur: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la mise à jour de l'utilisateur: " . $e->getMessage(), 500);
        }
    }
    
    public function handleDeleteRequest() {
        error_log("UserOperations::handleDeleteRequest - Début");
        
        try {
            // Récupérer les données DELETE
            $data = json_decode(file_get_contents("php://input"));
            error_log("UserOperations::handleDeleteRequest - Données reçues: " . json_encode($data));
            
            // Vérifier que l'ID est présent
            if (!isset($data->id)) {
                throw new Exception("ID de l'utilisateur non spécifié");
            }
            
            // Récupérer l'utilisateur existant
            $user = $this->model->findById($data->id);
            if (!$user) {
                throw new Exception("Utilisateur non trouvé");
            }
            
            // Supprimer l'utilisateur
            $this->model->id = $data->id;
            if ($this->model->delete()) {
                ResponseHandler::success([
                    "message" => "Utilisateur supprimé avec succès",
                    "id" => $data->id
                ]);
            } else {
                throw new Exception("Impossible de supprimer l'utilisateur");
            }
        } catch (Exception $e) {
            error_log("UserOperations::handleDeleteRequest - Erreur: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la suppression de l'utilisateur: " . $e->getMessage(), 500);
        }
    }
}
?>
