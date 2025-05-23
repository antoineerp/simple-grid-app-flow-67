<?php
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

require_once dirname(__DIR__) . '/utils/ResponseHandler.php';
require_once dirname(__DIR__) . '/models/User.php';
require_once dirname(__DIR__) . '/services/TableManager.php';

class UserOperations {
    private $connection;
    private $userModel;
    
    public function __construct($db) {
        $this->connection = $db;
        $this->userModel = new User($db);
    }
    
    /**
     * Gère les requêtes GET pour les utilisateurs
     */
    public function handleGetRequest() {
        try {
            // Si un ID est spécifié, récupérer un seul utilisateur
            if (isset($_GET['id'])) {
                $user = $this->userModel->getById($_GET['id']);
                
                if ($user) {
                    // Supprimer le mot de passe de la réponse
                    if (isset($user['mot_de_passe'])) {
                        unset($user['mot_de_passe']);
                    }
                    
                    ResponseHandler::success([
                        'message' => 'Utilisateur récupéré avec succès',
                        'user' => $user
                    ]);
                } else {
                    ResponseHandler::error('Utilisateur non trouvé', 404);
                }
                return;
            }
            
            // Sinon, récupérer tous les utilisateurs
            $users = $this->userModel->getAll();
            
            // Supprimer les mots de passe des réponses
            foreach ($users as &$user) {
                if (isset($user['mot_de_passe'])) {
                    unset($user['mot_de_passe']);
                }
            }
            
            ResponseHandler::success([
                'message' => 'Liste des utilisateurs récupérée avec succès',
                'records' => $users,
                'count' => count($users)
            ]);
        } catch (Exception $e) {
            error_log("UserOperations::handleGetRequest - Exception: " . $e->getMessage());
            ResponseHandler::error('Erreur serveur: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Gère les requêtes POST pour les utilisateurs (création)
     */
    public function handlePostRequest() {
        try {
            // Récupérer les données POST
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!$data) {
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
            
            // Assigner les valeurs au modèle
            $this->userModel->nom = htmlspecialchars(strip_tags($data['nom']));
            $this->userModel->prenom = htmlspecialchars(strip_tags($data['prenom']));
            $this->userModel->email = htmlspecialchars(strip_tags($data['email']));
            $this->userModel->role = htmlspecialchars(strip_tags($data['role']));
            
            // Mot de passe (optionnel)
            if (isset($data['mot_de_passe']) && !empty($data['mot_de_passe'])) {
                $this->userModel->mot_de_passe = $data['mot_de_passe'];
            } else {
                // Générer un mot de passe aléatoire si non fourni
                $this->userModel->mot_de_passe = bin2hex(openssl_random_pseudo_bytes(4));
            }
            
            // Utiliser l'email comme identifiant technique
            $this->userModel->identifiant_technique = $this->userModel->email;
            
            // Vérifier si cette email existe déjà
            if ($this->userModel->exists($this->userModel->email)) {
                ResponseHandler::error("L'email est déjà utilisé.", 400);
                return;
            }
            
            // Vérifier si un seul compte gestionnaire est autorisé
            if ($this->userModel->role === 'gestionnaire') {
                $existingManagers = array_filter($this->userModel->getAll(), function($user) {
                    return $user['role'] === 'gestionnaire';
                });
                
                if (count($existingManagers) > 0) {
                    ResponseHandler::error("Un seul compte gestionnaire est autorisé dans le système.", 400);
                    return;
                }
            }
            
            // Créer l'utilisateur
            if ($this->userModel->create()) {
                // Récupérer l'ID de l'utilisateur créé
                $userId = $this->userModel->identifiant_technique;
                
                // Créer les tables pour cet utilisateur
                $tableCreationResult = $this->createUserTables($userId);
                
                ResponseHandler::success([
                    'message' => 'Utilisateur créé avec succès.',
                    'user' => [
                        'id' => $this->userModel->id,
                        'nom' => $this->userModel->nom,
                        'prenom' => $this->userModel->prenom,
                        'email' => $this->userModel->email,
                        'role' => $this->userModel->role,
                        'identifiant_technique' => $this->userModel->identifiant_technique,
                        'date_creation' => $this->userModel->date_creation
                    ],
                    'tables_created' => $tableCreationResult['tables_created'] ?? [],
                    'identifiant_technique' => $this->userModel->identifiant_technique
                ]);
            } else {
                ResponseHandler::error("Échec de la création de l'utilisateur", 500);
            }
        } catch (Exception $e) {
            error_log("UserOperations::handlePostRequest - Exception: " . $e->getMessage());
            ResponseHandler::error('Erreur serveur: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Gère les requêtes PUT pour les utilisateurs (mise à jour)
     */
    public function handlePutRequest() {
        try {
            // Récupérer les données PUT
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!$data || !isset($data['id'])) {
                ResponseHandler::error('Données incomplètes. ID requis.', 400);
                return;
            }
            
            // Vérifier si l'utilisateur existe
            $user = $this->userModel->getById($data['id']);
            if (!$user) {
                ResponseHandler::error('Utilisateur non trouvé', 404);
                return;
            }
            
            // Assigner l'ID et les valeurs à mettre à jour
            $this->userModel->id = $data['id'];
            
            if (isset($data['nom'])) {
                $this->userModel->nom = htmlspecialchars(strip_tags($data['nom']));
            }
            
            if (isset($data['prenom'])) {
                $this->userModel->prenom = htmlspecialchars(strip_tags($data['prenom']));
            }
            
            if (isset($data['email'])) {
                $this->userModel->email = htmlspecialchars(strip_tags($data['email']));
            }
            
            if (isset($data['role'])) {
                $this->userModel->role = htmlspecialchars(strip_tags($data['role']));
            }
            
            if (isset($data['mot_de_passe']) && !empty($data['mot_de_passe'])) {
                $this->userModel->mot_de_passe = $data['mot_de_passe'];
            }
            
            // Mettre à jour l'utilisateur
            if ($this->userModel->update()) {
                // Récupérer l'utilisateur mis à jour
                $updatedUser = $this->userModel->getById($data['id']);
                
                // Supprimer le mot de passe de la réponse
                if (isset($updatedUser['mot_de_passe'])) {
                    unset($updatedUser['mot_de_passe']);
                }
                
                ResponseHandler::success([
                    'message' => 'Utilisateur mis à jour avec succès',
                    'user' => $updatedUser
                ]);
            } else {
                ResponseHandler::error("Échec de la mise à jour de l'utilisateur", 500);
            }
        } catch (Exception $e) {
            error_log("UserOperations::handlePutRequest - Exception: " . $e->getMessage());
            ResponseHandler::error('Erreur serveur: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Crée les tables nécessaires pour un utilisateur spécifique
     * @param string $userId L'identifiant technique de l'utilisateur
     * @return array Résultat de la création des tables
     */
    public function createUserTables($userId) {
        try {
            error_log("Création des tables pour l'utilisateur avec ID: {$userId}");
            
            if (!$this->connection) {
                throw new Exception("Pas de connexion à la base de données");
            }
            
            $tableSchemas = [
                "bibliotheque" => "
                    CREATE TABLE IF NOT EXISTS `bibliotheque_{$userId}` (
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
                    CREATE TABLE IF NOT EXISTS `exigences_{$userId}` (
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
                "pilotage" => "
                    CREATE TABLE IF NOT EXISTS `pilotage_{$userId}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(255) NOT NULL,
                        `description` TEXT NULL,
                        `type` VARCHAR(50) NULL,
                        `groupId` VARCHAR(36) NULL,
                        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ",
                "membres" => "
                    CREATE TABLE IF NOT EXISTS `membres_{$userId}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(100) NOT NULL,
                        `prenom` VARCHAR(100) NOT NULL,
                        `email` VARCHAR(255) NULL,
                        `telephone` VARCHAR(20) NULL,
                        `fonction` VARCHAR(100) NULL,
                        `organisation` VARCHAR(255) NULL,
                        `notes` TEXT NULL,
                        `initiales` VARCHAR(10) NULL,
                        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                "
            ];
            
            $tablesCreated = [];
            $errors = [];
            
            foreach ($tableSchemas as $tableName => $schema) {
                try {
                    $stmt = $this->connection->prepare($schema);
                    if ($stmt->execute()) {
                        $tablesCreated[] = "{$tableName}_{$userId}";
                        error_log("Table {$tableName}_{$userId} créée avec succès");
                    } else {
                        $errors[] = "Échec de la création de la table {$tableName}_{$userId}";
                    }
                } catch (PDOException $e) {
                    error_log("Erreur lors de la création de la table {$tableName}_{$userId}: " . $e->getMessage());
                    $errors[] = "Erreur: " . $e->getMessage();
                }
            }
            
            return [
                'success' => count($errors) === 0,
                'tables_created' => $tablesCreated,
                'errors' => $errors
            ];
            
        } catch (Exception $e) {
            error_log("Exception lors de la création des tables utilisateur: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'tables_created' => []
            ];
        }
    }
    
    /**
     * Assure que toutes les tables existent pour tous les utilisateurs
     * @return array Résultats des vérifications
     */
    public function ensureAllUserTablesExist() {
        try {
            $users = $this->userModel->getAll();
            $results = [];
            
            foreach ($users as $user) {
                if (!isset($user['identifiant_technique']) || empty($user['identifiant_technique'])) {
                    continue;
                }
                
                $result = $this->createUserTables($user['identifiant_technique']);
                $results[$user['identifiant_technique']] = $result;
            }
            
            return $results;
        } catch (Exception $e) {
            error_log("Exception lors de la vérification des tables utilisateur: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
