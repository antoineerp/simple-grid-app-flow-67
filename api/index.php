
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Vérifier si nous sommes dans un environnement de production ou de développement
$is_production = (getenv('APP_ENV') === 'production' || !getenv('APP_ENV'));

// Activer l'affichage des erreurs en développement
if (!$is_production) {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
} else {
    // En production, journaliser les erreurs mais ne pas les afficher
    ini_set('display_errors', 0);
    error_reporting(E_ALL);
    ini_set('log_errors', 1);
    ini_set('error_log', 'php_errors.log');
}

// Définir les headers communs
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
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
$api_path = parse_url($request_uri, PHP_URL_PATH);
error_log("API Path: " . $api_path);

// Vérifier directement pour les fichiers documents-load.php et documents-sync.php
if (strpos($api_path, '/api/documents-load.php') !== false) {
    error_log("Route documents-load.php détectée, inclusion directe");
    require_once 'documents-load.php';
    exit;
}

if (strpos($api_path, '/api/documents-sync.php') !== false) {
    error_log("Route documents-sync.php détectée, inclusion directe");
    require_once 'documents-sync.php';
    exit;
}

if (strpos($api_path, '/api/bibliotheque-load.php') !== false) {
    error_log("Route bibliotheque-load.php détectée, inclusion directe");
    require_once 'bibliotheque-load.php';
    exit;
}

if (strpos($api_path, '/api/bibliotheque-sync.php') !== false) {
    error_log("Route bibliotheque-sync.php détectée, inclusion directe");
    require_once 'bibliotheque-sync.php';
    exit;
}

// Normaliser le chemin de l'API
$base_path = '/api/';
// Dans certaines configurations, le chemin pourrait être différent
if (strpos($request_uri, 'api/index.php') !== false) {
    $base_path = '/api/index.php/';
}

// Gérer les paramètres de requête
$query_string = parse_url($request_uri, PHP_URL_QUERY);
$is_test_request = false;

// Vérifier si c'est une requête de test
if ($query_string && strpos($query_string, 'test=1') !== false) {
    $is_test_request = true;
}

// Si nous sommes sur l'URL racine de l'API (avec ou sans index.php) ou une requête de test, renvoyer un message de base
if ($is_test_request || $request_uri == '/api/' || $request_uri == '/api/index.php' || $request_uri == '/api/index.php/') {
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

// Définir une fonction pour nettoyer les données UTF-8
if (!function_exists('cleanUTF8')) {
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
}

// Routage des requêtes
// Nettoyer le chemin pour obtenir la route demandée
$path = preg_replace([
    '~^/api/index\.php/~',
    '~^/api/~'
], '', parse_url($request_uri, PHP_URL_PATH));
$path = rtrim(strtok($path, '?'), '/');
$segments = explode('/', $path);

// Déterminer le contrôleur à partir du premier segment
$controller = !empty($segments[0]) ? $segments[0] : 'index';

// Journaliser la requête
error_log("API Controller: $controller | Method: " . $_SERVER['REQUEST_METHOD'] . " | URI: $request_uri | Path: $path");

// Ajouter un point d'accès spécial pour les utilisateurs
if ($controller == 'utilisateurs') {
    error_log("Accès à la route utilisateurs");
    
    // Chemin complet du contrôleur d'utilisateurs
    $userControllerPath = __DIR__ . '/controllers/UsersController.php';
    
    // Vérifier que le fichier existe
    if (file_exists($userControllerPath)) {
        error_log("Fichier contrôleur utilisateurs trouvé: $userControllerPath");
        define('DIRECT_ACCESS_CHECK', true);
        require_once $userControllerPath;
        exit;
    } else {
        error_log("ERREUR: Fichier contrôleur utilisateurs NON trouvé: $userControllerPath");
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Fichier contrôleur utilisateurs non trouvé',
            'path' => $userControllerPath
        ]);
        exit;
    }
}

// Router vers le bon fichier en fonction du contrôleur
switch ($controller) {
    case 'auth':
        require_once 'controllers/AuthController.php';
        break;
        
    case 'login-test':
        require_once 'login-test.php';
        break;
        
    case 'database-test':
        require_once 'database-test.php';
        break;
        
    case 'db-connection-test':
        require_once 'db-connection-test.php';
        break;
        
    case 'database-config':
        require_once 'database-config.php';
        break;
        
    case 'direct-db-test':
    case 'direct-db-test.php':
        require_once 'direct-db-test.php';
        break;
        
    case 'check-users':
    case 'check-users.php':
        require_once 'check-users.php';
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
        // Si le contrôleur n'est pas reconnu, vérifier si un fichier PHP correspondant existe
        $controller_file = $controller . '.php';
        if (file_exists($controller_file)) {
            require_once $controller_file;
        } else {
            // Aucune route correspondante trouvée
            error_log("Route non trouvée: $path [$controller]");
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
