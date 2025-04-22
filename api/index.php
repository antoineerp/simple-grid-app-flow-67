
<?php
// Définir explicitement l'encodage UTF-8
header('Content-Type: application/json; charset=utf-8');
mb_internal_encoding('UTF-8');

// Point d'entrée principal de l'API
require_once 'config/env.php';

// Journaliser la méthode et l'URL de la requête
error_log('API Request: ' . $_SERVER['REQUEST_METHOD'] . ' ' . $_SERVER['REQUEST_URI']);

// CORS - Accepter toutes les origines
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: OPTIONS,GET,POST,PUT,DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Réponse pour les requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit(json_encode(['status' => 200, 'message' => 'Preflight OK']));
}

// URL de la requête
$request_uri = $_SERVER['REQUEST_URI'];
$request_uri = strtok($request_uri, '?');
$url_segments = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));

// Journalisation des segments d'URL
error_log('URL complète: ' . $request_uri);
error_log('URL segments: ' . print_r($url_segments, true));

// Vérifier si la requête est pour auth.php directement
if (strpos($request_uri, 'auth.php') !== false) {
    error_log('Requête d\'authentification directe détectée');
    require_once 'controllers/AuthController.php';
    exit;
}

// Vérifier si le segment "auth" est présent
foreach ($url_segments as $segment) {
    if ($segment === 'auth' || $segment === 'auth.php' || $segment === 'login') {
        error_log('Requête d\'authentification détectée via segment: ' . $segment);
        require_once 'controllers/AuthController.php';
        exit;
    }
}

// Trouver le point d'entrée de l'API
$api_index = array_search('api', $url_segments);
if ($api_index !== false) {
    $segments = array_slice($url_segments, $api_index + 1);
    
    error_log('API segments: ' . print_r($segments, true));
    
    if (count($segments) > 0) {
        $endpoint = $segments[0];
        
        try {
            switch ($endpoint) {
                case 'login':
                case 'auth':
                case 'auth.php':
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
                    echo json_encode(['message' => 'Endpoint non trouvé: ' . $endpoint, 'status' => 404], JSON_UNESCAPED_UNICODE);
                    break;
            }
        } catch (Exception $e) {
            error_log("Erreur API: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'message' => 'Erreur serveur', 
                'error' => $e->getMessage(),
                'status' => 500
            ], JSON_UNESCAPED_UNICODE);
        }
    } else {
        // Point d'entrée API - test de disponibilité
        http_response_code(200);
        echo json_encode([
            'message' => 'API PHP disponible',
            'status' => 200,
            'environment' => 'production'
        ], JSON_UNESCAPED_UNICODE);
    }
} else {
    http_response_code(404);
    echo json_encode(['message' => 'API non trouvée', 'status' => 404], JSON_UNESCAPED_UNICODE);
}
