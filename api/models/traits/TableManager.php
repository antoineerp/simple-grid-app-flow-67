
<?php
trait TableManager {
    protected function createTableIfNotExists() {
        try {
            error_log("TableManager::createTableIfNotExists - Vérification de l'existence de la table '{$this->table_name}'");
            
            $tableExistsQuery = "SHOW TABLES LIKE '" . $this->table_name . "'";
            $stmt = $this->conn->prepare($tableExistsQuery);
            $stmt->execute();
            
            if ($stmt->rowCount() == 0) {
                error_log("TableManager - La table '{$this->table_name}' n'existe pas, création en cours");
                
                $createTableSQL = "CREATE TABLE IF NOT EXISTS `" . $this->table_name . "` (
                    `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    `nom` varchar(100) NOT NULL,
                    `prenom` varchar(100) NOT NULL,
                    `email` varchar(255) NOT NULL,
                    `mot_de_passe` varchar(255) NOT NULL,
                    `identifiant_technique` varchar(100) NOT NULL,
                    `role` varchar(20) NOT NULL,
                    `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY `email` (`email`),
                    UNIQUE KEY `identifiant_technique` (`identifiant_technique`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
                
                $this->conn->exec($createTableSQL);
                error_log("TableManager - Table '{$this->table_name}' créée avec succès");
                
                // Insert default admin user
                $adminPassword = password_hash('admin123', PASSWORD_BCRYPT);
                $insertAdminQuery = "INSERT INTO `" . $this->table_name . "` 
                    (`nom`, `prenom`, `email`, `mot_de_passe`, `identifiant_technique`, `role`, `date_creation`) VALUES
                    ('Admin', 'Système', 'admin@qualiopi.ch', '" . $adminPassword . "', 'p71x6d_system', 'admin', NOW());";
                
                $this->conn->exec($insertAdminQuery);
                error_log("TableManager - Utilisateur administrateur créé par défaut");
            } else {
                error_log("TableManager - La table '{$this->table_name}' existe déjà");
            }
            
            $this->validateTableStructure();
            
        } catch (PDOException $e) {
            error_log("TableManager - Erreur lors de la vérification/création de la table: " . $e->getMessage());
        }
    }

    private function validateTableStructure() {
        try {
            $primaryKeyQuery = "SHOW KEYS FROM " . $this->table_name . " WHERE Key_name = 'PRIMARY'";
            $stmt = $this->conn->prepare($primaryKeyQuery);
            $stmt->execute();
            $primaryKey = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$primaryKey || $primaryKey['Column_name'] !== 'id') {
                $this->updateTableStructure();
            }
            
            $this->validateTableEncoding();
        } catch (PDOException $e) {
            error_log("TableManager - Erreur lors de la validation de la structure: " . $e->getMessage());
        }
    }

    private function validateTableEncoding() {
        try {
            $tableInfoQuery = "SELECT CCSA.character_set_name FROM information_schema.`TABLES` T, 
                             information_schema.`COLLATION_CHARACTER_SET_APPLICABILITY` CCSA 
                             WHERE CCSA.collation_name = T.table_collation 
                             AND T.table_schema = DATABASE() 
                             AND T.table_name = '" . $this->table_name . "'";
            $stmt = $this->conn->prepare($tableInfoQuery);
            $stmt->execute();
            $tableInfo = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($tableInfo && $tableInfo['character_set_name'] !== 'utf8mb4') {
                $this->conn->exec("ALTER TABLE `" . $this->table_name . "` 
                                 CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            }
        } catch (PDOException $e) {
            error_log("TableManager - Erreur lors de la validation de l'encodage: " . $e->getMessage());
        }
    }

    private function updateTableStructure() {
        try {
            $backupQuery = "CREATE TABLE IF NOT EXISTS `" . $this->table_name . "_backup` LIKE `" . $this->table_name . "`;";
            $this->conn->exec($backupQuery);
            
            $copyDataQuery = "INSERT INTO `" . $this->table_name . "_backup` SELECT * FROM `" . $this->table_name . "`;";
            $this->conn->exec($copyDataQuery);
            
            $alterTableQuery = "ALTER TABLE `" . $this->table_name . "` 
                              MODIFY COLUMN `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY";
            $this->conn->exec($alterTableQuery);
        } catch (PDOException $e) {
            error_log("TableManager - Erreur lors de la mise à jour de la structure: " . $e->getMessage());
        }
    }
}
?>
