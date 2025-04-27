
<?php
class HttpErrorHandler {
    /**
     * Gérer une erreur HTTP et renvoyer une réponse JSON appropriée
     * 
     * @param int $code Code d'erreur HTTP
     * @param string $message Message d'erreur
     * @param array $details Détails supplémentaires (optionnel)
     */
    public static function handleError($code, $message, $details = []) {
        // Nettoyer tout buffer de sortie existant
        if (ob_get_level()) ob_clean();
        
        // Définir le code de statut HTTP
        http_response_code($code);
        
        // Définir les en-têtes de réponse
        header('Content-Type: application/json; charset=UTF-8');
        
        // Journaliser l'erreur
        error_log("Erreur HTTP $code: $message");
        
        // Construire la réponse
        $response = [
            'status' => 'error',
            'code' => $code,
            'message' => $message
        ];
        
        // Ajouter des détails si fournis
        if (!empty($details)) {
            $response['details'] = $details;
        }
        
        // Envoyer la réponse au format JSON
        echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    /**
     * Gérer spécifiquement une erreur 500 - Erreur interne du serveur
     * 
     * @param string $message Message d'erreur
     * @param \Exception $exception Exception à traiter (optionnel)
     */
    public static function handleServerError($message = "Erreur interne du serveur", $exception = null) {
        $details = [];
        
        // Si une exception est fournie, ajouter ses détails
        if ($exception !== null) {
            $details['exception'] = [
                'message' => $exception->getMessage(),
                'code' => $exception->getCode(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine()
            ];
            
            // En développement uniquement, ajouter la trace de la pile
            if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
                $details['exception']['trace'] = $exception->getTraceAsString();
            }
        }
        
        self::handleError(500, $message, $details);
    }
    
    /**
     * Gérer une erreur 404 - Page non trouvée
     * 
     * @param string $message Message d'erreur
     * @param string $path Chemin demandé
     */
    public static function handleNotFound($message = "Point d'entrée non trouvé", $path = null) {
        $details = [];
        
        if ($path !== null) {
            $details['path'] = $path;
            $details['request_uri'] = $_SERVER['REQUEST_URI'] ?? 'Non disponible';
        }
        
        self::handleError(404, $message, $details);
    }
}
?>
