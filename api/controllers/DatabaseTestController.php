
<?php
// Inclure notre fichier de configuration d'environnement s'il n'est pas déjà inclus
if (!function_exists('env')) {
    require_once '../config/env.php';
}

// Activer la journalisation des erreurs
ini_set('display_errors', 1);
error_reporting(E_ALL);

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

// Autoriser toutes les origines en mode développement
if ($environment === 'development') {
    header("Access-Control-Allow-Origin: *");
} else if ($origin === $allowedOrigin) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: " . $allowedOrigins['production']);
}

// Autres en-têtes CORS
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit;
}

// Journaliser l'exécution
error_log("=== EXÉCUTION DE DATABASE TEST CONTROLLER ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

try {
    // Inclure les fichiers nécessaires
    require_once '../config/database.php';
    require_once '../utils/ResponseHandler.php';
    
    // Vérifier si l'authentification est requise (ignorer pour le test)
    $requireAuth = false;
    
    if ($requireAuth && file_exists('../middleware/Auth.php')) {
        include_once '../middleware/Auth.php';
        
        // Récupérer les en-têtes pour l'authentification
        $allHeaders = apache_request_headers();
        
        // Vérifier si la classe Auth existe
        if (class_exists('Auth')) {
            $auth = new Auth($allHeaders);
            
            // Vérifier si l'utilisateur est authentifié
            $userData = $auth->isAuth();
            
            // Si l'utilisateur n'est pas authentifié
            if (!$userData) {
                http_response_code(401);
                echo json_encode(["message" => "Accès non autorisé", "status" => "error"], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            // Vérifier si l'utilisateur est administrateur
            if ($userData['data']['role'] !== 'administrateur' && $userData['data']['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode(["message" => "Permission refusée", "status" => "error"], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
    }
    
    // Déterminer la méthode de requête
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET' || $method === 'POST') {
        // Instancier la base de données directement pour tester la connexion
        $database = new Database();
        $conn = $database->getConnection(false);
        
        // Vérifier si la connexion est établie
        $isConnected = $database->is_connected;
        
        if ($isConnected) {
            // La connexion est établie
            try {
                // Collecter des informations sur la base de données
                $info = [
                    'database' => $database->db_name,
                    'host' => $database->host,
                    'user' => $database->username
                ];
                
                // Obtenir la liste des tables
                $tables = [];
                $tablesStmt = $conn->query("SHOW TABLES");
                $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);
                
                // Calculer la taille de la base de données
                $sizeInfo = ['size' => '0 MB'];
                try {
                    $sizeStmt = $conn->query("
                        SELECT 
                            SUM(data_length + index_length) as size
                        FROM 
                            information_schema.TABLES 
                        WHERE 
                            table_schema = '" . $database->db_name . "'
                    ");
                    $sizeData = $sizeStmt->fetch(PDO::FETCH_ASSOC);
                    // Convertir la taille en MB
                    $sizeMB = round(($sizeData['size'] ?? 0) / (1024 * 1024), 2) . ' MB';
                    $sizeInfo['size'] = $sizeMB;
                } catch (PDOException $e) {
                    $sizeInfo['error'] = $e->getMessage();
                }
                
                // Obtenir des informations sur l'encodage
                $encodingInfo = ['encoding' => 'utf8mb4', 'collation' => 'utf8mb4_unicode_ci'];
                try {
                    $encodingStmt = $conn->query("
                        SELECT default_character_set_name, default_collation_name
                        FROM information_schema.SCHEMATA
                        WHERE schema_name = '" . $database->db_name . "'
                    ");
                    $encodingData = $encodingStmt->fetch(PDO::FETCH_ASSOC);
                    $encodingInfo['encoding'] = $encodingData['default_character_set_name'] ?? 'utf8mb4';
                    $encodingInfo['collation'] = $encodingData['default_collation_name'] ?? 'utf8mb4_unicode_ci';
                } catch (PDOException $e) {
                    $encodingInfo['error'] = $e->getMessage();
                }
                
                // Vérifier si la table utilisateurs existe et récupérer un échantillon
                $utilisateursInfo = ['count' => 0, 'sample' => []];
                try {
                    // Vérifier si la table existe d'abord
                    $tableCheckStmt = $conn->query("SHOW TABLES LIKE 'utilisateurs'");
                    if ($tableCheckStmt->rowCount() > 0) {
                        // La table existe, compter les utilisateurs
                        $countStmt = $conn->query("SELECT COUNT(*) FROM utilisateurs");
                        $utilisateursInfo['count'] = (int)$countStmt->fetchColumn();
                        
                        // Récupérer un échantillon d'utilisateurs
                        $sampleStmt = $conn->query("
                            SELECT id, identifiant_technique, email, role, date_creation 
                            FROM utilisateurs 
                            ORDER BY id DESC 
                            LIMIT 5
                        ");
                        $utilisateursInfo['sample'] = $sampleStmt->fetchAll(PDO::FETCH_ASSOC);
                    }
                } catch (PDOException $e) {
                    $utilisateursInfo['error'] = $e->getMessage();
                }
                
                // Journaliser le résultat
                error_log("Connexion à la base de données réussie, informations récupérées");
                
                // La connexion est établie et la requête a fonctionné
                http_response_code(200);
                echo json_encode([
                    "message" => "Connexion réussie à la base de données",
                    "status" => "success",
                    "info" => [
                        "database_name" => $info['database'],
                        "host" => $info['host'],
                        "user" => $info['user'],
                        "tables" => $tables,
                        "table_count" => count($tables),
                        "size" => $sizeInfo['size'],
                        "encoding" => $encodingInfo['encoding'],
                        "collation" => $encodingInfo['collation'],
                        "connection_status" => "Online"
                    ],
                    "utilisateurs_count" => $utilisateursInfo['count'],
                    "utilisateurs_sample" => $utilisateursInfo['sample'],
                    "version" => $conn->getAttribute(PDO::ATTR_SERVER_VERSION)
                ], JSON_UNESCAPED_UNICODE);
            } catch (Exception $e) {
                // La connexion est établie mais il y a un problème avec les requêtes supplémentaires
                error_log("Erreur lors de la collecte d'informations: " . $e->getMessage());
                http_response_code(200);
                echo json_encode([
                    "message" => "Connexion réussie à la base de données, mais erreur lors de la collecte d'informations",
                    "status" => "warning",
                    "info" => [
                        "database_name" => $database->db_name,
                        "host" => $database->host,
                        "connection_status" => "Warning"
                    ],
                    "error_details" => $e->getMessage()
                ], JSON_UNESCAPED_UNICODE);
            }
        } else {
            // La connexion a échoué
            error_log("Échec de la connexion à la base de données: " . ($database->connection_error ?? "Raison inconnue"));
            http_response_code(500);
            echo json_encode([
                "message" => "Échec de la connexion à la base de données",
                "error" => $database->connection_error ?? "Raison inconnue",
                "status" => "error",
                "connection_info" => [
                    "host" => $database->host,
                    "database" => $database->db_name,
                    "username" => $database->username,
                    "php_version" => phpversion(),
                    "pdo_drivers" => implode(", ", PDO::getAvailableDrivers())
                ]
            ], JSON_UNESCAPED_UNICODE);
        }
    } else {
        http_response_code(405);
        echo json_encode(["message" => "Méthode non autorisée", "status" => "error"], JSON_UNESCAPED_UNICODE);
    }
} catch (Exception $e) {
    error_log("Exception générale dans DatabaseTestController: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "message" => "Erreur interne du serveur",
        "error" => $e->getMessage(),
        "status" => "error"
    ], JSON_UNESCAPED_UNICODE);
}
?>
