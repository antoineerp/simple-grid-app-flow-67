
<?php
class DatabaseConnection {
    private $conn;
    private $config;
    public $is_connected = false;
    public $connection_error = null;
    public $connection_source = null;

    public function __construct($config, $source = 'default') {
        $this->config = $config;
        $this->connection_source = $source;
    }

    public function connect($require_connection = false) {
        $this->conn = null;
        $this->is_connected = false;
        $this->connection_error = null;

        try {
            $params = $this->config->getConnectionParams();
            
            if (empty($params['host']) || empty($params['db_name']) || 
                empty($params['username']) || empty($params['password'])) {
                throw new Exception("Missing database configuration parameters");
            }

            $dsn = "mysql:host=" . $params['host'] . ";dbname=" . $params['db_name'] . ";charset=utf8mb4";
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->conn = new PDO($dsn, $params['username'], $params['password'], $options);
            $this->conn->exec("SET NAMES utf8mb4");
            $this->is_connected = true;
            
        } catch(PDOException $e) {
            $this->connection_error = "Database connection error: " . $e->getMessage();
            if ($require_connection) {
                throw $e;
            }
        }

        return $this->conn;
    }

    public function getConnection() {
        return $this->conn;
    }

    public function isConnected() {
        return $this->is_connected;
    }

    public function getError() {
        return $this->connection_error;
    }
}
