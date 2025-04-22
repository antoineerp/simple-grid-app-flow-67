
<?php
// Définir explicitement l'encodage UTF-8
header('Content-Type: application/json; charset=utf-8');
mb_internal_encoding('UTF-8');

// Journaliser les informations sur la requête pour le diagnostic
error_log('=== NOUVELLE REQUÊTE API ===');
error_log('Méthode: ' . $_SERVER['REQUEST_METHOD'] . ' - URI: ' . $_SERVER['REQUEST_URI']);
error_log('Host: ' . $_SERVER['HTTP_HOST']);
error_log('Script name: ' . $_SERVER['SCRIPT_NAME']);

// Point d'entrée principal de l'API
require_once 'config/env.php';

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

// Nettoyage du chemin pour les installations dans sous-dossiers (spécifique à Infomaniak)
if (strpos($request_uri, '/sites/qualiopi.ch/api/') !== false) {
    $request_uri = str_replace('/sites/qualiopi.ch/api/', '/api/', $request_uri);
    error_log('URI nettoyée (sous-dossier Infomaniak): ' . $request_uri);
}

$url_segments = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));

// Journalisation des segments d'URL
error_log('URL complète: ' . $request_uri);
error_log('URL segments: ' . print_r($url_segments, true));

// Vérifier les noms de fichiers spécifiques directement demandés
$filename = basename($request_uri);
if (in_array($filename, ['auth.php', 'login-test.php', 'check-users.php'])) {
    error_log('Accès direct au fichier détecté: ' . $filename);
    $file_path = __DIR__ . '/' . $filename;
    
    if (file_exists($file_path)) {
        error_log('Fichier trouvé, inclusion directe: ' . $file_path);
        include_once $file_path;
        exit;
    } else {
        error_log('ERREUR: Fichier non trouvé: ' . $file_path);
        http_response_code(404);
        echo json_encode(['message' => 'Fichier non trouvé: ' . $filename, 'status' => 404], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Vérifier si la requête est pour auth.php directement
if (strpos($request_uri, 'auth.php') !== false || strpos($request_uri, 'auth') !== false) {
    error_log('Requête d\'authentification détectée');
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
            'environment' => 'production',
            'server_info' => [
                'host' => $_SERVER['HTTP_HOST'],
                'uri' => $_SERVER['REQUEST_URI'],
                'script' => $_SERVER['SCRIPT_NAME']
            ]
        ], JSON_UNESCAPED_UNICODE);
    }
} else {
    http_response_code(404);
    echo json_encode(['message' => 'API non trouvée', 'status' => 404], JSON_UNESCAPED_UNICODE);
}
