
<?php
class ResponseHandler {
    public static function success($data = null, $message = '', $code = 200) {
        // S'assurer qu'aucun contenu n'a été envoyé avant
        if (!headers_sent()) {
            http_response_code($code);
            header('Content-Type: application/json; charset=UTF-8');
        }
        
        $response = [
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ];
        
        // Journaliser la réponse
        error_log("Réponse réussie: " . json_encode($response));
        
        echo json_encode($response);
        exit;
    }

    public static function error($message, $code = 400, $details = null) {
        // S'assurer qu'aucun contenu n'a été envoyé avant
        if (!headers_sent()) {
            http_response_code($code);
            header('Content-Type: application/json; charset=UTF-8');
        }
        
        $response = [
            'status' => 'error',
            'message' => $message
        ];
        
        if ($details) {
            $response['details'] = $details;
        }
        
        // Journaliser l'erreur
        error_log("Réponse d'erreur: " . json_encode($response));
        
        echo json_encode($response);
        exit;
    }
}
?>
