
<?php
class DatabaseConfig {
    private $configFile;
    private $host;
    private $db_name;
    private $username;
    private $password;

    public function __construct() {
        $this->configFile = __DIR__ . '/db_config.json';
        $this->loadDefaultConfig();
        $this->loadConfigFile();
    }

    private function loadDefaultConfig() {
        // Toujours utiliser p71x6d_richard comme base de données par défaut
        $this->host = "p71x6d.myd.infomaniak.com";
        $this->db_name = "p71x6d_richard"; // Base de données fixe
        $this->username = "p71x6d_richard"; // Utilisateur fixe
        $this->password = "Trottinette43!";
        
        error_log("[SYSTÈME] Configuration par défaut chargée - Base de données Infomaniak: p71x6d_richard");
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
                    
                    // Toujours forcer l'utilisation de la base richard
                    $this->db_name = 'p71x6d_richard';
                    $this->username = 'p71x6d_richard';
                    
                    // Le mot de passe peut être configuré
                    if (isset($config['password'])) $this->password = $config['password'];
                    
                    error_log("[SYSTÈME] Configuration appliquée - Base fixée à: p71x6d_richard");
                }
            } catch (Exception $e) {
                error_log("[ERREUR] Erreur de chargement de configuration: " . $e->getMessage());
            }
        } else {
            // Créer le fichier de configuration s'il n'existe pas
            $this->saveConfig();
            error_log("[SYSTÈME] Fichier de configuration créé avec les paramètres par défaut");
        }
    }

    public function saveConfig() {
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
        error_log("[SYSTÈME] Configuration sauvegardée dans: " . $this->configFile);
        return $result;
    }

    public function getConfig() {
        return [
            'host' => $this->host,
            'db_name' => $this->db_name, // Toujours p71x6d_richard
            'username' => $this->username, // Toujours p71x6d_richard
            'password' => '********'
        ];
    }

    public function getConnectionParams() {
        return [
            'host' => $this->host,
            'db_name' => $this->db_name, // Toujours p71x6d_richard
            'username' => $this->username, // Toujours p71x6d_richard
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
        
        // Forcer toujours l'utilisation de la base richard
        $this->db_name = 'p71x6d_richard';
        $this->username = 'p71x6d_richard';
        $this->password = $password;
        
        error_log("[SYSTÈME] Configuration mise à jour - Base fixée à: p71x6d_richard sur " . $this->host);
        return $this->saveConfig();
    }
}
