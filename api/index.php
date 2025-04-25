<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Vérifier si nous sommes dans un environnement de production
$is_production = true;

// En production, journaliser les erreurs mais ne pas les afficher
ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', 'php_errors.log');

// Définir les headers communs
header("Content-Type: application/json; charset=UTF-8");
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
        
    case 'database-test':
    case 'db-test':
    case 'db-connection-test':
        require_once 'db-connection-test.php';
        break;
        
    case 'utilisateurs':
        if (file_exists('controllers/UsersController.php')) {
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
        
    // Ajouter des cas explicites pour les fichiers de documents
    case 'documents-load':
    case 'documents-load.php':
        require_once 'documents-load.php';
        break;
        
    case 'documents-sync':
    case 'documents-sync.php':
        require_once 'documents-sync.php';
        break;
        
    // Ajouter des cas explicites pour les fichiers de bibliothèque
    case 'bibliotheque-load':
    case 'bibliotheque-load.php':
        require_once 'bibliotheque-load.php';
        break;
        
    case 'bibliotheque-sync':
    case 'bibliotheque-sync.php':
        require_once 'bibliotheque-sync.php';
        break;
        
    // Ajouter un cas explicite pour login-test.php au cas où il serait appelé directement
    case 'login-test.php':
        require_once 'login-test.php';
        break;
        
    // Ajouter un cas explicite pour test.php car il manque peut-être aussi
    case 'test':
    case 'test.php':
        require_once 'test.php';
        break;
        
    // Ajouter un cas explicite pour phpinfo.php et info.php
    case 'phpinfo':
    case 'phpinfo.php':
        require_once 'phpinfo.php';
        break;
        
    case 'info':
    case 'info.php':
        require_once 'info.php';
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
