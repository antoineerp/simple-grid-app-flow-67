
<?php
class RequestHandler {
    public static function setStandardHeaders($methods = "GET, POST, OPTIONS") {
        header('Content-Type: application/json; charset=UTF-8');
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: $methods");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
        header("Cache-Control: no-cache, no-store, must-revalidate");
    }

    public static function handleOptionsRequest() {
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Preflight OK']);
            exit;
        }
    }

    public static function sanitizeUserId($userId) {
        // Nettoyage simple de l'userId
        $userId = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $userId);
        return substr($userId, 0, 50); // Limiter la longueur
    }
}
?>
