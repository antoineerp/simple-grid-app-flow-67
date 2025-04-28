
<?php
// Use absolute path for including configuration files
if (!function_exists('env')) {
    // Updated path to use __DIR__ for absolute path resolution
    require_once __DIR__ . '/../../api/config/env.php';
}

// Déterminer l'environnement
$environment = env('APP_ENV', 'development');

// Configuration des en-têtes CORS selon l'environnement
$allowedOrigins = [
    'development' => env('ALLOWED_ORIGIN_DEV', 'http://localhost:8080'),
    'production' => env('ALLOWED_ORIGIN_PROD', 'https://qualiopi.ch')
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
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit;
}

// Journaliser l'accès à ce contrôleur (pour débogage)
error_log("Accès au ConfigController - Méthode: " . $_SERVER['REQUEST_METHOD']);

// Inclusion des fichiers nécessaires avec chemins absolus
include_once __DIR__ . '/../../api/config/database.php';
include_once __DIR__ . '/../../api/middleware/Auth.php';

// Récupérer les en-têtes pour l'authentification
$allHeaders = getallheaders();
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

// Fichier de configuration avec chemin absolu
$configFile = __DIR__ . '/../../api/config/app_config.json';

// Détermininer la méthode de requête
$method = $_SERVER['REQUEST_METHOD'];

// Fonction pour nettoyer les données en UTF-8 si elle n'existe pas déjà
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

// Journaliser pour le débogage
error_log("ConfigController - Méthode: $method");

switch($method) {
    case 'GET':
        try {
            // Lire la configuration actuelle
            if (file_exists($configFile)) {
                $config = json_decode(file_get_contents($configFile), true);
                if ($config === null && json_last_error() !== JSON_ERROR_NONE) {
                    throw new Exception("Erreur de parsing JSON: " . json_last_error_msg());
                }
            } else {
                $config = [
                    'api_urls' => [
                        'development' => 'http://localhost:8080/api',
                        'production' => 'https://qualiopi.ch/api'
                    ],
                    'allowed_origins' => [
                        'development' => 'http://localhost:8080',
                        'production' => 'https://qualiopi.ch'
                    ]
                ];
                
                // Créer le fichier s'il n'existe pas
                if (!file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
                    throw new Exception("Impossible de créer le fichier de configuration");
                }
            }
            
            http_response_code(200);
            echo json_encode($config, JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Erreur lors de la lecture de la configuration: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        break;
        
    case 'POST':
        try {
            // Obtenir les données postées et assurer qu'elles sont en UTF-8
            $json_input = file_get_contents("php://input");
            if (!$json_input) {
                throw new Exception("Aucune donnée reçue");
            }
            
            error_log("Données reçues: " . $json_input);
            
            $data = json_decode(cleanUTF8($json_input), true);
            if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Erreur de parsing JSON: " . json_last_error_msg());
            }
            
            // Valider la structure des données
            if (!isset($data['api_urls']) || 
                !isset($data['allowed_origins']) ||
                !isset($data['api_urls']['development']) || 
                !isset($data['api_urls']['production']) || 
                !isset($data['allowed_origins']['development']) || 
                !isset($data['allowed_origins']['production'])
            ) {
                throw new Exception("Structure de données incomplète");
            }
            
            // Vérifier que le dossier config existe
            $configDir = dirname($configFile);
            if (!is_dir($configDir)) {
                if (!mkdir($configDir, 0755, true)) {
                    throw new Exception("Impossible de créer le dossier de configuration");
                }
            }
            
            // Vérifier les permissions d'écriture
            if (file_exists($configFile) && !is_writable($configFile)) {
                throw new Exception("Impossible d'écrire dans le fichier de configuration (permissions insuffisantes)");
            }
            
            // Mettre à jour la configuration
            if (!file_put_contents($configFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
                throw new Exception("Erreur lors de l'écriture du fichier");
            }
            
            http_response_code(200);
            echo json_encode(["message" => "Configuration mise à jour avec succès"], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            error_log("Erreur ConfigController: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                "message" => "Erreur lors de la mise à jour de la configuration", 
                "details" => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["message" => "Méthode non autorisée"], JSON_UNESCAPED_UNICODE);
        break;
}
?>
