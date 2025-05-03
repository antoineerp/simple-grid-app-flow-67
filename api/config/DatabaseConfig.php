
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
        // Utiliser les valeurs de Qualiflow par défaut
        $this->host = "p71x6d.myd.infomaniak.com";
        $this->db_name = "p71x6d_qualiflow";
        $this->username = "p71x6d_qualiflow";
        $this->password = "Trottinette43!";
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
                    }
                    
                    if (isset($config['db_name'])) $this->db_name = $config['db_name'];
                    if (isset($config['username'])) $this->username = $config['username'];
                    if (isset($config['password'])) $this->password = $config['password'];
                }
            } catch (Exception $e) {
                error_log("Error loading database configuration: " . $e->getMessage());
            }
        }
    }

    public function saveConfig() {
        $config = [
            'host' => $this->host,
            'db_name' => $this->db_name,
            'username' => $this->username,
            'password' => $this->password
        ];
        
        return file_put_contents($this->configFile, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    public function getConfig() {
        return [
            'host' => $this->host,
            'db_name' => $this->db_name,
            'username' => $this->username,
            'password' => '********'
        ];
    }

    public function getConnectionParams() {
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
        }
        // Vérifier que le nouvel hôte contient "infomaniak"
        else if (strpos($host, 'infomaniak') !== false) {
            $this->host = $host;
        } else {
            // Forcer l'utilisation d'Infomaniak par défaut
            $this->host = "p71x6d.myd.infomaniak.com";
        }
        
        $this->db_name = $db_name;
        $this->username = $username;
        $this->password = $password;
        return $this->saveConfig();
    }
}
