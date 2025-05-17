
<?php
/**
 * Gestionnaire de réponses API uniformisé
 * Assure un format de réponse cohérent pour toutes les API de l'application
 */
class ResponseHandler {
    /**
     * Envoie une réponse de succès avec les données fournies
     * 
     * @param mixed $data Données à renvoyer dans la réponse
     * @param int $code Code HTTP de la réponse
     * @param string $message Message optionnel
     */
    public static function success($data = [], $code = 200, $message = "Opération réussie") {
        self::sendResponse(true, $message, $data, $code);
    }
    
    /**
     * Envoie une réponse d'erreur
     * 
     * @param string $message Message d'erreur
     * @param int $code Code HTTP de l'erreur
     * @param array $details Détails supplémentaires sur l'erreur
     */
    public static function error($message = "Une erreur est survenue", $code = 400, $details = []) {
        self::sendResponse(false, $message, $details, $code);
    }
    
    /**
     * Formate et envoie la réponse JSON
     */
    private static function sendResponse($success, $message, $data, $code) {
        http_response_code($code);
        
        $response = [
            'success' => $success,
            'message' => $message,
            'code' => $code,
            'timestamp' => date('Y-m-d\TH:i:s\Z')
        ];
        
        if (!empty($data)) {
            $response['data'] = $data;
        }
        
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
}
?>
