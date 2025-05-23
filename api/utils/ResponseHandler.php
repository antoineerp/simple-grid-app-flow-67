
<?php
class ResponseHandler {
    /**
     * Envoie une réponse de succès
     */
    public static function success($data, $code = 200) {
        // Nettoyer tout buffer de sortie existant
        if (ob_get_level()) ob_clean();
        
        http_response_code($code);
        
        // Si les en-têtes n'ont pas encore été envoyés
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=UTF-8');
            header('Cache-Control: no-cache, no-store, must-revalidate');
        }
        
        // Fusionner les données avec le statut et le succès
        $response = array_merge([
            'status' => 'success',
            'success' => true,
            'timestamp' => date('Y-m-d H:i:s')
        ], is_array($data) ? $data : ['data' => $data]);
        
        echo json_encode($response);
        exit();
    }
    
    /**
     * Envoie une réponse d'erreur
     */
    public static function error($message, $code = 400, $additionalData = []) {
        // Nettoyer tout buffer de sortie existant
        if (ob_get_level()) ob_clean();
        
        http_response_code($code);
        
        // Si les en-têtes n'ont pas encore été envoyés
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=UTF-8');
            header('Cache-Control: no-cache, no-store, must-revalidate');
        }
        
        $response = array_merge([
            'status' => 'error',
            'success' => false,
            'message' => $message,
            'code' => $code,
            'timestamp' => date('Y-m-d H:i:s')
        ], $additionalData);
        
        echo json_encode($response);
        exit();
    }
    
    /**
     * Enregistre et envoie une erreur avec traçage
     */
    public static function logAndSendError($e, $message = 'Erreur serveur', $code = 500) {
        // Journaliser l'erreur
        error_log("Exception: " . get_class($e) . " - " . $e->getMessage() . " dans " . $e->getFile() . " à la ligne " . $e->getLine());
        
        // Envoyer la réponse d'erreur
        self::error($message . ': ' . $e->getMessage(), $code, [
            'debug_info' => [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]
        ]);
    }
    
    /**
     * Vérifie si une action est autorisée
     */
    public static function checkPermission($condition, $message = 'Action non autorisée', $code = 403) {
        if (!$condition) {
            self::error($message, $code);
        }
    }
}
?>
