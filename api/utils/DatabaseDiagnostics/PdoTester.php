
<?php
class PdoTester {
    private $config;
    
    public function __construct($config) {
        $this->config = $config;
    }
    
    public function testPdoConnection() {
        try {
            if (!$this->config || !isset($this->config['host']) || !isset($this->config['db_name']) || 
                !isset($this->config['username']) || !isset($this->config['password'])) {
                return [
                    'status' => 'error',
                    'message' => 'Configuration PDO invalide'
                ];
            }
            
            $dsn = "mysql:host={$this->config['host']};dbname={$this->config['db_name']};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $pdo = new PDO($dsn, $this->config['username'], $this->config['password'], $options);
            
            // Récupérer des informations sur la connexion
            $stmt = $pdo->query("SELECT DATABASE() AS current_db, version() AS mysql_version, @@character_set_database AS encoding, @@collation_database AS collation");
            $db_info = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Compter le nombre de tables
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Calculer la taille de la base de données
            $stmt = $pdo->query("SELECT SUM(data_length + index_length) AS size FROM information_schema.TABLES WHERE table_schema = DATABASE()");
            $size_result = $stmt->fetch(PDO::FETCH_ASSOC);
            $size = $size_result['size'] ? round($size_result['size'] / (1024 * 1024), 2) . ' MB' : '0 MB';
            
            return [
                'status' => 'success',
                'message' => 'Connexion PDO directe réussie',
                'connection_info' => [
                    'host' => $this->config['host'],
                    'database' => $this->config['db_name'],
                    'user' => $this->config['username'],
                    'current_db' => $db_info['current_db'],
                    'mysql_version' => $db_info['mysql_version'],
                    'encoding' => $db_info['encoding'],
                    'collation' => $db_info['collation'],
                    'tables' => count($tables),
                    'size' => $size,
                    'table_list' => $tables
                ]
            ];
        } catch (PDOException $e) {
            return [
                'status' => 'error',
                'message' => 'Échec de la connexion PDO directe',
                'error' => $e->getMessage()
            ];
        }
    }
}
