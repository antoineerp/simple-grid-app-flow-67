
<?php
// Inclure la configuration d'environnement
require_once 'config/env.php';

// Définir explicitement le type de contenu pour les scripts PHP
header("Content-Type: application/json; charset=UTF-8");

// Désactiver la mise en cache
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Définir les headers CORS appropriés
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$allowedOrigins = [
    'https://qualiopi.ch',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080'
];

// Mode développement: autoriser toutes les origines
if (env('APP_ENV') === 'development') {
    header("Access-Control-Allow-Origin: *");
} elseif (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    header("Access-Control-Allow-Origin: https://qualiopi.ch");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Journaliser la requête
error_log("API Request: " . $_SERVER['REQUEST_URI'] . " | Method: " . $_SERVER['REQUEST_METHOD']);

// Obtenir le chemin de la requête
$request_uri = $_SERVER['REQUEST_URI'];
$path = trim(parse_url($request_uri, PHP_URL_PATH), '/');
$path = preg_replace('#^api/#', '', $path);
$segments = explode('/', $path);
$controller = !empty($segments[0]) ? $segments[0] : 'index';

// Nettoyer le nom du contrôleur
$controller = str_replace('.php', '', $controller);
error_log("Controller resolved: " . $controller);

// Router vers le bon fichier en fonction du contrôleur
switch ($controller) {
    case 'auth':
        require_once 'controllers/AuthController.php';
        break;
        
    case 'db-test':
    case 'db-connection-test':
    case 'database-test':
        require_once 'db-connection-test.php';
        break;
        
    case 'database-config':
        require_once 'database-config.php';
        break;
        
    case 'utilisateurs':
    case 'check-users':
        if (file_exists('controllers/UsersController.php')) {
            define('DIRECT_ACCESS_CHECK', true);
            require_once 'controllers/UsersController.php';
        } else if (file_exists('check-users.php')) {
            require_once 'check-users.php';
        } else {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Contrôleur utilisateurs non trouvé'
            ]);
        }
        break;
        
    case 'documents-load':
        if (file_exists('documents-load.php')) {
            require_once 'documents-load.php';
        } else {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'Endpoint documents-load.php non trouvé'
            ]);
        }
        break;
        
    case 'documents-sync':
        if (file_exists('documents-sync.php')) {
            require_once 'documents-sync.php';
        } else {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'Endpoint documents-sync.php non trouvé'
            ]);
        }
        break;
                
    case 'json-test':
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'success',
            'message' => 'Test JSON réussi',
            'timestamp' => time()
        ]);
        break;
        
    default:
        // Vérifier d'abord si un fichier existe directement
        if (file_exists($controller . '.php')) {
            error_log("Loading direct file: " . $controller . '.php');
            require_once $controller . '.php';
        }
        // Vérifier si un fichier existe dans le dossier controllers
        else if (file_exists('controllers/' . ucfirst($controller) . 'Controller.php')) {
            error_log("Loading controller: controllers/" . ucfirst($controller) . 'Controller.php');
            require_once 'controllers/' . ucfirst($controller) . 'Controller.php';
        }
        // Si aucun fichier n'est trouvé
        else {
            error_log("Route not found: " . $path);
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'Route non trouvée: ' . $path,
                'controller_requested' => $controller,
                'file_checked_1' => $controller . '.php',
                'file_checked_2' => 'controllers/' . ucfirst($controller) . 'Controller.php'
            ]);
        }
        break;
}
?>
