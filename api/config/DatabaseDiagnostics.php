
<?php
class DatabaseDiagnostics {
    private $connection;
    private $config;

    public function __construct($connection, $config) {
        $this->connection = $connection;
        $this->config = $config;
    }

    public function diagnose() {
        $diagnostics = [
            'timestamp' => date('Y-m-d H:i:s'),
            'source' => $this->connection->connection_source,
            'config' => $this->config->getConfig(),
            'connection_result' => $this->connection->isConnected(),
            'error' => $this->connection->getError(),
            'pdo_drivers' => PDO::getAvailableDrivers(),
            'server_details' => [
                'php_version' => phpversion(),
                'server_name' => $_SERVER['SERVER_NAME'] ?? 'Unknown',
                'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
                'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
                'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Unknown',
            ]
        ];

        if ($this->connection->isConnected()) {
            $conn = $this->connection->getConnection();
            try {
                $stmt = $conn->query("SHOW TABLES");
                $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                $diagnostics['tables'] = $tables;
                
                $has_users_table = in_array('utilisateurs', $tables);
                $diagnostics['has_users_table'] = $has_users_table;
                
                if ($has_users_table) {
                    $stmt = $conn->query("SELECT COUNT(*) FROM utilisateurs");
                    $diagnostics['user_count'] = $stmt->fetchColumn();
                }
            } catch (Exception $e) {
                $diagnostics['error'] = $e->getMessage();
            }
        }
        
        return $diagnostics;
    }
}
