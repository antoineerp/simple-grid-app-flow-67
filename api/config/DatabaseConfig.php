
<?php
class DatabaseConfig {
    private $configFile;
    private $host;
    private $db_name;
    private $username;
    private $password;

    public function __construct() {
        $this->configFile = __DIR__ . '/db_config.json';
        $this->loadInfomaniakConfig();
        // Nous chargeons toujours la configuration JSON, mais elle sera écrasée par les valeurs Infomaniak
        $this->loadConfigFile();
    }

    private function loadInfomaniakConfig() {
        // Toujours utiliser les valeurs d'Infomaniak pour la production
        $this->host = "p71x6d.myd.infomaniak.com";
        $this->db_name = "p71x6d_richard";
        $this->username = "p71x6d_richard";
        $this->password = "Trottinette43!";
    }

    private function loadConfigFile() {
        if (file_exists($this->configFile)) {
            try {
                $jsonContent = file_get_contents($this->configFile);
                $config = json_decode($jsonContent, true);
                
                if (json_last_error() === JSON_ERROR_NONE) {
                    // Nous ignorons les configurations pour localhost ou non-Infomaniak
                    // Les informations Infomaniak sont prioritaires
                    if (isset($config['password']) && $config['password'] !== "********" && 
                        strpos($config['host'], 'infomaniak') !== false) {
                        $this->password = $config['password'];
                    }
                }
            } catch (Exception $e) {
                error_log("Error loading database configuration: " . $e->getMessage());
                // En cas d'erreur, nous conservons les valeurs d'Infomaniak
            }
        }
        
        // Force toujours les bonnes valeurs Infomaniak, peu importe ce qui a été chargé
        $this->host = "p71x6d.myd.infomaniak.com";
        $this->db_name = "p71x6d_richard";
        $this->username = "p71x6d_richard";
    }

    public function saveConfig() {
        // Forcer les valeurs Infomaniak
        $this->host = 'p71x6d.myd.infomaniak.com';
        $this->db_name = 'p71x6d_richard';
        $this->username = 'p71x6d_richard';
        $this->password = 'Trottinette43!';
        
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
        // Ne jamais permettre la mise à jour vers des valeurs non Infomaniak
        // Forcer l'utilisation d'Infomaniak
        $this->host = "p71x6d.myd.infomaniak.com";
        
        // Forcer les valeurs correctes
        $this->db_name = 'p71x6d_richard';
        $this->username = 'p71x6d_richard';
        $this->password = 'Trottinette43!';
        
        return $this->saveConfig();
    }
}
