
<?php
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

require_once dirname(__DIR__) . '/models/User.php';
require_once dirname(__DIR__) . '/utils/ResponseHandler.php';
require_once dirname(__DIR__) . '/operations/users/GetOperations.php';
require_once dirname(__DIR__) . '/operations/users/PostOperations.php';
require_once dirname(__DIR__) . '/operations/users/PutOperations.php';

class UserOperations {
    protected $conn;
    protected $model;
    protected $getOperations;
    protected $postOperations;
    protected $putOperations;
    
    public function __construct($db) {
        $this->conn = $db;
        $this->model = new User($db);
        $this->getOperations = new UserGetOperations($db, $this->model);
        $this->postOperations = new UserPostOperations($db, $this->model);
        $this->putOperations = new UserPutOperations($db, $this->model);
    }
    
    // Méthodes pour traiter les différents types de requêtes HTTP
    public function handleGetRequest() {
        $this->getOperations->handleGetRequest();
    }
    
    public function handlePostRequest() {
        $this->postOperations->handlePostRequest();
    }
    
    public function handlePutRequest() {
        $this->putOperations->handlePutRequest();
    }
    
    /**
     * Vérifie et crée les tables pour un utilisateur spécifique
     * @param string $userId Identifiant technique de l'utilisateur
     * @return array Résultat de la création des tables
     */
    public function createUserTables($userId) {
        try {
            // Nettoyer l'identifiant utilisateur pour la sécurité
            $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            error_log("Création des tables pour l'utilisateur: {$safeUserId}");
            
            // Liste des tables essentielles à créer pour chaque utilisateur
            $tables = [
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
                "document_groupes" => "
                    CREATE TABLE IF NOT EXISTS `document_groupes_{$safeUserId}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(255) NOT NULL,
                        `description` TEXT NULL,
                        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ",
                "exigences" => "
                    CREATE TABLE IF NOT EXISTS `exigences_{$safeUserId}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(255) NOT NULL,
                        `responsabilites` TEXT NULL,
                        `exclusion` TINYINT(1) DEFAULT 0,
                        `atteinte` ENUM('NC', 'PC', 'C') NULL,
                        `groupId` VARCHAR(36) NULL,
                        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ",
                "collaborateurs" => "
                    CREATE TABLE IF NOT EXISTS `collaborateurs_{$safeUserId}` (
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
                "collaboration" => "
                    CREATE TABLE IF NOT EXISTS `collaboration_{$safeUserId}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `titre` VARCHAR(255) NOT NULL,
                        `description` TEXT NULL,
                        `statut` VARCHAR(50) NOT NULL DEFAULT 'en_cours',
                        `priorite` VARCHAR(50) NULL,
                        `assignee_id` VARCHAR(36) NULL,
                        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ",
                "collaboration_groups" => "
                    CREATE TABLE IF NOT EXISTS `collaboration_groups_{$safeUserId}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(255) NOT NULL,
                        `description` TEXT NULL,
                        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                "
            ];
            
            $tablesCreated = [];
            $errors = [];
            
            // Créer chaque table
            foreach ($tables as $tableName => $query) {
                try {
                    $stmt = $this->conn->prepare($query);
                    if ($stmt->execute()) {
                        error_log("Table {$tableName}_{$safeUserId} créée avec succès");
                        $tablesCreated[] = "{$tableName}_{$safeUserId}";
                    } else {
                        error_log("Échec de création de la table {$tableName}_{$safeUserId}");
                        $errors[] = [
                            'table' => "{$tableName}_{$safeUserId}",
                            'error' => "Échec d'exécution de la requête"
                        ];
                    }
                } catch (PDOException $e) {
                    error_log("Erreur lors de la création de la table {$tableName}_{$safeUserId}: " . $e->getMessage());
                    $errors[] = [
                        'table' => "{$tableName}_{$safeUserId}",
                        'error' => $e->getMessage()
                    ];
                }
            }
            
            return [
                'success' => count($tablesCreated) > 0,
                'tables_created' => $tablesCreated,
                'errors' => $errors,
                'userId' => $safeUserId
            ];
            
        } catch (Exception $e) {
            error_log("Exception lors de la création des tables utilisateur: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'userId' => $userId
            ];
        }
    }
    
    /**
     * Liste toutes les tables d'un utilisateur spécifique
     * @param string $userId Identifiant technique de l'utilisateur
     * @return array Liste des tables
     */
    public function listUserTables($userId) {
        try {
            // Nettoyer l'identifiant utilisateur pour la sécurité
            $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            
            // Requête pour lister toutes les tables qui correspondent au motif de l'utilisateur
            $query = "SHOW TABLES LIKE '%\_{$safeUserId}'";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            $tables = [];
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                $tables[] = $row[0];
            }
            
            return [
                'success' => true,
                'tables' => $tables,
                'count' => count($tables),
                'userId' => $safeUserId
            ];
            
        } catch (Exception $e) {
            error_log("Exception lors de la récupération des tables utilisateur: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'userId' => $userId
            ];
        }
    }
    
    /**
     * Vérifie que toutes les tables nécessaires existent pour tous les utilisateurs
     * @return array Résultats de la vérification
     */
    public function ensureAllUserTablesExist() {
        try {
            // Récupérer tous les utilisateurs
            $stmt = $this->model->read();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $results = [];
            
            foreach ($users as $user) {
                try {
                    $userId = $user['identifiant_technique'];
                    
                    // Listing actuel des tables
                    $currentTables = $this->listUserTables($userId);
                    
                    // Créer les tables manquantes
                    $creationResult = $this->createUserTables($userId);
                    
                    $results[] = [
                        'userId' => $userId,
                        'existing_tables' => $currentTables['tables'] ?? [],
                        'created_tables' => $creationResult['tables_created'] ?? [],
                        'success' => true
                    ];
                    
                } catch (Exception $e) {
                    $results[] = [
                        'userId' => $user['identifiant_technique'],
                        'success' => false,
                        'error' => $e->getMessage()
                    ];
                }
            }
            
            return $results;
            
        } catch (Exception $e) {
            error_log("Exception lors de la vérification des tables: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
