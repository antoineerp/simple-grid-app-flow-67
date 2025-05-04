
<?php
class TableManager {
    protected $connection;
    protected $tableName;
    protected $userId = '';

    public function __construct($connection, $tableName, $userId = '') {
        $this->connection = $connection;
        $this->tableName = $tableName;
        $this->userId = $userId;
    }

    public function getFullTableName() {
        if (!empty($this->userId)) {
            return "{$this->tableName}_{$this->userId}";
        }
        return $this->tableName;
    }

    public function ensureTableExists($schema) {
        if (!$this->connection) {
            error_log("Pas de connexion à la base de données");
            return false;
        }
        
        try {
            $stmt = $this->connection->prepare($schema);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Erreur lors de la création de la table: " . $e->getMessage());
            return false;
        }
    }

    public function getTableColumns() {
        if (!$this->connection) {
            error_log("Pas de connexion à la base de données pour obtenir les colonnes");
            return [];
        }
        
        try {
            $tableName = $this->getFullTableName();
            
            $sql = "SHOW COLUMNS FROM `{$tableName}`";
            $stmt = $this->connection->prepare($sql);
            $stmt->execute();
            
            $columns = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $columns[] = $row['Field'];
            }
            
            error_log("Colonnes récupérées pour la table {$tableName}: " . implode(", ", $columns));
            return $columns;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des colonnes: " . $e->getMessage());
            return [];
        }
    }

    public function insertMultipleData($records) {
        if (empty($records)) {
            return true; // Rien à insérer
        }
        
        try {
            // Préparer une requête d'insertion multiple
            $first = reset($records);
            $fields = array_keys($first);
            $fieldsStr = implode("`, `", $fields);
            
            $values = [];
            $placeholders = [];
            
            foreach ($records as $record) {
                $recordPlaceholders = [];
                foreach ($record as $value) {
                    $values[] = $value;
                    $recordPlaceholders[] = "?";
                }
                $placeholders[] = "(" . implode(", ", $recordPlaceholders) . ")";
            }
            
            $placeholdersStr = implode(", ", $placeholders);
            $tableName = $this->getFullTableName();
            
            $query = "INSERT INTO `{$tableName}` (`" . $fieldsStr . "`) VALUES " . $placeholdersStr;
            $stmt = $this->connection->prepare($query);
            
            return $stmt->execute($values);
        } catch (PDOException $e) {
            error_log("Erreur lors de l'insertion multiple: " . $e->getMessage());
            return false;
        }
    }

    public function loadData() {
        if (!$this->connection) {
            throw new Exception("Pas de connexion à la base de données");
        }
        
        try {
            $tableName = $this->getFullTableName();
            $query = "SELECT * FROM `{$tableName}`";
            $stmt = $this->connection->prepare($query);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors du chargement des données: " . $e->getMessage());
            throw new Exception("Erreur lors du chargement des données: " . $e->getMessage());
        }
    }
    
    // Nouvelle méthode pour initialiser une table pour un utilisateur
    public static function initializeTableForUser($connection, $tableName, $userId) {
        if (!$connection || empty($userId) || empty($tableName)) {
            error_log("Paramètres invalides pour initialiser la table {$tableName} pour l'utilisateur {$userId}");
            return false;
        }
        
        try {
            $userTableName = "{$tableName}_{$userId}";
            
            error_log("Initialisation de la table {$userTableName}");
            
            // Définir le schéma en fonction du type de table
            $schema = self::getTableSchema($tableName, $userTableName);
            
            if (empty($schema)) {
                error_log("Schéma non défini pour la table {$tableName}");
                return false;
            }
            
            // Créer la table si elle n'existe pas
            $connection->exec($schema);
            
            // Enregistrer l'opération dans l'historique de synchronisation
            self::recordSyncOperation($connection, $tableName, $userId, 'initialize', 0);
            
            error_log("Table {$userTableName} initialisée avec succès");
            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors de l'initialisation de la table {$tableName} pour l'utilisateur {$userId}: " . $e->getMessage());
            return false;
        }
    }
    
    // Méthode pour obtenir le schéma d'une table en fonction de son type
    private static function getTableSchema($tableName, $userTableName) {
        switch ($tableName) {
            case 'documents':
                return "CREATE TABLE IF NOT EXISTS `{$userTableName}` (
                    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
                    `titre` VARCHAR(255) NOT NULL,
                    `description` TEXT NULL,
                    `contenu` LONGTEXT NULL,
                    `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `date_modification` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    `auteur` VARCHAR(100) NULL,
                    `statut` VARCHAR(50) NULL DEFAULT 'brouillon',
                    `version` VARCHAR(20) NULL DEFAULT '1.0',
                    `tags` VARCHAR(255) NULL,
                    `categorie` VARCHAR(100) NULL,
                    `userId` VARCHAR(50) NOT NULL,
                    `visibilite` VARCHAR(20) NULL DEFAULT 'public',
                    `last_sync_device` VARCHAR(100) NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                
            case 'exigences':
                return "CREATE TABLE IF NOT EXISTS `{$userTableName}` (
                    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
                    `code` VARCHAR(50) NOT NULL,
                    `description` TEXT NOT NULL,
                    `priorite` VARCHAR(20) NULL DEFAULT 'normale',
                    `statut` VARCHAR(50) NULL DEFAULT 'nouveau',
                    `categorie` VARCHAR(100) NULL,
                    `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `date_modification` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    `document_id` VARCHAR(36) NULL,
                    `userId` VARCHAR(50) NOT NULL,
                    `last_sync_device` VARCHAR(100) NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                
            case 'membres':
                return "CREATE TABLE IF NOT EXISTS `{$userTableName}` (
                    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
                    `nom` VARCHAR(100) NOT NULL,
                    `prenom` VARCHAR(100) NOT NULL,
                    `email` VARCHAR(255) NULL,
                    `telephone` VARCHAR(20) NULL,
                    `role` VARCHAR(50) NULL,
                    `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `date_modification` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    `statut` VARCHAR(20) NULL DEFAULT 'actif',
                    `userId` VARCHAR(50) NOT NULL,
                    `last_sync_device` VARCHAR(100) NULL,
                    `infos` TEXT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                
            case 'bibliotheque':
                return "CREATE TABLE IF NOT EXISTS `{$userTableName}` (
                    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
                    `nom` VARCHAR(255) NOT NULL,
                    `description` TEXT NULL,
                    `type` VARCHAR(50) NOT NULL,
                    `chemin` VARCHAR(255) NOT NULL,
                    `taille` INT NULL,
                    `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `date_modification` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    `userId` VARCHAR(50) NOT NULL,
                    `document_id` VARCHAR(36) NULL,
                    `last_sync_device` VARCHAR(100) NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                
            case 'collaboration':
                return "CREATE TABLE IF NOT EXISTS `{$userTableName}` (
                    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
                    `nom` VARCHAR(255) NOT NULL,
                    `description` TEXT NULL,
                    `link` VARCHAR(255) NULL,
                    `groupId` VARCHAR(36) NULL,
                    `userId` VARCHAR(50) NOT NULL,
                    `last_sync_device` VARCHAR(100) NULL,
                    `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                
            case 'collaboration_groups':
                return "CREATE TABLE IF NOT EXISTS `{$userTableName}` (
                    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
                    `nom` VARCHAR(255) NOT NULL,
                    `description` TEXT NULL,
                    `userId` VARCHAR(50) NOT NULL,
                    `last_sync_device` VARCHAR(100) NULL,
                    `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                
            case 'test_table':
                return "CREATE TABLE IF NOT EXISTS `{$userTableName}` (
                    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
                    `nom` VARCHAR(255) NOT NULL,
                    `description` TEXT NULL,
                    `userId` VARCHAR(50) NOT NULL,
                    `last_sync_device` VARCHAR(100) NULL,
                    `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                
            default:
                error_log("Type de table non reconnu: {$tableName}");
                return null;
        }
    }
    
    // Méthode pour enregistrer une opération de synchronisation dans l'historique
    private static function recordSyncOperation($connection, $tableName, $userId, $operation, $recordCount) {
        try {
            // Créer la table d'historique si elle n'existe pas
            $connection->exec("CREATE TABLE IF NOT EXISTS `sync_history` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `table_name` VARCHAR(100) NOT NULL,
                `user_id` VARCHAR(50) NOT NULL,
                `device_id` VARCHAR(100) NOT NULL,
                `record_count` INT NOT NULL,
                `operation` VARCHAR(50) DEFAULT 'sync',
                `sync_timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX `idx_user_device` (`user_id`, `device_id`),
                INDEX `idx_table_user` (`table_name`, `user_id`),
                INDEX `idx_timestamp` (`sync_timestamp`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            
            // Insérer l'enregistrement
            $deviceId = isset($_SERVER['HTTP_X_DEVICE_ID']) ? $_SERVER['HTTP_X_DEVICE_ID'] : 'system';
            
            $stmt = $connection->prepare("INSERT INTO `sync_history` 
                                        (table_name, user_id, device_id, record_count, operation) 
                                        VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$tableName, $userId, $deviceId, $recordCount, $operation]);
            
            // Créer deux enregistrements pour load et sync
            if ($operation === 'initialize') {
                $stmt->execute([$tableName, $userId, $deviceId, 0, 'load']);
                $stmt->execute([$tableName, $userId, $deviceId, 0, 'sync']);
            }
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors de l'enregistrement de l'opération de synchronisation: " . $e->getMessage());
            return false;
        }
    }
}
?>
