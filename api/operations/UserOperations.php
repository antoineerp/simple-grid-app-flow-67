
<?php
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

require_once dirname(__DIR__) . '/utils/ResponseHandler.php';
require_once dirname(__DIR__) . '/operations/users/GetOperations.php';
require_once dirname(__DIR__) . '/operations/users/PostOperations.php';
require_once dirname(__DIR__) . '/operations/users/PutOperations.php';
require_once dirname(__DIR__) . '/operations/users/DeleteOperations.php';
require_once dirname(__DIR__) . '/models/User.php';

class UserOperations {
    protected $conn;
    protected $model;
    
    public function __construct($db) {
        $this->conn = $db;
        $this->model = new User($db);
        
        // Force l'utilisation de la table utilisateurs_p71x6d_richard
        $this->model->table = 'utilisateurs_p71x6d_richard';
        error_log("UserOperations: Utilisation forcée de la table {$this->model->table}");
        
        // Vérifier que la table principale existe
        $this->ensureUserTableExists();
    }
    
    public function handleGetRequest() {
        $getOps = new UserGetOperations();
        $getOps->model = $this->model;
        $getOps->conn = $this->conn;
        $getOps->handleGetRequest();
    }
    
    public function handlePostRequest() {
        $postOps = new UserPostOperations();
        $postOps->model = $this->model;
        $postOps->conn = $this->conn;
        $postOps->handlePostRequest();
        
        // Après création d'un utilisateur, s'assurer que toutes ses tables sont créées
        if (isset($_POST['action']) && $_POST['action'] === 'create') {
            $userId = $postOps->getLastInsertedUserId();
            if ($userId) {
                $this->createUserTables($userId);
            }
        }
    }
    
    public function handlePutRequest() {
        $putOps = new UserPutOperations();
        $putOps->model = $this->model;
        $putOps->conn = $this->conn;
        $putOps->handlePutRequest();
    }
    
    public function handleDeleteRequest() {
        $deleteOps = new UserDeleteOperations();
        $deleteOps->model = $this->model;
        $deleteOps->conn = $this->conn;
        $deleteOps->handleDeleteRequest();
    }
    
    /**
     * S'assure que la table des utilisateurs existe
     */
    private function ensureUserTableExists() {
        try {
            $query = "SHOW TABLES LIKE '{$this->model->table}'";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            if ($stmt->rowCount() === 0) {
                // La table n'existe pas, la créer
                $createTableQuery = "CREATE TABLE IF NOT EXISTS `{$this->model->table}` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `nom` VARCHAR(100) NOT NULL,
                    `prenom` VARCHAR(100) NOT NULL,
                    `email` VARCHAR(100) NOT NULL UNIQUE,
                    `mot_de_passe` VARCHAR(255) NOT NULL,
                    `identifiant_technique` VARCHAR(100) NOT NULL UNIQUE,
                    `role` VARCHAR(20) NOT NULL DEFAULT 'utilisateur',
                    `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                
                $this->conn->exec($createTableQuery);
                error_log("Table utilisateurs créée avec succès: {$this->model->table}");
                
                // Ajouter un utilisateur administrateur par défaut
                $this->createDefaultAdmin();
            }
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification/création de la table utilisateurs: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Crée un utilisateur administrateur par défaut
     */
    private function createDefaultAdmin() {
        try {
            $query = "INSERT INTO `{$this->model->table}` 
                (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
                VALUES ('Admin', 'Système', 'admin@system.local', :password, 'p71x6d_richard', 'admin')";
            
            $stmt = $this->conn->prepare($query);
            $password = password_hash('admin123', PASSWORD_BCRYPT);
            $stmt->bindParam(':password', $password);
            $stmt->execute();
            
            error_log("Utilisateur administrateur par défaut créé");
            
            // Créer les tables pour l'admin
            $this->createUserTables('p71x6d_richard');
        } catch (PDOException $e) {
            error_log("Erreur lors de la création de l'utilisateur admin par défaut: " . $e->getMessage());
        }
    }
    
    /**
     * Crée toutes les tables nécessaires pour un utilisateur
     */
    public function createUserTables($userId) {
        try {
            // Liste des tables à créer avec leur structure
            $tables = [
                "bibliotheque" => [
                    "id" => "VARCHAR(36) PRIMARY KEY",
                    "nom" => "VARCHAR(255) NOT NULL",
                    "description" => "TEXT NULL",
                    "link" => "VARCHAR(255) NULL",
                    "groupId" => "VARCHAR(36) NULL",
                    "date_creation" => "DATETIME DEFAULT CURRENT_TIMESTAMP",
                    "date_modification" => "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
                ],
                "exigences" => [
                    "id" => "VARCHAR(36) PRIMARY KEY",
                    "nom" => "VARCHAR(255) NOT NULL",
                    "responsabilites" => "TEXT NULL",
                    "exclusion" => "TINYINT(1) DEFAULT 0",
                    "atteinte" => "ENUM('NC', 'PC', 'C') NULL",
                    "groupId" => "VARCHAR(36) NULL",
                    "date_creation" => "DATETIME DEFAULT CURRENT_TIMESTAMP",
                    "date_modification" => "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
                ],
                "membres" => [
                    "id" => "VARCHAR(36) PRIMARY KEY",
                    "nom" => "VARCHAR(100) NOT NULL",
                    "prenom" => "VARCHAR(100) NOT NULL",
                    "email" => "VARCHAR(255) NULL",
                    "telephone" => "VARCHAR(20) NULL",
                    "fonction" => "VARCHAR(100) NULL",
                    "organisation" => "VARCHAR(255) NULL",
                    "notes" => "TEXT NULL",
                    "date_creation" => "DATETIME DEFAULT CURRENT_TIMESTAMP",
                    "date_modification" => "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
                ],
                "documents" => [
                    "id" => "VARCHAR(36) PRIMARY KEY",
                    "nom" => "VARCHAR(255) NOT NULL",
                    "fichier_path" => "VARCHAR(255) NULL",
                    "responsabilites" => "TEXT NULL",
                    "etat" => "VARCHAR(50) NULL",
                    "groupId" => "VARCHAR(36) NULL",
                    "date_creation" => "DATETIME DEFAULT CURRENT_TIMESTAMP",
                    "date_modification" => "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
                ],
                "pilotage" => [
                    "id" => "VARCHAR(36) PRIMARY KEY",
                    "titre" => "VARCHAR(255) NOT NULL",
                    "description" => "TEXT NULL",
                    "statut" => "VARCHAR(50) NULL",
                    "priorite" => "VARCHAR(50) NULL",
                    "date_debut" => "DATE NULL",
                    "date_fin" => "DATE NULL",
                    "responsabilites" => "TEXT NULL",
                    "date_creation" => "DATETIME DEFAULT CURRENT_TIMESTAMP",
                    "date_modification" => "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
                ]
            ];
            
            // Nettoyer l'ID utilisateur pour éviter les injections
            $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            
            foreach ($tables as $baseTableName => $columns) {
                $tableName = "{$baseTableName}_{$safeUserId}";
                
                // Vérifier si la table existe
                $query = "SHOW TABLES LIKE '{$tableName}'";
                $stmt = $this->conn->prepare($query);
                $stmt->execute();
                
                if ($stmt->rowCount() === 0) {
                    // La table n'existe pas, la créer
                    $columnDefinitions = [];
                    foreach ($columns as $columnName => $columnDefinition) {
                        $columnDefinitions[] = "`{$columnName}` {$columnDefinition}";
                    }
                    
                    $createTableQuery = "CREATE TABLE IF NOT EXISTS `{$tableName}` (\n    " . 
                                       implode(",\n    ", $columnDefinitions) . 
                                       "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                    
                    $this->conn->exec($createTableQuery);
                    error_log("Table {$tableName} créée avec succès pour l'utilisateur {$userId}");
                } else {
                    // La table existe, vérifier/mettre à jour sa structure
                    foreach ($columns as $columnName => $columnDefinition) {
                        $checkColumnQuery = "SHOW COLUMNS FROM `{$tableName}` LIKE '{$columnName}'";
                        $columnStmt = $this->conn->prepare($checkColumnQuery);
                        $columnStmt->execute();
                        
                        if ($columnStmt->rowCount() === 0) {
                            // La colonne n'existe pas, l'ajouter
                            $addColumnQuery = "ALTER TABLE `{$tableName}` ADD COLUMN `{$columnName}` {$columnDefinition}";
                            $this->conn->exec($addColumnQuery);
                            error_log("Colonne {$columnName} ajoutée à la table {$tableName}");
                        }
                    }
                }
            }
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors de la création des tables pour l'utilisateur {$userId}: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Vérifie et crée les tables pour tous les utilisateurs existants
     */
    public function ensureAllUserTablesExist() {
        try {
            $query = "SELECT identifiant_technique FROM `{$this->model->table}`";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            $userIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            foreach ($userIds as $userId) {
                $this->createUserTables($userId);
            }
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification des tables pour tous les utilisateurs: " . $e->getMessage());
            return false;
        }
    }
}

class BaseOperations {
    public $model;
    public $conn;
    protected $lastInsertedId = null;
    
    public function getLastInsertedUserId() {
        return $this->lastInsertedId;
    }
}
