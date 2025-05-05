
<?php
class ConfigTester {
    private $db_config_path;
    
    public function __construct() {
        $this->db_config_path = __DIR__ . '/../../config/db_config.json';
    }
    
    public function testConfiguration() {
        try {
            if (!file_exists($this->db_config_path)) {
                return [
                    'status' => 'error',
                    'message' => 'Fichier db_config.json introuvable'
                ];
            }
            
            $config_content = file_get_contents($this->db_config_path);
            error_log("Contenu du fichier config: " . substr($config_content, 0, 50) . "...");
            
            $db_config = json_decode($config_content, true);
            
            if ($db_config && isset($db_config['host']) && isset($db_config['db_name']) && isset($db_config['username'])) {
                return [
                    'status' => 'success',
                    'message' => 'Fichier de configuration trouvé et valide',
                    'config' => [
                        'host' => $db_config['host'],
                        'db_name' => $db_config['db_name'],
                        'username' => $db_config['username']
                    ]
                ];
            }
            
            return [
                'status' => 'error',
                'message' => 'Configuration invalide dans db_config.json'
            ];
            
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Erreur lors de la lecture du fichier de configuration',
                'error' => $e->getMessage()
            ];
        }
    }
}
