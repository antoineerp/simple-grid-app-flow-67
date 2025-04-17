
<?php
// Définir explicitement l'encodage UTF-8
header('Content-Type: application/json; charset=utf-8');
mb_internal_encoding('UTF-8');

// Point d'entrée principal de l'API

// Inclure notre fichier de configuration d'environnement
require_once 'config/env.php';

// Fonction pour nettoyer les données UTF-8
function cleanUTF8($input) {
    if (is_string($input)) {
        return mb_convert_encoding($input, 'UTF-8', 'UTF-8');
    } elseif (is_array($input)) {
        foreach ($input as $key => $value) {
            $input[$key] = cleanUTF8($value);
        }
    }
    return $input;
}

// Déterminer l'environnement
$environment = env('APP_ENV', 'development');

// Configuration des en-têtes CORS selon l'environnement
$allowedOrigins = [
    'development' => env('ALLOWED_ORIGIN_DEV', 'http://localhost:8080'),
    'production' => env('ALLOWED_ORIGIN_PROD', 'https://www.qualiopi.ch')
];

$allowedOrigin = $allowedOrigins[$environment];

// Obtenir l'origine de la requête
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Vérifier si l'origine est autorisée
if ($origin === $allowedOrigin || $environment === 'development') {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: " . $allowedOrigins['production']);
}

// Autres en-têtes CORS
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: OPTIONS,GET,POST,PUT,DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Réponse pour les requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit;
}

// URL de la requête
$request_uri = $_SERVER['REQUEST_URI'];

// Enlever les paramètres de requête
$request_uri = strtok($request_uri, '?');

// Diviser l'URL en segments
$url_segments = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));

// Trouver le point d'entrée de l'API (le segment après 'api')
$api_index = array_search('api', $url_segments);
if ($api_index !== false) {
    // Obtenir les segments après 'api'
    $segments = array_slice($url_segments, $api_index + 1);
    
    // Déterminer l'endpoint et le routage
    if (count($segments) > 0) {
        $endpoint = $segments[0];
        
        try {
            switch ($endpoint) {
                case 'login':
                    require_once 'controllers/AuthController.php';
                    break;
                    
                case 'utilisateurs':
                    require_once 'controllers/UserController.php';
                    break;
                    
                case 'config':
                    require_once 'controllers/ConfigController.php';
                    break;
                    
                default:
                    http_response_code(404);
                    echo json_encode(['message' => 'Endpoint non trouvé']);
                    break;
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Erreur serveur', 'error' => $e->getMessage()]);
        }
    } else {
        // Aucun endpoint spécifié
        http_response_code(200);
        echo json_encode(['message' => 'API PHP fonctionnelle']);
    }
} else {
    // 'api' n'est pas dans l'URL
    http_response_code(404);
    echo json_encode(['message' => 'API non trouvée']);
}
?>
