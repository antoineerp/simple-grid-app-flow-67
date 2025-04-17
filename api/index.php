
<?php
// Point d'entrée principal de l'API
// Headers CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: OPTIONS,GET,POST,PUT,DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

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
        
        switch ($endpoint) {
            case 'login':
                require_once 'controllers/AuthController.php';
                break;
                
            case 'utilisateurs':
                require_once 'controllers/UserController.php';
                break;
                
            default:
                http_response_code(404);
                echo json_encode(['message' => 'Endpoint non trouvé']);
                break;
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
