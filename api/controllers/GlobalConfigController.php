
<?php
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/utils/ResponseHandler.php';
require_once dirname(__DIR__) . '/models/GlobalConfig.php';

class GlobalConfigController {
    private $config;
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->config = new GlobalConfig($this->db);
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        
        switch ($method) {
            case 'GET':
                $this->getConfig();
                break;
            case 'POST':
                $this->saveConfig();
                break;
            default:
                ResponseHandler::error("Méthode non autorisée", 405);
                break;
        }
    }

    private function getConfig() {
        try {
            $key = $_GET['key'] ?? null;
            if (!$key) {
                ResponseHandler::error("Clé de configuration manquante", 400);
                return;
            }
            
            $value = $this->config->getGlobalConfig($key);
            ResponseHandler::success(['value' => $value]);
        } catch (Exception $e) {
            ResponseHandler::error($e->getMessage(), 500);
        }
    }

    private function saveConfig() {
        try {
            $data = json_decode(file_get_contents("php://input"));
            if (!isset($data->key) || !isset($data->value)) {
                ResponseHandler::error("Données invalides", 400);
                return;
            }
            
            $success = $this->config->saveGlobalConfig($data->key, $data->value);
            if ($success) {
                ResponseHandler::success(['message' => 'Configuration sauvegardée']);
            } else {
                ResponseHandler::error("Erreur lors de la sauvegarde", 500);
            }
        } catch (Exception $e) {
            ResponseHandler::error($e->getMessage(), 500);
        }
    }
}

$controller = new GlobalConfigController();
$controller->handleRequest();
?>
