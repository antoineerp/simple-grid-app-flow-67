
<?php
class ResponseHandler {
    /**
     * Envoie une réponse de succès
     * 
     * @param mixed $data Données à renvoyer
     * @param string $message Message de succès
     * @param int $code Code HTTP
     */
    public static function success($data = null, $message = "Opération réussie", $code = 200) {
        // Nettoyer le buffer de sortie existant
        if (ob_get_level()) ob_clean();
        
        http_response_code($code);
        
        // Assurez-vous que l'en-tête Content-Type est défini
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=UTF-8');
        }
        
        $response = [
            'status' => 'success',
            'message' => $message
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        echo json_encode($response);
        exit;
    }

    /**
     * Envoie une réponse d'erreur
     * 
     * @param string $message Message d'erreur
     * @param int $code Code HTTP d'erreur
     * @param array $details Détails supplémentaires sur l'erreur
     */
    public static function error($message, $code = 500, $details = []) {
        // Nettoyer le buffer de sortie existant
        if (ob_get_level()) ob_clean();
        
        http_response_code($code);
        
        // Assurez-vous que l'en-tête Content-Type est défini
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=UTF-8');
        }
        
        $response = [
            'status' => 'error',
            'message' => $message,
            'code' => $code
        ];
        
        if (!empty($details)) {
            $response['details'] = $details;
        }
        
        echo json_encode($response);
        exit;
    }
}
?>
