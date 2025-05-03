
<?php
class RequestHandler {
    /**
     * Configure les en-têtes standards pour les réponses API
     */
    public static function setStandardHeaders($methods = "GET, POST, OPTIONS") {
        header('Content-Type: application/json; charset=UTF-8');
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: $methods");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Device-ID");
        header("Cache-Control: no-cache, no-store, must-revalidate");
    }

    /**
     * Gère les requêtes OPTIONS (preflight) pour CORS
     */
    public static function handleOptionsRequest() {
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Preflight OK']);
            exit;
        }
    }
    
    /**
     * Récupère l'ID de l'appareil client depuis les en-têtes ou les paramètres
     */
    public static function getDeviceId() {
        // Vérifier dans les en-têtes HTTP
        $headers = getallheaders();
        if (isset($headers['X-Device-ID'])) {
            return self::sanitizeDeviceId($headers['X-Device-ID']);
        }
        
        // Vérifier dans les paramètres GET
        if (isset($_GET['deviceId'])) {
            return self::sanitizeDeviceId($_GET['deviceId']);
        }
        
        // Valeur par défaut
        return 'unknown_device';
    }

    /**
     * Nettoie l'identifiant utilisateur pour éviter les injections SQL
     */
    public static function sanitizeUserId($userId) {
        // Nettoyage simple de l'userId
        $userId = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $userId);
        return substr($userId, 0, 50); // Limiter la longueur
    }
    
    /**
     * Nettoie l'identifiant d'appareil pour éviter les injections SQL
     */
    public static function sanitizeDeviceId($deviceId) {
        // Nettoyage simple de l'deviceId
        $deviceId = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $deviceId);
        return substr($deviceId, 0, 100); // Limiter la longueur
    }
    
    /**
     * Vérifie si l'utilisateur est autorisé pour une ressource donnée
     */
    public static function checkUserAuthorization($resourceUserId, $currentUserId, $isAdmin = false) {
        // Si l'utilisateur est admin, il a accès à tout
        if ($isAdmin) {
            return true;
        }
        
        // Si la ressource n'appartient à aucun utilisateur, elle est publique
        if (empty($resourceUserId)) {
            return true;
        }
        
        // Sinon, l'utilisateur ne peut accéder qu'à ses propres ressources
        return $resourceUserId === $currentUserId;
    }
    
    /**
     * Enregistre les informations de synchronisation lors d'une requête
     */
    public static function logSyncRequest($userId, $deviceId, $tableName, $action) {
        try {
            // Créer un fichier de log pour faciliter le débogage
            $logFile = __DIR__ . '/../logs/sync_log.txt';
            $logDir = dirname($logFile);
            
            // Créer le répertoire logs s'il n'existe pas
            if (!file_exists($logDir)) {
                mkdir($logDir, 0755, true);
            }
            
            $logData = date('Y-m-d H:i:s') . " | User: $userId | Device: $deviceId | Table: $tableName | Action: $action" . PHP_EOL;
            file_put_contents($logFile, $logData, FILE_APPEND);
        } catch (Exception $e) {
            error_log("Erreur lors de l'enregistrement du log de synchronisation: " . $e->getMessage());
        }
    }
}
?>
