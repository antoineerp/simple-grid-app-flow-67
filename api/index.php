
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

// Fonction pour envoyer une réponse JSON avec gestion d'erreur
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }
    
    // S'assurer que la réponse est toujours en JSON valide
    if (!is_string($data)) {
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
    } else {
        echo $data;
    }
    exit;
}

// Réponse pour les requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    sendJsonResponse(['status' => 200, 'message' => 'Preflight OK']);
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
    try {
        require_once 'controllers/AuthController.php';
    } catch (Exception $e) {
        error_log('Erreur critique dans l\'authentification: ' . $e->getMessage());
        sendJsonResponse([
            'status' => 500, 
            'message' => 'Erreur serveur d\'authentification', 
            'error' => $e->getMessage()
        ], 500);
    }
    exit;
}

// Vérifier si le segment "auth" est présent
foreach ($url_segments as $segment) {
    if ($segment === 'auth' || $segment === 'auth.php' || $segment === 'login') {
        error_log('Requête d\'authentification détectée via segment: ' . $segment);
        try {
            require_once 'controllers/AuthController.php';
        } catch (Exception $e) {
            error_log('Erreur critique dans l\'authentification via segment: ' . $e->getMessage());
            sendJsonResponse([
                'status' => 500, 
                'message' => 'Erreur serveur d\'authentification', 
                'error' => $e->getMessage()
            ], 500);
        }
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
                    sendJsonResponse([
                        'message' => 'Endpoint non trouvé: ' . $endpoint, 
                        'status' => 404
                    ], 404);
                    break;
            }
        } catch (Exception $e) {
            error_log("Erreur API: " . $e->getMessage());
            sendJsonResponse([
                'message' => 'Erreur serveur', 
                'error' => $e->getMessage(),
                'status' => 500
            ], 500);
        }
    } else {
        // Point d'entrée API - test de disponibilité
        sendJsonResponse([
            'message' => 'API PHP disponible',
            'status' => 200,
            'environment' => 'production'
        ]);
    }
} else {
    sendJsonResponse(['message' => 'API non trouvée', 'status' => 404], 404);
}
