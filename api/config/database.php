
<?php
require_once __DIR__ . '/DatabaseConfig.php';
require_once __DIR__ . '/DatabaseConnection.php';
require_once __DIR__ . '/DatabaseDiagnostics.php';

class Database {
    private $config;
    private $connection;
    private $diagnostics;
    
    public function __construct($source = 'default') {
        $this->config = new DatabaseConfig();
        $this->connection = new DatabaseConnection($this->config, $source);
        $this->diagnostics = new DatabaseDiagnostics($this->connection, $this->config);
        
        error_log("Database class initialized from source '{$source}'");
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
            'source' => $this->connection->connection_source
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
}
?>
