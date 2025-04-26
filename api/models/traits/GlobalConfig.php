
<?php
trait GlobalConfig {
    public function saveGlobalConfig($key, $value) {
        try {
            $this->conn->exec("CREATE TABLE IF NOT EXISTS global_config (
                id INT AUTO_INCREMENT PRIMARY KEY,
                config_key VARCHAR(255) NOT NULL UNIQUE,
                config_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )");

            $query = "INSERT INTO global_config (config_key, config_value) 
                      VALUES (:key, :value)
                      ON DUPLICATE KEY UPDATE config_value = :value";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":key", $key);
            $stmt->bindParam(":value", $value);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Erreur lors de la sauvegarde de la configuration: " . $e->getMessage());
            return false;
        }
    }

    public function getGlobalConfig($key) {
        try {
            $query = "SELECT config_value FROM global_config WHERE config_key = :key";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":key", $key);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? $result['config_value'] : null;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération de la configuration: " . $e->getMessage());
            return null;
        }
    }
}
?>
