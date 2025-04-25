
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Définir explicitement le type de contenu pour les scripts PHP
header("Content-Type: application/json; charset=UTF-8");

// Définir les headers communs
header("Access-Control-Allow-Origin: https://qualiopi.ch");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

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
        
    case 'utilisateurs':
    case 'check-users':
        if (file_exists('check-users.php')) {
            require_once 'check-users.php';
        } else if (file_exists('controllers/UsersController.php')) {
            define('DIRECT_ACCESS_CHECK', true);
            require_once 'controllers/UsersController.php';
        } else {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Contrôleur utilisateurs non trouvé'
            ]);
        }
        break;
        
    case 'documents-load':
        require_once 'documents-load.php';
        break;
        
    case 'documents-sync':
        require_once 'documents-sync.php';
        break;
        
    case 'bibliotheque-load':
        require_once 'bibliotheque-load.php';
        break;
        
    case 'bibliotheque-sync':
        require_once 'bibliotheque-sync.php';
        break;
        
    case 'config':
        require_once 'config.php';
        break;
        
    case 'phpinfo':
        require_once 'phpinfo.php';
        break;
        
    case 'info':
        require_once 'info.php';
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
        $controller_file = $controller . '.php';
        if (file_exists($controller_file)) {
            require_once $controller_file;
        } else {
            http_response_code(404);
            echo json_encode([
                'message' => 'Route non trouvée: ' . $path,
                'status' => 404,
                'controller_requested' => $controller,
                'file_checked' => $controller_file
            ]);
        }
        break;
}

// Vider le tampon de sortie
ob_end_flush();
?>
