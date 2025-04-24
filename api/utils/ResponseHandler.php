
<?php
class ResponseHandler {
    public static function success($data = null, $message = '', $code = 200) {
        // Assurons-nous que les en-têtes sont envoyés correctement
        if (!headers_sent()) {
            header("Content-Type: application/json; charset=UTF-8");
            http_response_code($code);
        }
        
        // Création d'une réponse standard
        $response = [
            'status' => 'success',
            'message' => $message
        ];
        
        // Ajout des données si présentes
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        // Vérification que la réponse peut être encodée en JSON
        $jsonResponse = json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
        
        if ($jsonResponse === false) {
            error_log("Erreur d'encodage JSON: " . json_last_error_msg());
            // En cas d'erreur d'encodage, on renvoie une réponse simplifiée
            echo json_encode([
                'status' => 'error',
                'message' => 'Erreur lors de l\'encodage de la réponse: ' . json_last_error_msg()
            ]);
        } else {
            // Envoi de la réponse JSON
            echo $jsonResponse;
        }
        exit;
    }

    public static function error($message, $code = 400, $details = null) {
        // Assurons-nous que les en-têtes sont envoyés correctement
        if (!headers_sent()) {
            header("Content-Type: application/json; charset=UTF-8");
            http_response_code($code);
        }
        
        // Création d'une réponse d'erreur standard
        $response = [
            'status' => 'error',
            'message' => $message
        ];
        
        // Ajout des détails si présents
        if ($details) {
            $response['details'] = $details;
        }
        
        // Vérification que la réponse peut être encodée en JSON
        $jsonResponse = json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
        
        if ($jsonResponse === false) {
            error_log("Erreur d'encodage JSON: " . json_last_error_msg());
            // En cas d'erreur d'encodage, on renvoie une réponse simplifiée
            echo json_encode([
                'status' => 'error',
                'message' => 'Erreur lors de l\'encodage de la réponse: ' . json_last_error_msg()
            ], JSON_PARTIAL_OUTPUT_ON_ERROR);
        } else {
            // Envoi de la réponse JSON
            echo $jsonResponse;
        }
        exit;
    }
}
?>
