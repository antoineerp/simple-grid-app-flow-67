
<?php
// Headers requis
header("Access-Control-Allow-Origin: *");
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
    echo json_encode(["message" => "Accès non autorisé"]);
    exit;
}

// Vérifier si l'utilisateur est administrateur
if ($userData['data']['role'] !== 'administrateur' && $userData['data']['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["message" => "Permission refusée"]);
    exit;
}

// Fichier de configuration (à adapter selon votre structure)
$configFile = '../config/app_config.json';

// Détermininer la méthode de requête
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Lire la configuration actuelle
        if (file_exists($configFile)) {
            $config = json_decode(file_get_contents($configFile), true);
        } else {
            $config = [
                'api_urls' => [
                    'development' => 'http://localhost:8080/api',
                    'production' => 'https://www.qualiopi.ch/api'
                ],
                'allowed_origins' => [
                    'development' => 'http://localhost:8080',
                    'production' => 'https://www.qualiopi.ch'
                ]
            ];
            
            // Créer le fichier s'il n'existe pas
            file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
        }
        
        http_response_code(200);
        echo json_encode($config);
        break;
        
    case 'POST':
        // Obtenir les données postées
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (
            isset($data['api_urls']) && 
            isset($data['allowed_origins']) &&
            isset($data['api_urls']['development']) && 
            isset($data['api_urls']['production']) && 
            isset($data['allowed_origins']['development']) && 
            isset($data['allowed_origins']['production'])
        ) {
            // Mettre à jour la configuration
            file_put_contents($configFile, json_encode($data, JSON_PRETTY_PRINT));
            
            http_response_code(200);
            echo json_encode(["message" => "Configuration mise à jour avec succès"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Données incomplètes"]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["message" => "Méthode non autorisée"]);
        break;
}
?>
