
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
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit;
}

// Inclusion des fichiers nécessaires
include_once '../config/database.php';
include_once '../models/User.php';
include_once '../utils/JwtHandler.php';

// Obtenir la connexion à la base de données
$database = new Database();
$db = $database->getConnection();

// Instancier l'utilisateur
$user = new User($db);

// Récupérer les données POST
$data = json_decode(file_get_contents("php://input"));

// Vérifier si les données sont présentes
if(
    !empty($data->username) &&
    !empty($data->password)
){
    // Rechercher l'utilisateur par son identifiant technique
    if($user->findByIdentifiant($data->username)) {
        // Vérifier si le mot de passe correspond
        // Pour le prototype, on vérifie directement le mot de passe
        // En production, utiliser password_verify($data->password, $user->mot_de_passe)
        if($data->password === 'admin123' || $data->password === 'manager456' || $data->password === 'user789') {
            // Créer un JWT handler
            $jwt = new JwtHandler();
            
            // Données à encoder dans le JWT
            $token_data = array(
                "id" => $user->id,
                "identifiant_technique" => $user->identifiant_technique,
                "role" => $user->role
            );
            
            // Générer le token JWT
            $token = $jwt->encode($token_data);
            
            // Réponse
            http_response_code(200);
            echo json_encode(
                array(
                    "message" => "Connexion réussie",
                    "token" => $token,
                    "user" => array(
                        "id" => $user->id,
                        "nom" => $user->nom,
                        "prenom" => $user->prenom,
                        "email" => $user->email,
                        "identifiant_technique" => $user->identifiant_technique,
                        "role" => $user->role
                    )
                )
            );
        } else {
            // Si le mot de passe ne correspond pas
            http_response_code(401);
            echo json_encode(array("message" => "Identifiants invalides"));
        }
    } else {
        // Si l'utilisateur n'existe pas
        http_response_code(401);
        echo json_encode(array("message" => "Identifiants invalides"));
    }
} else {
    // Si des données sont manquantes
    http_response_code(400);
    echo json_encode(array("message" => "Données incomplètes"));
}
?>
