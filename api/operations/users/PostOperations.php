
<?php
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

require_once dirname(dirname(__DIR__)) . '/utils/ResponseHandler.php';
require_once dirname(dirname(__DIR__)) . '/models/User.php';

class UserPostOperations {
    protected $connection;
    protected $model;
    
    public function __construct($db, $model) {
        $this->connection = $db;
        $this->model = $model;
    }
    
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
            error_log("UserPostOperations: Utilisation de la table {$this->model->table}");
            
            // Assigner les valeurs au modèle
            $this->model->nom = htmlspecialchars(strip_tags($data['nom']));
            $this->model->prenom = htmlspecialchars(strip_tags($data['prenom']));
            $this->model->email = htmlspecialchars(strip_tags($data['email']));
            $this->model->role = htmlspecialchars(strip_tags($data['role']));
            
            // Mot de passe (optionnel)
            if (isset($data['mot_de_passe']) && !empty($data['mot_de_passe'])) {
                $this->model->mot_de_passe = $data['mot_de_passe'];
            } else {
                // Générer un mot de passe aléatoire si non fourni
                $this->model->mot_de_passe = $this->generateRandomPassword();
            }
            
            // Générer un identifiant technique unique
            $baseIdentifier = 'user_' . strtolower(substr($this->model->prenom, 0, 3)) . 
                             strtolower(substr($this->model->nom, 0, 3)) . 
                             substr(md5($this->model->email), 0, 5);
            $this->model->identifiant_technique = $baseIdentifier;
            
            // Vérifier si cette email existe déjà
            $stmt = $this->connection->prepare("SELECT COUNT(*) as count FROM {$this->model->table} WHERE email = :email");
            $stmt->bindParam(":email", $this->model->email);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result['count'] > 0) {
                ResponseHandler::error("L'email est déjà utilisé.", 400);
                return;
            }
            
            // Vérifier si un seul compte gestionnaire est autorisé
            if ($this->model->role === 'gestionnaire') {
                $stmt = $this->connection->prepare("SELECT COUNT(*) as count FROM {$this->model->table} WHERE role = 'gestionnaire'");
                $stmt->execute();
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($result['count'] > 0) {
                    ResponseHandler::error("Un seul compte gestionnaire est autorisé dans le système.", 400);
                    return;
                }
            }
            
            // Créer l'utilisateur
            if ($this->model->create()) {
                // Récupérer l'ID de l'utilisateur créé
                $userId = $this->model->identifiant_technique;
                
                // Créer les tables pour cet utilisateur
                $this->createUserTables($userId);
                
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
                ResponseHandler::error("Échec de la création de l'utilisateur.", 400);
            }
            
        } catch (Exception $e) {
            error_log("UserPostOperations - Exception: " . $e->getMessage());
            ResponseHandler::error('Erreur serveur: ' . $e->getMessage(), 500);
        }
    }
    
    private function generateRandomPassword($length = 12) {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
        $password = '';
        for ($i = 0; $i < $length; $i++) {
            $password .= $chars[rand(0, strlen($chars) - 1)];
        }
        return $password;
    }
    
    private function createUserTables($userId) {
        try {
            // Nettoyer l'ID utilisateur pour éviter les injections SQL
            $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            error_log("Création des tables pour l'utilisateur: {$safeUserId}");
            
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
                    }
                } catch (PDOException $e) {
                    error_log("Erreur lors de la création de la table {$tableName}_{$safeUserId}: " . $e->getMessage());
                }
            }
            
            return $createdTables;
            
        } catch (Exception $e) {
            error_log("Exception lors de la création des tables utilisateur: " . $e->getMessage());
            return [];
        }
    }
}
?>
