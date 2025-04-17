
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
header("Access-Control-Allow-Methods: GET");
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

// Détermininer la méthode de requête
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Instancier la base de données
    $database = new Database();
    
    try {
        // Essayer de se connecter
        $conn = $database->getConnection();
        
        if ($conn) {
            // Tester la connexion avec une requête simple
            $stmt = $conn->query("SELECT 1");
            
            if ($stmt) {
                // Collecter des informations sur la base de données
                $dbInfo = [];
                
                try {
                    // Obtenir la liste des tables
                    $tablesStmt = $conn->query("SHOW TABLES");
                    $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);
                    
                    // Obtenir la taille de la base de données
                    $sizeStmt = $conn->query("
                        SELECT 
                            SUM(data_length + index_length) as size,
                            COUNT(*) as table_count
                        FROM 
                            information_schema.TABLES 
                        WHERE 
                            table_schema = '" . $database->getConfig()['db_name'] . "'
                    ");
                    $sizeInfo = $sizeStmt->fetch(PDO::FETCH_ASSOC);
                    
                    // Convertir la taille en MB
                    $sizeMB = round($sizeInfo['size'] / (1024 * 1024), 2) . ' MB';
                    
                    // Vérifier l'encodage de la base de données
                    $encodingStmt = $conn->query("
                        SELECT default_character_set_name, default_collation_name
                        FROM information_schema.SCHEMATA
                        WHERE schema_name = '" . $database->getConfig()['db_name'] . "'
                    ");
                    $encodingInfo = $encodingStmt->fetch(PDO::FETCH_ASSOC);
                    
                    // La connexion est établie et la requête a fonctionné
                    http_response_code(200);
                    echo json_encode([
                        "message" => "Connexion réussie à la base de données",
                        "status" => "success",
                        "info" => [
                            "database_name" => $database->getConfig()['db_name'],
                            "host" => $database->getConfig()['host'],
                            "tables" => $tables,
                            "table_count" => count($tables),
                            "size" => $sizeMB,
                            "encoding" => $encodingInfo['default_character_set_name'] ?? 'unknown',
                            "collation" => $encodingInfo['default_collation_name'] ?? 'unknown'
                        ]
                    ], JSON_UNESCAPED_UNICODE);
                } catch (Exception $e) {
                    // La connexion est établie mais il y a un problème avec les requêtes supplémentaires
                    http_response_code(200);
                    echo json_encode([
                        "message" => "Connexion réussie à la base de données",
                        "status" => "warning",
                        "info" => [
                            "database_name" => $database->getConfig()['db_name'],
                            "host" => $database->getConfig()['host'],
                            "error_details" => $e->getMessage()
                        ]
                    ], JSON_UNESCAPED_UNICODE);
                }
            } else {
                throw new Exception("Impossible d'exécuter une requête de test");
            }
        } else {
            throw new Exception("Impossible d'établir une connexion");
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "message" => "Échec de la connexion à la base de données",
            "error" => $e->getMessage(),
            "status" => "error"
        ], JSON_UNESCAPED_UNICODE);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Méthode non autorisée"], JSON_UNESCAPED_UNICODE);
}
?>
