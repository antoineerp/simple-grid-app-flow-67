
<?php
/**
 * Classe utilitaire pour la gestion des requêtes HTTP
 */
class RequestHandler {
    /**
     * Définit les en-têtes standard pour les endpoints API
     * 
     * @param string $allowedMethods Méthodes HTTP autorisées (ex: "GET, POST, OPTIONS")
     * @param int $maxAge Durée maximale de mise en cache des préflight (en secondes)
     */
    public static function setStandardHeaders($allowedMethods = "GET, POST, OPTIONS", $maxAge = 3600) {
        // Entêtes CORS standard
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: $allowedMethods");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Device-ID");
        header("Access-Control-Max-Age: $maxAge");
        
        // Entêtes Content-Type standard
        header("Content-Type: application/json; charset=UTF-8");
        
        // Désactiver le cache pour les API dynamiques
        header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
        header("Pragma: no-cache");
        header("Expires: 0");
    }
    
    /**
     * Gère les requêtes OPTIONS pour le CORS preflight
     */
    public static function handleOptionsRequest() {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }
    
    /**
     * Sanitize l'ID utilisateur
     * 
     * @param string $userId ID utilisateur à sanitizer
     * @return string ID utilisateur sanitizé
     */
    public static function sanitizeUserId($userId) {
        if (!$userId) {
            throw new Exception("ID utilisateur invalide");
        }
        
        // Si c'est un objet, tenter d'extraire l'ID
        if (is_array($userId)) {
            if (isset($userId['identifiant_technique'])) {
                $userId = $userId['identifiant_technique'];
            } else if (isset($userId['id'])) {
                $userId = $userId['id'];
            }
        }
        
        // Convertir en string et nettoyer
        $userId = (string)$userId;
        return preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    }
    
    /**
     * Vérifie si un utilisateur est autorisé à accéder à une ressource
     * 
     * @param string $requestUserId ID utilisateur de la requête
     * @param string $resourceUserId ID utilisateur de la ressource
     * @return bool True si l'accès est autorisé
     */
    public static function authorizeAccess($requestUserId, $resourceUserId) {
        // Dans cette version simple, vérifie juste si les IDs correspondent
        // Dans une version plus complète, on pourrait vérifier les rôles, etc.
        return $requestUserId === $resourceUserId;
    }
    
    /**
     * Génère une réponse d'erreur et termine l'exécution
     * 
     * @param string $message Message d'erreur
     * @param int $code Code HTTP d'erreur
     */
    public static function sendError($message, $code = 400) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'code' => $code
        ]);
        exit;
    }
    
    /**
     * Génère une réponse de succès
     * 
     * @param array $data Données à retourner
     * @param string $message Message de succès optionnel
     */
    public static function sendSuccess($data, $message = null) {
        $response = [
            'success' => true,
            'timestamp' => date('c')
        ];
        
        if ($message) {
            $response['message'] = $message;
        }
        
        if (is_array($data)) {
            $response = array_merge($response, $data);
        } else {
            $response['data'] = $data;
        }
        
        echo json_encode($response);
    }
}
