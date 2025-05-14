
<?php
/**
 * Classe utilitaire pour la standardisation des en-têtes CORS
 */
class CorsHelper {
    /**
     * Configure les en-têtes CORS standard pour toutes les requêtes API
     * 
     * @param string $allowedOrigin Origine autorisée (par défaut "*" pour toutes)
     * @param string $allowedMethods Méthodes HTTP autorisées
     */
    public static function configureCors($allowedOrigin = "*", $allowedMethods = "GET, POST, PUT, DELETE, OPTIONS") {
        // Nettoyer tout buffer de sortie existant pour éviter les problèmes d'en-têtes
        if (ob_get_level()) ob_clean();
        
        // Définir l'origine autorisée (peut être dynamique)
        header("Access-Control-Allow-Origin: $allowedOrigin");
        
        // Méthodes et en-têtes autorisés
        header("Access-Control-Allow-Methods: $allowedMethods");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Device-ID");
        
        // Durée de mise en cache des requêtes preflight
        header("Access-Control-Max-Age: 3600");
        
        // Autoriser l'envoi de cookies
        header("Access-Control-Allow-Credentials: true");
        
        // Anti-cache pour les réponses API
        header("Cache-Control: no-cache, no-store, must-revalidate");
        header("Pragma: no-cache");
        header("Expires: 0");
    }
    
    /**
     * Gérer les requêtes OPTIONS (preflight)
     * 
     * @param bool $exitAfter Si true, termine l'exécution après avoir géré la requête OPTIONS
     */
    public static function handlePreflight($exitAfter = true) {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            if ($exitAfter) exit;
        }
    }
    
    /**
     * Configurer les en-têtes CORS et traiter les requêtes OPTIONS en une seule méthode
     * 
     * @param string $allowedOrigin Origine autorisée
     * @param string $allowedMethods Méthodes HTTP autorisées
     * @param string $contentType Type de contenu (par défaut application/json)
     */
    public static function setupCors($allowedOrigin = "*", $allowedMethods = "GET, POST, PUT, DELETE, OPTIONS", $contentType = "application/json") {
        // Définir le type de contenu
        header("Content-Type: $contentType; charset=UTF-8");
        
        // Configurer les en-têtes CORS
        self::configureCors($allowedOrigin, $allowedMethods);
        
        // Traiter les requêtes OPTIONS
        self::handlePreflight();
    }
    
    /**
     * Vérifier si l'origine est autorisée et renvoyer l'en-tête approprié
     * 
     * @param array $allowedOrigins Liste des origines autorisées
     * @return string L'origine autorisée utilisée
     */
    public static function getAllowedOrigin($allowedOrigins = ['http://localhost:8080', 'https://qualiopi.ch']) {
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        
        if (in_array($origin, $allowedOrigins)) {
            return $origin;
        }
        
        // Origine par défaut si aucune correspondance
        return '*';
    }
}
?>
