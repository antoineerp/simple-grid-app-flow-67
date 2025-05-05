
<?php
class RequestHandler {
    /**
     * Gère les en-têtes CORS et les requêtes preflight
     */
    public static function handleCORS() {
        // Définir les en-têtes CORS
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Cache-Control: no-cache, no-store, must-revalidate");
        
        // Si c'est une requête OPTIONS (preflight), nous la terminons ici
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            http_response_code(200);
            echo json_encode(['status' => 'success', 'message' => 'Preflight request accepted']);
            exit;
        }
    }
    
    /**
     * Parse et valide les données JSON de la requête
     * 
     * @return object|null Données JSON décodées ou null en cas d'erreur
     */
    public static function getJsonData() {
        // Récupérer le contenu brut de la requête
        $json = file_get_contents('php://input');
        
        if (empty($json)) {
            return null;
        }
        
        // Décoder le JSON
        $data = json_decode($json);
        
        // Vérifier si le décodage a réussi
        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }
        
        return $data;
    }
    
    /**
     * Nettoie et désinfecte une entrée
     * 
     * @param mixed $input L'entrée à nettoyer
     * @return mixed L'entrée nettoyée
     */
    public static function sanitizeInput($input) {
        if (is_array($input)) {
            foreach ($input as $key => $value) {
                $input[$key] = self::sanitizeInput($value);
            }
            return $input;
        }
        
        // Pour les chaînes, appliquer une désinfection
        if (is_string($input)) {
            // Supprimer les balises HTML, PHP et les caractères potentiellement malveillants
            $input = strip_tags($input);
            // Convertir les caractères spéciaux en entités HTML
            $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
        }
        
        return $input;
    }
}
?>
