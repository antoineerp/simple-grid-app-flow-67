
<?php
// Configuration de la connexion à la base de données
class Database {
    // Variables de connexion à la base de données
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;
    public $connection_error = null;
    public $is_connected = false;

    // Constructeur qui charge la configuration
    public function __construct() {
        // Chargement de la configuration depuis le fichier config
        $this->loadConfig();
    }

    // Charger la configuration depuis un fichier JSON
    private function loadConfig() {
        $configFile = __DIR__ . '/db_config.json';
        
        // Configuration par défaut - ne sera utilisée que si db_config.json n'existe pas
        $this->host = "p71x6d.myd.infomaniak.com";
        $this->db_name = "p71x6d_system";
        $this->username = "p71x6d_system";
        $this->password = ""; // Vide pour des raisons de sécurité - doit être défini dans db_config.json
        
        // Si le fichier de configuration existe, charger les valeurs
        if (file_exists($configFile)) {
            try {
                $config = json_decode(file_get_contents($configFile), true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    if (isset($config['host'])) $this->host = $config['host'];
                    if (isset($config['db_name'])) $this->db_name = $config['db_name'];
                    if (isset($config['username'])) $this->username = $config['username'];
                    if (isset($config['password'])) $this->password = $config['password'];
                } else {
                    error_log("Erreur JSON dans db_config.json: " . json_last_error_msg());
                }
            } catch (Exception $e) {
                error_log("Erreur lors du chargement de la configuration de base de données: " . $e->getMessage());
                $this->connection_error = "Erreur de configuration: " . $e->getMessage();
            }
        } else {
            error_log("Fichier de configuration db_config.json non trouvé, utilisation des valeurs par défaut");
            // Créer le fichier de configuration avec les valeurs par défaut
            $this->saveConfig();
        }
        
        // Journaliser les paramètres de connexion (sans le mot de passe)
        error_log("Paramètres de connexion chargés - Host: {$this->host}, DB: {$this->db_name}, User: {$this->username}");
    }

    // Sauvegarder la configuration actuelle
    public function saveConfig() {
        $configFile = __DIR__ . '/db_config.json';
        $config = [
            'host' => $this->host,
            'db_name' => $this->db_name,
            'username' => $this->username,
            'password' => $this->password
        ];
        
        try {
            file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            return true;
        } catch (Exception $e) {
            error_log("Erreur lors de la sauvegarde de la configuration de base de données: " . $e->getMessage());
            $this->connection_error = "Erreur de sauvegarde: " . $e->getMessage();
            return false;
        }
    }

    // Obtenir la connexion à la base de données
    public function getConnection($require_connection = false) {
        $this->conn = null;
        $this->is_connected = false;

        try {
            // Journaliser la tentative de connexion
            error_log("Tentative de connexion à la base de données - Host: {$this->host}, DB: {$this->db_name}, User: {$this->username}");
            
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 5, // Timeout en secondes
            ];
            
            // Si le mot de passe est vide, on ne tente pas la connexion
            if (empty($this->password) && $require_connection) {
                throw new Exception("Mot de passe de base de données non configuré");
            }
            
            // Tenter de se connecter à la base de données
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
            // Forcer l'encodage UTF-8 pour toutes les requêtes
            $this->conn->exec("SET NAMES utf8mb4");
            
            // Marquer la connexion comme réussie
            $this->is_connected = true;
            $this->connection_error = null;
            
            // Journaliser la connexion réussie
            error_log("Connexion réussie à la base de données {$this->db_name}");
            
        } catch(PDOException $exception) {
            $error_message = "Erreur de connexion à la base de données: " . $exception->getMessage();
            error_log($error_message);
            $this->connection_error = $error_message;
            
            if ($require_connection) {
                throw new Exception($error_message);
            }
        }

        return $this->conn;
    }

    // Tester la connexion sans lancer d'exception
    public function testConnection() {
        try {
            $this->getConnection(false);
            return $this->is_connected;
        } catch (Exception $e) {
            error_log("Test de connexion échoué: " . $e->getMessage());
            return false;
        }
    }

    // Obtenir les informations de configuration actuelle
    public function getConfig() {
        return [
            'host' => $this->host,
            'db_name' => $this->db_name,
            'username' => $this->username,
            'password' => '********', // Masqué pour des raisons de sécurité
            'is_connected' => $this->is_connected,
            'error' => $this->connection_error
        ];
    }

    // Mettre à jour la configuration
    public function updateConfig($host, $db_name, $username, $password) {
        $this->host = $host;
        $this->db_name = $db_name;
        $this->username = $username;
        $this->password = $password;
        
        $success = $this->saveConfig();
        
        // Tester la connexion après la mise à jour
        $this->testConnection();
        
        return $success;
    }
}
?>
