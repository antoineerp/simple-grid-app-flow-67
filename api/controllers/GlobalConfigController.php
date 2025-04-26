
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
        try {
            $database = new Database();
            $this->db = $database->getConnection();
            $this->config = new GlobalConfig($this->db);
        } catch (Exception $e) {
            error_log("Erreur dans la construction du GlobalConfigController: " . $e->getMessage());
            ResponseHandler::error("Erreur de connexion à la base de données: " . $e->getMessage(), 500);
            exit;
        }
    }

    public function handleRequest() {
        try {
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
        } catch (Exception $e) {
            error_log("Erreur dans handleRequest: " . $e->getMessage());
            ResponseHandler::error("Erreur lors du traitement de la requête: " . $e->getMessage(), 500);
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
            error_log("Erreur dans getConfig: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la récupération de la configuration: " . $e->getMessage(), 500);
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
            error_log("Erreur dans saveConfig: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la sauvegarde de la configuration: " . $e->getMessage(), 500);
        }
    }
}

// Assurer que toutes les erreurs sont gérées
try {
    $controller = new GlobalConfigController();
    $controller->handleRequest();
} catch (Exception $e) {
    error_log("Exception non gérée dans GlobalConfigController: " . $e->getMessage());
    ResponseHandler::error("Erreur serveur interne: " . $e->getMessage(), 500);
}
?>
