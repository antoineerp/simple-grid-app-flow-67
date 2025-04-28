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
    public $connection_source = null; // Pour tracer d'où vient la connexion

    // Constructeur qui charge la configuration
    public function __construct($source = 'default') {
        // Enregistrer la source de la connexion pour le débogage
        $this->connection_source = $source;
        
        // Chargement de la configuration depuis le fichier config
        $this->loadConfig();
        
        // Journaliser l'initialisation avec la source
        error_log("Database class initialized from source '{$source}' with: Host: {$this->host}, DB: {$this->db_name}, User: {$this->username}");
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
                error_log("Contenu du fichier config: " . substr($jsonContent, 0, 50) . "...");
                
                $config = json_decode($jsonContent, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    if (isset($config['host'])) $this->host = $config['host'];
                    if (isset($config['db_name'])) $this->db_name = $config['db_name'];
                    if (isset($config['username'])) $this->username = $config['username'];
                    if (isset($config['password'])) $this->password = $config['password'];
                    
                    error_log("Configuration chargée avec succès depuis {$configFile}: Host: {$this->host}, DB: {$this->db_name}, User: {$this->username}");
                } else {
                    error_log("Erreur JSON dans db_config.json: " . json_last_error_msg());
                    $this->connection_error = "Erreur de configuration JSON: " . json_last_error_msg();
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
            error_log("Configuration sauvegardée avec succès dans: " . $configFile);
            return true;
        } catch (Exception $e) {
            error_log("Erreur lors de la sauvegarde de la configuration de base de données: " . $e->getMessage());
            $this->connection_error = "Erreur de sauvegarde: "e->getMessage();
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
            
            // Journaliser la tentative de connexion avec la source
            error_log("Tentative de connexion à la base de données depuis '{$this->connection_source}' - Host: {$this->host}, DB: {$this->db_name}, User: {$this->username}");
            
            // Construire le DSN exactement comme dans la connexion directe qui fonctionne
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            // Tenter de se connecter à la base de données
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
            // Forcer l'encodage UTF-8 pour toutes les requêtes
            $this->conn->exec("SET NAMES utf8mb4");
            
            // Marquer la connexion comme réussie
            $this->is_connected = true;
            
            // Journaliser la connexion réussie avec la source
            error_log("Connexion réussie à la base de données {$this->db_name} depuis '{$this->connection_source}'");
            
        } catch(PDOException $exception) {
            $error_message = "Erreur de connexion à la base de données depuis '{$this->connection_source}': " . $exception->getMessage();
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
            error_log("Test de connexion échoué depuis '{$this->connection_source}': " . $e->getMessage());
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
            'error' => $this->connection_error,
            'source' => $this->connection_source // Ajouter la source dans les infos de config
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

    // Diagnostiquer les problèmes de connexion et retourner des informations détaillées
    public function diagnoseConnection() {
        error_log("Diagnostic de connexion exécuté depuis '{$this->connection_source}'");
        $diagnostics = [
            'timestamp' => date('Y-m-d H:i:s'),
            'source' => $this->connection_source,
            'config' => [
                'host' => $this->host,
                'db_name' => $this->db_name,
                'username' => $this->username,
                'password_set' => !empty($this->password)
            ],
            'connection_result' => null,
            'error' => null,
            'pdo_drivers' => PDO::getAvailableDrivers(),
            'server_details' => [
                'php_version' => phpversion(),
                'server_name' => $_SERVER['SERVER_NAME'] ?? 'Inconnu',
                'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Inconnu',
                'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Inconnu',
                'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Inconnu',
            ]
        ];

        try {
            // Tester la connexion
            $this->getConnection(false);
            $diagnostics['connection_result'] = $this->is_connected;
            $diagnostics['error'] = $this->connection_error;
            
            // Si connexion réussie, vérifier si les tables existent
            if ($this->is_connected) {
                // Lister les tables
                $stmt = $this->conn->query("SHOW TABLES");
                $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                $diagnostics['tables'] = $tables;
                
                // Vérifier si la table utilisateurs existe
                $has_users_table = in_array('utilisateurs', $tables);
                $diagnostics['has_users_table'] = $has_users_table;
                
                // Compter les utilisateurs si la table existe
                if ($has_users_table) {
                    $stmt = $this->conn->query("SELECT COUNT(*) FROM utilisateurs");
                    $diagnostics['user_count'] = $stmt->fetchColumn();
                }
            }
        } catch (Exception $e) {
            $diagnostics['connection_result'] = false;
            $diagnostics['error'] = $e->getMessage();
        }
        
        return $diagnostics;
    }
}
?>
