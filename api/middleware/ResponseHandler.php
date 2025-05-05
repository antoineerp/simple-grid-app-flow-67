
<?php
class ResponseHandler {
    public static function success($data = null, $message = "Opération réussie", $statusCode = 200) {
        self::sendResponse($statusCode, [
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ]);
    }
    
    public static function error($message = "Une erreur est survenue", $statusCode = 500, $errorDetails = null) {
        self::sendResponse($statusCode, [
            'status' => 'error',
            'message' => $message,
            'details' => $errorDetails
        ]);
    }
    
    private static function sendResponse($statusCode, $data) {
        // Nettoyer tout buffer existant
        if (ob_get_level()) ob_clean();
        
        // Définir l'en-tête de la réponse
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code($statusCode);
        
        // Envoyer la réponse JSON
        echo json_encode($data);
        exit;
    }
}
?>
