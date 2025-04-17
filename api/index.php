
<?php
// Définir explicitement l'encodage UTF-8
header('Content-Type: application/json; charset=utf-8');
mb_internal_encoding('UTF-8');

// Point d'entrée principal de l'API
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

// Journaliser les informations de la requête
error_log('API Request: ' . $_SERVER['REQUEST_METHOD'] . ' ' . $_SERVER['REQUEST_URI']);

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
    header("Access-Control-Allow-Origin: *"); // En mode d'aperçu, permettre toutes les origines
}

// Autres en-têtes CORS et cache
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: OPTIONS,GET,POST,PUT,DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Log des requêtes pour le débogage en développement
if ($environment === 'development') {
    error_log("Requête reçue : " . $_SERVER['REQUEST_METHOD'] . " " . $_SERVER['REQUEST_URI']);
}

// Réponse pour les requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit;
}

// URL de la requête
$request_uri = $_SERVER['REQUEST_URI'];
$request_uri = strtok($request_uri, '?');
$url_segments = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));

// Journalisation des segments d'URL pour le débogage
error_log('URL segments: ' . print_r($url_segments, true));

// Trouver le point d'entrée de l'API
$api_index = array_search('api', $url_segments);
if ($api_index !== false) {
    $segments = array_slice($url_segments, $api_index + 1);
    
    error_log('API segments: ' . print_r($segments, true));
    
    if (!empty($segments[0]) && $segments[0] === 'login') {
        error_log('Requête de connexion détectée');
        require_once 'controllers/AuthController.php';
        exit;
    }
    
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
                    echo json_encode(['message' => 'Endpoint non trouvé: ' . $endpoint, 'status' => 404]);
                    break;
            }
        } catch (Exception $e) {
            error_log("Erreur API: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'message' => 'Erreur serveur', 
                'error' => $e->getMessage(),
                'status' => 500
            ]);
        }
    } else {
        // Point d'entrée API - test de disponibilité
        http_response_code(200);
        echo json_encode([
            'message' => 'API PHP disponible',
            'status' => 200,
            'environment' => $environment
        ]);
    }
} else {
    http_response_code(404);
    echo json_encode(['message' => 'API non trouvée', 'status' => 404]);
}
