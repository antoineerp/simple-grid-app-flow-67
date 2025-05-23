<?php
require_once dirname(__DIR__) . '/models/User.php';
require_once dirname(__DIR__) . '/utils/ResponseHandler.php';

class UserOperations {
    private $conn;
    private $model;
    
    public function __construct($conn) {
        $this->conn = $conn;
        $this->model = new User($conn);
    }
    
    public function handleGetRequest() {
        // Nettoyer tout buffer de sortie existant
        if (ob_get_level()) ob_clean();
        
        // Assurez-vous que les headers sont configurés correctement
        header('Content-Type: application/json; charset=UTF-8');
        
        // Journaliser l'appel pour le débogage
        error_log("UserOperations::handleGetRequest - Début");
        
        try {
            // Gérer la récupération d'un seul utilisateur ou de tous les utilisateurs
            if (isset($_GET['id'])) {
                // Récupérer un seul utilisateur par ID
                $this->model->id = $_GET['id'];
                $user = $this->model->findById($_GET['id']);
                
                if ($user) {
                    ResponseHandler::success($user);
                } else {
                    ResponseHandler::error("Utilisateur non trouvé", 404);
                }
            } else {
                // Récupérer tous les utilisateurs
                $users = $this->model->findAll();
                ResponseHandler::success($users);
            }
        } catch (Exception $e) {
            error_log("UserOperations::handleGetRequest - Erreur: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la récupération des utilisateurs: " . $e->getMessage(), 500);
        }
    }
    
    public function handlePostRequest() {
        // Nettoyer tout buffer de sortie existant
        if (ob_get_level()) ob_clean();
        
        // Assurez-vous que les headers sont configurés correctement
        header('Content-Type: application/json; charset=UTF-8');
        
        // Journaliser l'appel pour le débogage
        error_log("UserOperations::handlePostRequest - Début");
        
        try {
            // Récupérer les données POST
            $json_data = file_get_contents("php://input");
            error_log("UserOperations - Données POST brutes: " . $json_data);
            
            if (empty($json_data)) {
                ResponseHandler::error("Aucune donnée reçue", 400);
                return;
            }
            
            $data = json_decode($json_data);
            if (json_last_error() !== JSON_ERROR_NONE) {
                ResponseHandler::error("JSON invalide: " . json_last_error_msg(), 400);
                return;
            }
            
            // Valider que les données nécessaires sont présentes
            if (!isset($data->nom, $data->prenom, $data->email, $data->mot_de_passe, $data->identifiant_technique, $data->role)) {
                ResponseHandler::error("Données utilisateur incomplètes", 400);
                return;
            }
            
            // Vérifier si l'email existe déjà
            if ($this->model->findByEmail($data->email)) {
                ResponseHandler::error("Cet email existe déjà", 409);
                return;
            }
            
            // Vérifier si l'identifiant technique existe déjà
            if ($this->model->findByIdentifiantTechnique($data->identifiant_technique)) {
                ResponseHandler::error("Cet identifiant technique existe déjà", 409);
                return;
            }
            
            // Hash du mot de passe
            $password_hash = password_hash($data->mot_de_passe, PASSWORD_BCRYPT);
            
            // Préparer les données pour l'insertion
            $this->model->nom = $data->nom;
            $this->model->prenom = $data->prenom;
            $this->model->email = $data->email;
            $this->model->mot_de_passe = $password_hash;
            $this->model->identifiant_technique = $data->identifiant_technique;
            $this->model->role = $data->role;
            
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
            error_log("UserOperations::handlePostRequest - Erreur: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la création de l'utilisateur: " . $e->getMessage(), 500);
        }
    }
    
    public function handlePutRequest() {
        // Nettoyer tout buffer de sortie existant
        if (ob_get_level()) ob_clean();
        
        // Assurez-vous que les headers sont configurés correctement
        header('Content-Type: application/json; charset=UTF-8');
        
        // Journaliser l'appel pour le débogage
        error_log("UserOperations::handlePutRequest - Début");
        
        try {
            // Récupérer l'ID de l'utilisateur à mettre à jour
            if (!isset($_GET['id'])) {
                ResponseHandler::error("ID de l'utilisateur non spécifié", 400);
                return;
            }
            $userId = $_GET['id'];
            
            // Récupérer les données PUT
            $json_data = file_get_contents("php://input");
            error_log("UserOperations - Données PUT brutes: " . $json_data);
            
            if (empty($json_data)) {
                ResponseHandler::error("Aucune donnée reçue", 400);
                return;
            }
            
            $data = json_decode($json_data);
            if (json_last_error() !== JSON_ERROR_NONE) {
                ResponseHandler::error("JSON invalide: " . json_last_error_msg(), 400);
                return;
            }
            
            // Récupérer l'utilisateur existant
            $user = $this->model->findById($userId);
            if (!$user) {
                ResponseHandler::error("Utilisateur non trouvé", 404);
                return;
            }
            
            // Mettre à jour les propriétés de l'utilisateur si elles sont fournies
            if (isset($data->nom)) $this->model->nom = $data->nom;
            if (isset($data->prenom)) $this->model->prenom = $data->prenom;
            if (isset($data->email)) $this->model->email = $data->email;
            if (isset($data->identifiant_technique)) $this->model->identifiant_technique = $data->identifiant_technique;
            if (isset($data->role)) $this->model->role = $data->role;
            
            // Gérer la mise à jour du mot de passe si fourni
            if (isset($data->mot_de_passe)) {
                $password_hash = password_hash($data->mot_de_passe, PASSWORD_BCRYPT);
                $this->model->mot_de_passe = $password_hash;
            }
            
            // Mettre à jour l'utilisateur
            $this->model->id = $userId;
            if ($this->model->update()) {
                ResponseHandler::success([
                    "message" => "Utilisateur mis à jour avec succès",
                    "user" => [
                        "id" => $this->model->id,
                        "nom" => $this->model->nom,
                        "prenom" => $this->model->prenom,
                        "email" => $this->model->email,
                        "identifiant_technique" => $this->model->identifiant_technique,
                        "role" => $this->model->role
                    ]
                ]);
            } else {
                ResponseHandler::error("Impossible de mettre à jour l'utilisateur", 500);
            }
        } catch (Exception $e) {
            error_log("UserOperations::handlePutRequest - Erreur: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la mise à jour de l'utilisateur: " . $e->getMessage(), 500);
        }
    }
    
    /**
     * Crée les tables nécessaires pour un utilisateur spécifique
     */
    public function createUserTables($userId) {
        try {
            $result = ['success' => false, 'tables_created' => []];
            $tables_created = [];
            
            // Lire le script SQL à partir du fichier
            $sqlPath = dirname(__DIR__) . '/sql/create_user_tables.sql';
            
            if (!file_exists($sqlPath)) {
                throw new Exception("Fichier SQL introuvable: $sqlPath");
            }
            
            $sql = file_get_contents($sqlPath);
            
            // Remplacer USER_ID par l'ID réel de l'utilisateur
            $sql = str_replace('USER_ID', $userId, $sql);
            
            // Séparer les instructions SQL
            $statements = explode(';', $sql);
            
            foreach ($statements as $statement) {
                $statement = trim($statement);
                
                if (empty($statement)) continue;
                
                // Exécuter chaque instruction SQL
                if ($this->conn->exec($statement) !== false) {
                    // Extraire le nom de la table créée (expression régulière pour trouver "CREATE TABLE IF NOT EXISTS tablename_...")
                    if (preg_match('/CREATE TABLE IF NOT EXISTS (\w+)/', $statement, $matches)) {
                        $tables_created[] = $matches[1];
                    }
                }
            }
            
            $result['success'] = true;
            $result['tables_created'] = $tables_created;
            
            return $result;
        } catch (PDOException $e) {
            error_log("Erreur SQL lors de la création des tables pour l'utilisateur $userId: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        } catch (Exception $e) {
            error_log("Exception lors de la création des tables pour l'utilisateur $userId: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * S'assure que toutes les tables existent pour tous les utilisateurs
     */
    public function ensureAllUserTablesExist() {
        try {
            $results = [];
            $users = $this->model->findAll();
            
            foreach ($users as $user) {
                if (isset($user->identifiant_technique) && !empty($user->identifiant_technique)) {
                    $userId = $user->identifiant_technique;
                    $result = $this->createUserTables($userId);
                    
                    $results[] = [
                        'user_id' => $userId,
                        'success' => $result['success'],
                        'tables_created' => $result['tables_created'],
                        'error' => $result['error'] ?? null
                    ];
                }
            }
            
            return $results;
        } catch (Exception $e) {
            error_log("Exception lors de la vérification des tables de tous les utilisateurs: " . $e->getMessage());
            return [];
        }
    }

}
?>
