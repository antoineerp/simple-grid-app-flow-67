
<?php
class Database {
    // Paramètres de connexion
    private $host;
    private $db_name;
    private $username;
    private $password;
    
    public $conn;
    public $is_connected = false;
    public $connection_error = null;
    
    // Constructeur
    public function __construct() {
        $this->loadConfig();
    }
    
    // Charger la configuration depuis le fichier JSON
    private function loadConfig() {
        $config_file = __DIR__ . '/db_config.json';
        
        // Vérifier si le fichier existe
        if (file_exists($config_file)) {
            try {
                $config = json_decode(file_get_contents($config_file), true);
                
                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new Exception("Erreur de décodage JSON: " . json_last_error_msg());
                }
                
                $this->host = $config['host'] ?? 'localhost';
                $this->db_name = $config['db_name'] ?? '';
                $this->username = $config['username'] ?? '';
                $this->password = $config['password'] ?? '';
            } catch (Exception $e) {
                error_log("Erreur lors du chargement de la configuration: " . $e->getMessage());
                $this->connection_error = "Erreur de configuration: " . $e->getMessage();
            }
        } else {
            error_log("Fichier de configuration non trouvé: $config_file");
            $this->connection_error = "Fichier de configuration non trouvé";
        }
    }
    
    // Obtenir une connexion à la base de données
    public function getConnection($throw_exception = false) {
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 3
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            $this->is_connected = true;
            $this->connection_error = null;
            
            return $this->conn;
        } catch (PDOException $e) {
            $this->is_connected = false;
            $this->connection_error = $e->getMessage();
            
            // Journaliser l'erreur
            error_log("Erreur de connexion à la base de données: " . $e->getMessage());
            
            if ($throw_exception) {
                throw $e;
            }
            
            return null;
        }
    }
    
    // Tester la connexion
    public function testConnection() {
        try {
            $this->getConnection();
            return $this->is_connected;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    // Mettre à jour la configuration
    public function updateConfig($host, $db_name, $username, $password) {
        $config = [
            'host' => $host,
            'db_name' => $db_name,
            'username' => $username,
            'password' => $password
        ];
        
        $config_file = __DIR__ . '/db_config.json';
        
        try {
            if (file_put_contents($config_file, json_encode($config, JSON_PRETTY_PRINT))) {
                // Mettre à jour les propriétés
                $this->host = $host;
                $this->db_name = $db_name;
                $this->username = $username;
                $this->password = $password;
                
                return true;
            } else {
                throw new Exception("Impossible d'écrire dans le fichier de configuration");
            }
        } catch (Exception $e) {
            error_log("Erreur lors de la mise à jour de la configuration: " . $e->getMessage());
            return false;
        }
    }
    
    // Obtenir la configuration actuelle (sans mot de passe)
    public function getConfig() {
        return [
            'host' => $this->host,
            'db_name' => $this->db_name,
            'username' => $this->username,
            'is_connected' => $this->is_connected,
            'error' => $this->connection_error
        ];
    }
}
?>
