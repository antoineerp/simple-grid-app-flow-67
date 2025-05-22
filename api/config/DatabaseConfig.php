
<?php
class DatabaseConfig {
    private $configFile;
    private $host;
    private $db_name;
    private $username;
    private $password;
    
    // Constantes pour forcer l'utilisation de p71x6d_richard
    private $FORCE_DB_NAME = 'p71x6d_richard';
    private $FORCE_DB_USER = 'p71x6d_richard';

    public function __construct() {
        $this->configFile = __DIR__ . '/db_config.json';
        $this->loadDefaultConfig();
        $this->loadConfigFile();
        
        // TOUJOURS forcer la base p71x6d_richard après chargement
        $this->db_name = $this->FORCE_DB_NAME;
        $this->username = $this->FORCE_DB_USER;
        
        error_log("[SÉCURITÉ] Configuration forcée: Base de données " . $this->FORCE_DB_NAME);
    }

    private function loadDefaultConfig() {
        // Toujours utiliser p71x6d_richard comme base de données par défaut
        $this->host = "p71x6d.myd.infomaniak.com";
        $this->db_name = $this->FORCE_DB_NAME;
        $this->username = $this->FORCE_DB_USER;
        $this->password = "Trottinette43!";
        
        error_log("[SYSTÈME] Configuration par défaut chargée - Base de données Infomaniak: " . $this->FORCE_DB_NAME);
    }

    private function loadConfigFile() {
        if (file_exists($this->configFile)) {
            try {
                $jsonContent = file_get_contents($this->configFile);
                $config = json_decode($jsonContent, true);
                
                if (json_last_error() === JSON_ERROR_NONE) {
                    // Vérification renforcée: rejeter explicitement localhost et n'accepter que infomaniak
                    if (isset($config['host']) && 
                        strpos($config['host'], 'infomaniak') !== false && 
                        strpos($config['host'], 'localhost') === false) {
                        $this->host = $config['host'];
                    } else {
                        error_log("[SÉCURITÉ] Tentative d'utiliser un hôte non autorisé, forcé vers Infomaniak");
                    }
                    
                    // TOUJOURS forcer l'utilisation de la base richard
                    $this->db_name = $this->FORCE_DB_NAME;
                    $this->username = $this->FORCE_DB_USER;
                    
                    // Le mot de passe peut être configuré
                    if (isset($config['password'])) $this->password = $config['password'];
                    
                    error_log("[SYSTÈME] Configuration appliquée - Base fixée à: " . $this->FORCE_DB_NAME);
                }
            } catch (Exception $e) {
                error_log("[ERREUR] Erreur de chargement de configuration: " . $e->getMessage());
                
                // En cas d'erreur, forcer les valeurs par défaut
                $this->db_name = $this->FORCE_DB_NAME;
                $this->username = $this->FORCE_DB_USER;
            }
        } else {
            // Créer le fichier de configuration s'il n'existe pas
            $this->saveConfig();
            error_log("[SYSTÈME] Fichier de configuration créé avec les paramètres par défaut");
        }
    }

    public function saveConfig() {
        // TOUJOURS forcer la base et l'utilisateur avant d'enregistrer
        $this->db_name = $this->FORCE_DB_NAME;
        $this->username = $this->FORCE_DB_USER;
        
        $config = [
            'host' => $this->host,
            'db_name' => $this->db_name,
            'username' => $this->username,
            'password' => $this->password
        ];
        
        // S'assurer que le dossier existe
        $dir = dirname($this->configFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        $result = file_put_contents($this->configFile, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        error_log("[SYSTÈME] Configuration sauvegardée avec " . $this->FORCE_DB_NAME . " dans: " . $this->configFile);
        return $result;
    }

    public function getConfig() {
        // TOUJOURS s'assurer que les valeurs sont correctes
        $this->db_name = $this->FORCE_DB_NAME;
        $this->username = $this->FORCE_DB_USER;
        
        return [
            'host' => $this->host,
            'db_name' => $this->db_name,
            'username' => $this->username,
            'password' => '********'
        ];
    }

    public function getConnectionParams() {
        // TOUJOURS s'assurer que les valeurs sont correctes avant de les retourner
        $this->db_name = $this->FORCE_DB_NAME;
        $this->username = $this->FORCE_DB_USER;
        
        return [
            'host' => $this->host,
            'db_name' => $this->db_name,
            'username' => $this->username,
            'password' => $this->password
        ];
    }

    public function updateConfig($host, $db_name, $username, $password) {
        // Vérification renforcée pour rejeter explicitement localhost
        if (strpos($host, 'localhost') !== false) {
            // Forcer l'utilisation d'Infomaniak
            $this->host = "p71x6d.myd.infomaniak.com";
            error_log("[SÉCURITÉ] Tentative d'utiliser localhost rejetée, forcée vers Infomaniak");
        }
        // Vérifier que le nouvel hôte contient "infomaniak"
        else if (strpos($host, 'infomaniak') !== false) {
            $this->host = $host;
        } else {
            // Forcer l'utilisation d'Infomaniak par défaut
            $this->host = "p71x6d.myd.infomaniak.com";
            error_log("[SÉCURITÉ] Hôte non valide, forcé vers Infomaniak");
        }
        
        // TOUJOURS forcer l'utilisation de p71x6d_richard malgré les paramètres fournis
        $this->db_name = $this->FORCE_DB_NAME;
        $this->username = $this->FORCE_DB_USER;
        $this->password = $password;
        
        error_log("[SYSTÈME] Tentative de modification ignorée - Configuration fixée à: " . $this->FORCE_DB_NAME);
        return $this->saveConfig();
    }
}
