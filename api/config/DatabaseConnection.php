
<?php
class DatabaseConnection {
    public $conn;
    private $config;
    public $is_connected = false;
    public $connection_error = null;
    public $connection_source = null;
    public $tableName;

    public function __construct($config, $source = 'default') {
        $this->config = $config;
        $this->connection_source = $source;
        
        // Log la source de connexion pour débogage
        error_log("DatabaseConnection créée avec source: {$source}");
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
            
            error_log("Tentative de connexion à la base {$params['db_name']} sur {$params['host']}");
            
            $dsn = "mysql:host=" . $params['host'] . ";charset=utf8mb4";
            
            // Tenter de se connecter sans spécifier la base de données d'abord
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $tempConn = new PDO($dsn, $params['username'], $params['password'], $options);
            
            // Vérifier si la base de données existe
            $stmt = $tempConn->prepare("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?");
            $stmt->execute([$params['db_name']]);
            
            if (!$stmt->fetch()) {
                // La base de données n'existe pas, la créer
                error_log("La base de données {$params['db_name']} n'existe pas, création...");
                $tempConn->exec("CREATE DATABASE `{$params['db_name']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                error_log("Base de données {$params['db_name']} créée avec succès");
            }
            
            // Maintenant, se connecter à la base de données spécifique
            $dsn .= ";dbname=" . $params['db_name'];
            $this->conn = new PDO($dsn, $params['username'], $params['password'], $options);
            $this->conn->exec("SET NAMES utf8mb4");
            $this->is_connected = true;
            
            error_log("Connexion établie avec succès à la base de données {$params['db_name']}");
            
        } catch(PDOException $e) {
            $this->connection_error = "Database connection error: " . $e->getMessage();
            error_log($this->connection_error);
            
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
