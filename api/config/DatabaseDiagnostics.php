
<?php
class DatabaseDiagnostics {
    private $connection;
    private $config;
    
    public function __construct($connection, $config) {
        $this->connection = $connection;
        $this->config = $config;
    }
    
    public function diagnose() {
        $results = [];
        
        // Vérification de la configuration
        $configParams = $this->config->getConnectionParams();
        $results['config'] = [
            'host' => $configParams['host'],
            'db_name' => $configParams['db_name'],
            'username' => $configParams['username'],
            'has_password' => !empty($configParams['password']),
            'is_valid' => (!empty($configParams['host']) && !empty($configParams['db_name']) && 
                          !empty($configParams['username']) && !empty($configParams['password'])) ? true : false
        ];
        
        // Vérification de la connexion
        $results['connection'] = [
            'is_connected' => $this->connection->isConnected(),
            'error' => $this->connection->getError(),
            'source' => $this->connection->connection_source
        ];
        
        // Test direct de PDO si possible
        if (!$this->connection->isConnected()) {
            // Inclure le testeur PDO si disponible
            if (file_exists(__DIR__ . '/../utils/DatabaseDiagnostics/PdoTester.php')) {
                require_once __DIR__ . '/../utils/DatabaseDiagnostics/PdoTester.php';
                $pdoTester = new PdoTester($configParams);
                $results['pdo_test'] = $pdoTester->testPdoConnection();
            } else {
                $results['pdo_test'] = [
                    'status' => 'error',
                    'message' => 'PdoTester non disponible'
                ];
            }
        }
        
        return $results;
    }
}
