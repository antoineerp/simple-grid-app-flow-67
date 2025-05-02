
<?php
class DatabaseConfig {
    private $configFile;
    private $host;
    private $db_name;
    private $username;
    private $password;

    public function __construct() {
        $this->configFile = __DIR__ . '/db_config.json';
        // Utiliser uniquement les valeurs d'Infomaniak
        $this->host = "p71x6d.myd.infomaniak.com";
        $this->db_name = "p71x6d_system";
        $this->username = "p71x6d_system";
        $this->password = "Trottinette43!";
        
        // Ne charger la configuration personnalisée que si elle existe et est valide
        $this->loadConfigFile();
    }

    private function loadConfigFile() {
        if (file_exists($this->configFile)) {
            try {
                $jsonContent = file_get_contents($this->configFile);
                $config = json_decode($jsonContent, true);
                
                if (json_last_error() === JSON_ERROR_NONE) {
                    // Vérification renforcée: rejeter localhost et n'accepter que infomaniak
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
                error_log("Erreur lors du chargement de la configuration de la base de données: " . $e->getMessage());
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
        // Vérification pour rejeter localhost et utiliser uniquement Infomaniak
        if (strpos($host, 'localhost') !== false) {
            // Forcer l'utilisation d'Infomaniak
            $this->host = "p71x6d.myd.infomaniak.com";
        }
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
