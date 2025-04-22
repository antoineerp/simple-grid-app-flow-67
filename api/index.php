
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Vérifier si nous sommes dans un environnement de production ou de développement
$is_production = (getenv('APP_ENV') === 'production' || !getenv('APP_ENV'));

// Activer l'affichage des erreurs en développement
if (!$is_production) {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
}

// Définir les headers communs
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Obtenir le chemin de la requête
$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/api/';

// Si nous sommes sur l'URL racine de l'API, renvoyer un message de base
if ($request_uri == $base_path || $request_uri == $base_path . 'index.php') {
    http_response_code(200);
    echo json_encode([
        'message' => 'API PHP disponible',
        'status' => 200,
        'environment' => $is_production ? 'production' : 'development',
        'server_info' => [
            'host' => $_SERVER['SERVER_NAME'],
            'uri' => $_SERVER['REQUEST_URI'],
            'script' => $_SERVER['SCRIPT_NAME']
        ]
    ]);
    exit;
}

// Routage des requêtes
$path = str_replace($base_path, '', parse_url($request_uri, PHP_URL_PATH));
$path = trim($path, '/');
$segments = explode('/', $path);

// Déterminer le contrôleur à partir du premier segment
$controller = !empty($segments[0]) ? $segments[0] : 'index';

// Journaliser la requête
error_log("API Request: $controller | Method: " . $_SERVER['REQUEST_METHOD'] . " | URI: $request_uri");

// Router vers le bon fichier en fonction du contrôleur
switch ($controller) {
    case 'auth':
        require_once 'auth.php';
        break;
        
    case 'login-test':
        require_once 'login-test.php';
        break;
        
    case 'database-test':
        require_once 'database-test.php';
        break;
        
    case 'database-config':
        require_once 'database-config.php';
        break;
        
    case 'utilisateurs':
        require_once 'controllers/UsersController.php';
        break;
        
    default:
        // Si le contrôleur n'est pas reconnu, vérifier si un fichier PHP correspondant existe
        $controller_file = $controller . '.php';
        if (file_exists($controller_file)) {
            require_once $controller_file;
        } else {
            // Aucune route correspondante trouvée
            http_response_code(404);
            echo json_encode([
                'message' => 'Route non trouvée: ' . $path,
                'status' => 404
            ]);
        }
        break;
}

// Vider le tampon de sortie
ob_end_flush();
?>
