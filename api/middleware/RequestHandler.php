
<?php
class RequestHandler {
    /**
     * Définit les en-têtes HTTP standard pour les réponses API
     */
    public static function setStandardHeaders($methods = "GET, POST, OPTIONS") {
        header("Access-Control-Allow-Origin: *");
        header("Content-Type: application/json; charset=UTF-8");
        header("Access-Control-Allow-Methods: {$methods}");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Forced-DB-User, X-User-Prefix");
        header("Access-Control-Max-Age: 3600");
    }
    
    /**
     * Gère les requêtes OPTIONS pour CORS
     */
    public static function handleOptionsRequest() {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
    
    /**
     * Gestion complète des en-têtes CORS
     */
    public static function handleCORS() {
        self::setStandardHeaders();
        self::handleOptionsRequest();
    }
    
    /**
     * Nettoie et valide l'ID utilisateur
     */
    public static function sanitizeUserId($userId) {
        // Si l'ID est vide, retourner une valeur par défaut
        if (empty($userId)) {
            error_log("RequestHandler::sanitizeUserId - ID utilisateur vide, utilisation de p71x6d_richard par défaut");
            return 'p71x6d_richard';
        }
        
        // Nettoyer l'ID (supprimer les caractères spéciaux)
        $sanitized = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
        
        // Journaliser si l'ID a été modifié
        if ($sanitized !== $userId) {
            error_log("RequestHandler::sanitizeUserId - ID nettoyé: {$userId} -> {$sanitized}");
        }
        
        return $sanitized;
    }
    
    /**
     * Obtient et nettoie l'ID utilisateur à partir des en-têtes ou des paramètres
     */
    public static function getUserId() {
        // Essayer d'obtenir l'utilisateur à partir des en-têtes
        $headers = getallheaders();
        if (isset($headers['X-Forced-DB-User'])) {
            return self::sanitizeUserId($headers['X-Forced-DB-User']);
        }
        
        // Essayer d'obtenir l'utilisateur à partir des paramètres GET
        if (isset($_GET['userId'])) {
            return self::sanitizeUserId($_GET['userId']);
        }
        
        // Essayer d'obtenir l'utilisateur à partir des paramètres POST
        if (isset($_POST['userId'])) {
            return self::sanitizeUserId($_POST['userId']);
        }
        
        // Si aucun ID utilisateur n'est trouvé, utiliser p71x6d_richard par défaut
        error_log("RequestHandler::getUserId - Aucun ID utilisateur trouvé, utilisation de p71x6d_richard par défaut");
        return 'p71x6d_richard';
    }
}
?>
