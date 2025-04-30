
<?php
require_once __DIR__ . '/DatabaseConfig.php';
require_once __DIR__ . '/DatabaseConnection.php';
require_once __DIR__ . '/DatabaseDiagnostics.php';

class Database {
    private $config;
    private $connection;
    private $diagnostics;
    private $userId;
    
    public function __construct($source = 'default') {
        // Si source n'est pas 'default', c'est probablement un ID utilisateur
        $this->userId = ($source !== 'default') ? $source : null;
        
        // Créer la configuration avec l'ID utilisateur si disponible
        $this->config = new DatabaseConfig($this->userId);
        $this->connection = new DatabaseConnection($this->config, $source);
        $this->diagnostics = new DatabaseDiagnostics($this->connection, $this->config);
        
        error_log("Database class initialized from source '{$source}'" . ($this->userId ? " (userId: {$this->userId})" : ""));
    }

    public function getConnection($require_connection = false) {
        return $this->connection->connect($require_connection);
    }

    public function testConnection() {
        try {
            $this->getConnection(false);
            return $this->connection->isConnected();
        } catch (Exception $e) {
            error_log("Connection test failed from '{$this->connection->connection_source}': " . $e->getMessage());
            return false;
        }
    }

    public function getConfig() {
        $config = $this->config->getConfig();
        return array_merge($config, [
            'is_connected' => $this->connection->isConnected(),
            'error' => $this->connection->getError(),
            'source' => $this->connection->connection_source,
            'userId' => $this->userId
        ]);
    }

    public function updateConfig($host, $db_name, $username, $password) {
        $success = $this->config->updateConfig($host, $db_name, $username, $password);
        $this->testConnection();
        return $success;
    }

    public function diagnoseConnection() {
        return $this->diagnostics->diagnose();
    }
    
    /**
     * Récupérer l'ID utilisateur associé à cette instance de base de données
     */
    public function getUserId() {
        return $this->userId;
    }
    
    /**
     * Vérifier si une table existe pour cet utilisateur
     */
    public function tableExists($tableName) {
        try {
            if (!$this->getConnection(true)) {
                return false;
            }
            
            $sql = "SHOW TABLES LIKE ?";
            $stmt = $this->connection->getConnection()->prepare($sql);
            $stmt->execute([$tableName]);
            
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log("Error checking if table exists: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Créer une table si elle n'existe pas
     */
    public function createTableIfNotExists($tableName, $schema) {
        try {
            if (!$this->getConnection(true)) {
                return false;
            }
            
            $this->connection->getConnection()->exec($schema);
            return true;
        } catch (Exception $e) {
            error_log("Error creating table: " . $e->getMessage());
            return false;
        }
    }
}
?>
