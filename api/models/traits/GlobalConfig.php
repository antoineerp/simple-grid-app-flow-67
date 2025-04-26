
<?php
trait GlobalConfig {
    public function saveGlobalConfig($key, $value) {
        try {
            // S'assurer que la table existe
            $this->conn->exec("CREATE TABLE IF NOT EXISTS global_config (
                id INT AUTO_INCREMENT PRIMARY KEY,
                config_key VARCHAR(255) NOT NULL UNIQUE,
                config_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )");

            // Préparer et exécuter la requête
            $query = "INSERT INTO global_config (config_key, config_value) 
                      VALUES (:key, :value)
                      ON DUPLICATE KEY UPDATE config_value = :value";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":key", $key);
            $stmt->bindParam(":value", $value);
            $result = $stmt->execute();
            
            if (!$result) {
                error_log("Erreur SQL lors de la sauvegarde de la configuration: " . implode(", ", $stmt->errorInfo()));
                return false;
            }
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur PDO lors de la sauvegarde de la configuration: " . $e->getMessage());
            return false;
        } catch (Exception $e) {
            error_log("Erreur générale lors de la sauvegarde de la configuration: " . $e->getMessage());
            return false;
        }
    }

    public function getGlobalConfig($key) {
        try {
            // Vérifions d'abord si la table existe
            $tableExists = $this->conn->query("SHOW TABLES LIKE 'global_config'")->rowCount() > 0;
            
            if (!$tableExists) {
                // Si la table n'existe pas, on la crée
                $this->conn->exec("CREATE TABLE IF NOT EXISTS global_config (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    config_key VARCHAR(255) NOT NULL UNIQUE,
                    config_value TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )");
                return null; // Aucune configuration n'existe encore
            }
            
            // Récupérer la configuration
            $query = "SELECT config_value FROM global_config WHERE config_key = :key";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":key", $key);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? $result['config_value'] : null;
        } catch (PDOException $e) {
            error_log("Erreur PDO lors de la récupération de la configuration: " . $e->getMessage());
            return null;
        } catch (Exception $e) {
            error_log("Erreur générale lors de la récupération de la configuration: " . $e->getMessage());
            return null;
        }
    }
}
?>
