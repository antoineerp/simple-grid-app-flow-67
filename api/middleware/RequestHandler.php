
<?php
class RequestHandler {
    public static function handleCORS() {
        // S'assurer que le content type est correctement défini
        header("Content-Type: application/json; charset=UTF-8");
        
        // Activer les CORS pour toutes les origines
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

        // Si c'est une requête OPTIONS (preflight), nous la terminons ici
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            http_response_code(200);
            echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
            exit;
        }
    }

    public static function cleanUTF8($input) {
        if (is_string($input)) {
            return mb_convert_encoding($input, 'UTF-8', 'UTF-8');
        } elseif (is_array($input)) {
            foreach ($input as $key => $value) {
                $input[$key] = self::cleanUTF8($value);
            }
        }
        return $input;
    }
    
    // Fonction de validation des données JSON
    public static function validateJsonRequest() {
        $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
        
        if (strpos($contentType, 'application/json') === false && $_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(415);
            echo json_encode([
                'status' => 'error',
                'message' => 'Content-Type doit être application/json'
            ], JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
            exit;
        }
        
        // Pour les méthodes POST, PUT, PATCH
        if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
            $json = file_get_contents('php://input');
            if (empty($json)) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Aucune donnée JSON reçue'
                ], JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
                exit;
            }
            
            $data = json_decode($json);
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'JSON invalide: ' . json_last_error_msg()
                ], JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
                exit;
            }
            
            return $data;
        }
        
        return null;
    }
}
?>
