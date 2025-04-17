
<?php
// Inclure notre fichier de configuration d'environnement s'il n'est pas déjà inclus
if (!function_exists('env')) {
    require_once '../config/env.php';
}

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
    header("Access-Control-Allow-Origin: " . $allowedOrigins['production']);
}

// Autres en-têtes CORS
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit;
}

// Inclusion des fichiers nécessaires
include_once '../config/database.php';
include_once '../middleware/Auth.php';

// Récupérer les en-têtes pour l'authentification
$allHeaders = apache_request_headers();
$auth = new Auth($allHeaders);

// Vérifier si l'utilisateur est authentifié
$userData = $auth->isAuth();

// Si l'utilisateur n'est pas authentifié
if (!$userData) {
    http_response_code(401);
    echo json_encode(["message" => "Accès non autorisé"], JSON_UNESCAPED_UNICODE);
    exit;
}

// Vérifier si l'utilisateur est administrateur
if ($userData['data']['role'] !== 'administrateur' && $userData['data']['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["message" => "Permission refusée"], JSON_UNESCAPED_UNICODE);
    exit;
}

// Instancier l'objet Database
$database = new Database();

// Fonction pour vérifier si une base de données existe
function databaseExists($host, $username, $password, $dbName) {
    try {
        // Tenter de se connecter au serveur MySQL sans spécifier de base de données
        $conn = new PDO("mysql:host=$host", $username, $password);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Vérifier si la base de données existe
        $stmt = $conn->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$dbName'");
        return $stmt->rowCount() > 0;
    } catch (PDOException $e) {
        return false;
    }
}

// Détermininer la méthode de requête
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Récupérer la configuration actuelle
        $config = $database->getConfig();
        
        // Masquer le mot de passe pour la sécurité
        $config['password'] = "********";
        
        // Ajouter une liste des bases de données disponibles si possible
        try {
            $conn = new PDO(
                "mysql:host=" . $config['host'],
                $config['username'],
                $database->getConfig()['password']
            );
            $stmt = $conn->query("SHOW DATABASES");
            $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Filtrer les bases de données système
            $databases = array_filter($databases, function($db) {
                return $db != 'information_schema' && $db != 'performance_schema' && 
                       $db != 'mysql' && $db != 'sys';
            });
            
            $config['available_databases'] = array_values($databases);
        } catch (PDOException $e) {
            // Si on ne peut pas récupérer la liste, on l'ignore simplement
            $config['available_databases'] = [];
        }
        
        http_response_code(200);
        echo json_encode($config, JSON_UNESCAPED_UNICODE);
        break;
        
    case 'POST':
        // Obtenir les données postées et assurer qu'elles sont en UTF-8
        $json_input = file_get_contents("php://input");
        $data = json_decode(cleanUTF8($json_input), true);
        
        if (
            isset($data['host']) && 
            isset($data['db_name']) && 
            isset($data['username']) && 
            isset($data['password'])
        ) {
            // Récupérer la configuration actuelle pour comparer
            $currentConfig = $database->getConfig();
            
            // Ne mettre à jour le mot de passe que s'il n'est pas masqué
            if ($data['password'] === "********") {
                $data['password'] = $currentConfig['password'];
            }
            
            // Vérifier si la base de données a changé
            $dbChanged = $currentConfig['db_name'] !== $data['db_name'];
            
            // Si la base de données a changé, vérifier si elle existe
            if ($dbChanged) {
                if (!databaseExists($data['host'], $data['username'], $data['password'], $data['db_name'])) {
                    http_response_code(400);
                    echo json_encode([
                        "message" => "La base de données spécifiée n'existe pas ou n'est pas accessible.",
                        "status" => "error"
                    ], JSON_UNESCAPED_UNICODE);
                    exit;
                }
            }
            
            // Mettre à jour la configuration
            if ($database->updateConfig(
                $data['host'],
                $data['db_name'],
                $data['username'],
                $data['password']
            )) {
                http_response_code(200);
                echo json_encode([
                    "message" => "Configuration de la base de données mise à jour avec succès",
                    "database_changed" => $dbChanged,
                    "new_database" => $data['db_name']
                ], JSON_UNESCAPED_UNICODE);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Erreur lors de la mise à jour de la configuration"], JSON_UNESCAPED_UNICODE);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Données incomplètes"], JSON_UNESCAPED_UNICODE);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["message" => "Méthode non autorisée"], JSON_UNESCAPED_UNICODE);
        break;
}
?>
