
<?php
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/utils/ResponseHandler.php';
require_once dirname(__DIR__) . '/models/User.php';
require_once dirname(__DIR__) . '/operations/users/PostOperations.php';
require_once dirname(__DIR__) . '/operations/users/GetOperations.php';
require_once dirname(__DIR__) . '/operations/users/PutOperations.php';

class UserOperations {
    protected $connection;
    protected $model;
    protected $postOperations;
    protected $getOperations;
    protected $putOperations;
    public $is_connected = false;
    
    public function __construct($db = null) {
        if (!$db) {
            try {
                $database = new Database();
                $db = $database->getConnection();
                $this->is_connected = $database->testConnection();
            } catch (Exception $e) {
                error_log("UserOperations: Erreur de connexion à la base: " . $e->getMessage());
                $this->is_connected = false;
            }
        } else {
            $this->is_connected = true;
        }
        
        $this->connection = $db;
        $this->model = new User($db);
        
        // Initialiser les classes pour les différentes opérations
        $this->postOperations = new UserPostOperations($db, $this->model);
        $this->getOperations = new UserGetOperations($db, $this->model);
        $this->putOperations = new UserPutOperations($db, $this->model);
    }
    
    public function handleGetRequest() {
        $this->getOperations->handleGetRequest();
    }
    
    public function handlePostRequest() {
        $this->postOperations->handlePostRequest();
    }
    
    public function handlePutRequest() {
        $this->putOperations->handlePutRequest();
    }
    
    public function createUserTables($userId) {
        if (!$this->connection || !$this->is_connected) {
            error_log("createUserTables: Pas de connexion à la base de données");
            return false;
        }
        
        try {
            // Nettoyer l'ID utilisateur pour éviter les injections SQL
            $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            
            // Liste des tables à créer pour chaque utilisateur
            $tables = [
                "bibliotheque" => "
                    CREATE TABLE IF NOT EXISTS `bibliotheque_{$safeUserId}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(255) NOT NULL,
                        `description` TEXT NULL,
                        `link` VARCHAR(255) NULL,
                        `groupId` VARCHAR(36) NULL,
                        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ",
                "exigences" => "
                    CREATE TABLE IF NOT EXISTS `exigences_{$safeUserId}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(255) NOT NULL,
                        `responsabilites` TEXT,
                        `exclusion` TINYINT(1) DEFAULT 0,
                        `atteinte` ENUM('NC', 'PC', 'C') NULL,
                        `groupId` VARCHAR(36) NULL,
                        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ",
                "membres" => "
                    CREATE TABLE IF NOT EXISTS `membres_{$safeUserId}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(100) NOT NULL,
                        `prenom` VARCHAR(100) NOT NULL,
                        `email` VARCHAR(255) NULL,
                        `telephone` VARCHAR(20) NULL,
                        `fonction` VARCHAR(100) NULL,
                        `organisation` VARCHAR(255) NULL,
                        `notes` TEXT NULL,
                        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ",
                "documents" => "
                    CREATE TABLE IF NOT EXISTS `documents_{$safeUserId}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(255) NOT NULL,
                        `fichier_path` VARCHAR(255) NULL,
                        `responsabilites` TEXT NULL,
                        `etat` VARCHAR(50) NULL,
                        `groupId` VARCHAR(36) NULL,
                        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ",
                "pilotage" => "
                    CREATE TABLE IF NOT EXISTS `pilotage_{$safeUserId}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `titre` VARCHAR(255) NOT NULL,
                        `description` TEXT NULL,
                        `statut` VARCHAR(50) NULL,
                        `priorite` VARCHAR(50) NULL,
                        `date_debut` DATE NULL,
                        `date_fin` DATE NULL,
                        `responsabilites` TEXT NULL,
                        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                "
            ];
            
            $success = true;
            $createdTables = [];
            
            // Créer chaque table
            foreach ($tables as $tableName => $query) {
                try {
                    $stmt = $this->connection->prepare($query);
                    if ($stmt->execute()) {
                        error_log("Table {$tableName}_{$safeUserId} créée avec succès");
                        $createdTables[] = "{$tableName}_{$safeUserId}";
                    } else {
                        error_log("Échec de création de la table {$tableName}_{$safeUserId}");
                        $success = false;
                    }
                } catch (PDOException $e) {
                    error_log("Erreur lors de la création de la table {$tableName}_{$safeUserId}: " . $e->getMessage());
                    $success = false;
                }
            }
            
            error_log("Création des tables pour l'utilisateur {$safeUserId} - Statut: " . ($success ? "Succès" : "Échec"));
            return [
                'success' => $success,
                'tables_created' => $createdTables
            ];
            
        } catch (Exception $e) {
            error_log("Exception lors de la création des tables utilisateur: " . $e->getMessage());
            return false;
        }
    }
    
    public function ensureAllUserTablesExist() {
        if (!$this->connection || !$this->is_connected) {
            error_log("ensureAllUserTablesExist: Pas de connexion à la base de données");
            return false;
        }
        
        try {
            // Récupérer tous les utilisateurs
            $query = "SELECT identifiant_technique FROM utilisateurs_p71x6d_richard";
            $stmt = $this->connection->prepare($query);
            $stmt->execute();
            
            $results = [];
            
            // Pour chaque utilisateur, créer les tables nécessaires
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $userId = $row['identifiant_technique'];
                $result = $this->createUserTables($userId);
                $results[$userId] = $result;
            }
            
            return $results;
            
        } catch (Exception $e) {
            error_log("Exception lors de la vérification des tables utilisateur: " . $e->getMessage());
            return false;
        }
    }
}

// Classes pour les opérations spécifiques
class BaseOperations {
    protected $connection;
    protected $model;
    
    public function __construct($db, $model) {
        $this->connection = $db;
        $this->model = $model;
    }
}

class UserGetOperations extends BaseOperations {
    public function handleGetRequest() {
        try {
            // Vérifier si une requête spécifique est demandée
            if (isset($_GET['id'])) {
                $this->getUserById($_GET['id']);
                return;
            }
            
            // Par défaut, récupérer tous les utilisateurs
            $users = $this->model->getAll();
            
            if (!empty($users)) {
                ResponseHandler::success([
                    'records' => $users,
                    'count' => count($users),
                    'message' => 'Utilisateurs récupérés avec succès'
                ]);
            } else {
                // Si aucun utilisateur trouvé, essayer de lire les données mockées
                $mockFile = dirname(__DIR__) . '/mock-users.json';
                if (file_exists($mockFile)) {
                    $mockData = json_decode(file_get_contents($mockFile), true);
                    ResponseHandler::success($mockData);
                } else {
                    ResponseHandler::success([
                        'records' => [],
                        'count' => 0,
                        'message' => 'Aucun utilisateur trouvé'
                    ]);
                }
            }
        } catch (Exception $e) {
            error_log("UserGetOperations - Exception: " . $e->getMessage());
            ResponseHandler::error('Erreur serveur: ' . $e->getMessage(), 500);
        }
    }
    
    private function getUserById($id) {
        try {
            $user = $this->model->getById($id);
            
            if ($user) {
                ResponseHandler::success([
                    'user' => $user,
                    'message' => 'Utilisateur récupéré avec succès'
                ]);
            } else {
                ResponseHandler::error("Aucun utilisateur trouvé avec l'ID: " . $id, 404);
            }
        } catch (Exception $e) {
            ResponseHandler::error('Erreur serveur: ' . $e->getMessage(), 500);
        }
    }
}

class UserPutOperations extends BaseOperations {
    public function handlePutRequest() {
        try {
            // Récupérer les données PUT
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!$data) {
                ResponseHandler::error('Aucune donnée reçue.', 400);
                return;
            }
            
            // Vérifier l'ID de l'utilisateur
            if (!isset($data['id'])) {
                ResponseHandler::error("L'ID de l'utilisateur est requis.", 400);
                return;
            }
            
            // Récupérer l'utilisateur existant
            $existingUser = $this->model->getById($data['id']);
            if (!$existingUser) {
                ResponseHandler::error("Utilisateur non trouvé avec l'ID: " . $data['id'], 404);
                return;
            }
            
            // Mettre à jour les propriétés de l'utilisateur
            $this->model->id = $data['id'];
            
            if (isset($data['nom'])) $this->model->nom = htmlspecialchars(strip_tags($data['nom']));
            if (isset($data['prenom'])) $this->model->prenom = htmlspecialchars(strip_tags($data['prenom']));
            if (isset($data['email'])) $this->model->email = htmlspecialchars(strip_tags($data['email']));
            if (isset($data['role'])) $this->model->role = htmlspecialchars(strip_tags($data['role']));
            
            // Mot de passe (optionnel)
            if (isset($data['mot_de_passe']) && !empty($data['mot_de_passe'])) {
                $this->model->mot_de_passe = $data['mot_de_passe'];
            }
            
            if ($this->model->update()) {
                ResponseHandler::success([
                    'message' => 'Utilisateur mis à jour avec succès.',
                    'user' => [
                        'id' => $this->model->id,
                        'nom' => $this->model->nom,
                        'prenom' => $this->model->prenom,
                        'email' => $this->model->email,
                        'role' => $this->model->role,
                        'identifiant_technique' => $this->model->identifiant_technique
                    ]
                ]);
            } else {
                ResponseHandler::error("Échec de la mise à jour de l'utilisateur.", 400);
            }
        } catch (Exception $e) {
            ResponseHandler::error('Erreur serveur: ' . $e->getMessage(), 500);
        }
    }
}
