
<?php
class RequestHandler {
    /**
     * Définit les en-têtes standard pour éviter les problèmes CORS
     */
    public static function setStandardHeaders($allowedMethods = "GET, POST, OPTIONS") {
        header('Content-Type: application/json; charset=UTF-8');
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: {$allowedMethods}");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Device-ID");
        header("Cache-Control: no-cache, no-store, must-revalidate");
    }
    
    /**
     * Gère les requêtes OPTIONS pour le preflight CORS
     */
    public static function handleOptionsRequest() {
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Preflight OK']);
            exit;
        }
    }
    
    /**
     * Sanitize user ID to prevent SQL injection
     */
    public static function sanitizeUserId($userId) {
        return preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $userId);
    }
    
    /**
     * Récupère l'identifiant de l'appareil à partir des en-têtes
     */
    public static function getDeviceId() {
        $headers = getallheaders();
        $deviceId = isset($headers['X-Device-ID']) ? $headers['X-Device-ID'] : null;
        
        if (!$deviceId) {
            $deviceId = isset($_SERVER['HTTP_X_DEVICE_ID']) ? $_SERVER['HTTP_X_DEVICE_ID'] : null;
        }
        
        if (!$deviceId) {
            $deviceId = uniqid('unknown_device_', true);
        }
        
        return self::sanitizeUserId($deviceId);
    }
    
    /**
     * Prépare et renvoie une réponse JSON standard
     */
    public static function sendJsonResponse($success, $message, $data = null) {
        $response = [
            'success' => $success,
            'message' => $message,
            'timestamp' => date('c')
        ];
        
        if ($data !== null) {
            $response = array_merge($response, $data);
        }
        
        echo json_encode($response);
    }
    
    /**
     * Gère les erreurs de manière uniforme
     */
    public static function handleError($error, $code = 400) {
        error_log("Erreur dans l'API: " . $error);
        http_response_code($code);
        self::sendJsonResponse(false, $error instanceof Exception ? $error->getMessage() : $error);
        exit;
    }
}
