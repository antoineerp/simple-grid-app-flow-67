
<?php
class ResponseHandler {
    /**
     * Envoie une réponse d'erreur formatée en JSON
     *
     * @param string $message Message d'erreur
     * @param int $code Code HTTP (par défaut 400)
     * @param array $additional_data Données supplémentaires à inclure dans la réponse
     */
    public static function error($message, $code = 400, $additional_data = []) {
        // Nettoyer tout buffer de sortie existant
        if (ob_get_level()) {
            ob_clean();
        }
        
        // S'assurer que les en-têtes sont correctement définis
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=UTF-8');
            http_response_code($code);
        }
        
        $response = [
            'status' => 'error',
            'message' => $message,
            'code' => $code
        ];
        
        // Ajouter des données supplémentaires si fournies
        if (!empty($additional_data)) {
            $response = array_merge($response, $additional_data);
        }
        
        echo json_encode($response);
        exit;
    }
    
    /**
     * Envoie une réponse de succès formatée en JSON
     *
     * @param mixed $data Données à inclure dans la réponse
     * @param string $message Message de succès (optionnel)
     * @param int $code Code HTTP (par défaut 200)
     */
    public static function success($data = null, $message = "Opération réussie", $code = 200) {
        // Nettoyer tout buffer de sortie existant
        if (ob_get_level()) {
            ob_clean();
        }
        
        // S'assurer que les en-têtes sont correctement définis
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=UTF-8');
            http_response_code($code);
        }
        
        $response = [
            'status' => 'success',
            'message' => $message
        ];
        
        // Ajouter les données si elles sont fournies
        if ($data !== null) {
            if (is_array($data) && isset($data['records'])) {
                $response = array_merge($response, $data);
            } else {
                $response['data'] = $data;
            }
        }
        
        echo json_encode($response);
        exit;
    }
}
?>
