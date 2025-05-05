
<?php
trait TableManager {
    public function createTableIfNotExists() {
        try {
            // Vérifier si la table existe déjà
            $result = $this->conn->query("SHOW TABLES LIKE '{$this->table_name}'");
            
            if ($result->rowCount() === 0) {
                // La table n'existe pas, la créer
                $query = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nom VARCHAR(100) NOT NULL,
                    prenom VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    mot_de_passe VARCHAR(255) NOT NULL,
                    identifiant_technique VARCHAR(100) NOT NULL UNIQUE,
                    role VARCHAR(20) NOT NULL DEFAULT 'utilisateur',
                    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                
                $this->conn->exec($query);
                error_log("Table {$this->table_name} créée avec succès");
                
                // Ajouter un utilisateur administrateur par défaut
                $defaultAdminQuery = "INSERT INTO {$this->table_name} 
                    (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
                    VALUES ('Admin', 'Système', 'admin@system.local', :password, 'admin_system', 'admin')";
                
                $stmt = $this->conn->prepare($defaultAdminQuery);
                $defaultPassword = password_hash('admin123', PASSWORD_BCRYPT);
                $stmt->bindParam(':password', $defaultPassword);
                $stmt->execute();
                
                error_log("Utilisateur administrateur par défaut créé dans la table {$this->table_name}");
            }
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors de la création de la table {$this->table_name}: " . $e->getMessage());
            throw $e;
        }
    }
}
?>
