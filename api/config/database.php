
<?php
// Configuration de la connexion à la base de données
class Database {
    // Variables de connexion à la base de données
    public $host;
    public $db_name;
    public $username;
    public $password;
    public $conn;
    public $connection_error = null;
    public $is_connected = false;

    // Constructeur qui charge la configuration
    public function __construct() {
        // Chargement de la configuration depuis le fichier config
        $this->loadConfig();
        
        // Journaliser l'initialisation
        error_log("Database class initialized with: Host: {$this->host}, DB: {$this->db_name}, User: {$this->username}");
    }

    // Charger la configuration depuis un fichier JSON
    private function loadConfig() {
        $configFile = __DIR__ . '/db_config.json';
        error_log("Recherche du fichier de configuration à: " . $configFile);
        
        // Configuration par défaut - ne sera utilisée que si db_config.json n'existe pas
        $this->host = "p71x6d.myd.infomaniak.com";
        $this->db_name = "p71x6d_system";
        $this->username = "p71x6d_system";
        $this->password = "Trottinette43!"; // Mot de passe par défaut
        
        // Si le fichier de configuration existe, charger les valeurs
        if (file_exists($configFile)) {
            try {
                $jsonContent = file_get_contents($configFile);
                if ($jsonContent === false) {
                    throw new Exception("Impossible de lire le fichier de configuration");
                }
                
                error_log("Contenu du fichier config: " . substr($jsonContent, 0, 50) . "...");
                
                $config = json_decode($jsonContent, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    if (isset($config['host'])) $this->host = $config['host'];
                    if (isset($config['db_name'])) $this->db_name = $config['db_name'];
                    if (isset($config['username'])) $this->username = $config['username'];
                    if (isset($config['password'])) $this->password = $config['password'];
                    
                    error_log("Configuration chargée avec succès: Host: {$this->host}, DB: {$this->db_name}, User: {$this->username}");
                } else {
                    error_log("Erreur JSON dans db_config.json: " . json_last_error_msg());
                    $this->connection_error = "Erreur de configuration JSON: " . json_last_error_msg();
                    // Utiliser les valeurs par défaut
                }
            } catch (Exception $e) {
                error_log("Erreur lors du chargement de la configuration de base de données: " . $e->getMessage());
                $this->connection_error = "Erreur de configuration: " . $e->getMessage();
                // Utiliser les valeurs par défaut
            }
        } else {
            error_log("Fichier de configuration db_config.json non trouvé, utilisation des valeurs par défaut");
            // Créer le fichier de configuration avec les valeurs par défaut
            $this->saveConfig();
        }
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
            $result = file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            if ($result === false) {
                throw new Exception("Échec de l'écriture dans le fichier de configuration");
            }
            error_log("Configuration sauvegardée avec succès dans: " . $configFile);
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
        $this->connection_error = null;

        try {
            // Vérifier d'abord les paramètres de connexion
            if (empty($this->host)) {
                throw new Exception("Le nom d'hôte de la base de données n'est pas configuré");
            }
            if (empty($this->db_name)) {
                throw new Exception("Le nom de la base de données n'est pas configuré");
            }
            if (empty($this->username)) {
                throw new Exception("Le nom d'utilisateur de la base de données n'est pas configuré");
            }
            if (empty($this->password)) {
                throw new Exception("Le mot de passe de base de données n'est pas configuré");
            }
            
            // Journaliser la tentative de connexion
            error_log("Tentative de connexion à la base de données - Host: {$this->host}, DB: {$this->db_name}, User: {$this->username}");
            
            // Construire le DSN exactement comme dans la connexion directe qui fonctionne
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 5, // Timeout de connexion de 5 secondes
            ];
            
            // Tenter de se connecter à la base de données avec un délai d'attente
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
            // Forcer l'encodage UTF-8 pour toutes les requêtes
            $this->conn->exec("SET NAMES utf8mb4");
            
            // Marquer la connexion comme réussie
            $this->is_connected = true;
            
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
