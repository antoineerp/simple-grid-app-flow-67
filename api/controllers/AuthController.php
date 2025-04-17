
<?php
// Inclure notre fichier de configuration d'environnement s'il n'est pas déjà inclus
if (!function_exists('env')) {
    require_once '../config/env.php';
}

// Journaliser l'accès au contrôleur d'authentification
error_log("AuthController.php appelé");

// Fonction pour nettoyer les données UTF-8
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
    header("Access-Control-Allow-Origin: *"); // En mode d'aperçu, permettre toutes les origines
}

// Autres en-têtes CORS
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit;
}

// Vérifier si la méthode est POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Méthode non autorisée. Utilisez POST pour l\'authentification.', 'status' => 405]);
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

// Récupérer les données POST et assurer qu'elles sont en UTF-8
$json_input = file_get_contents("php://input");

// Log la réception des données
error_log("Données reçues: " . $json_input);

try {
    // Vérifier si les données sont vides
    if (empty($json_input)) {
        throw new Exception("Aucune donnée reçue");
    }
    
    $data = json_decode(cleanUTF8($json_input));

    // Vérifier si le décodage a réussi
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode([
            "message" => "Erreur de décodage JSON: " . json_last_error_msg(),
            "input" => $json_input
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Vérifier si les données sont présentes
    if(!empty($data->username) && !empty($data->password)) {
        // Nettoyer les entrées utilisateur
        $username = cleanUTF8($data->username);
        $password = cleanUTF8($data->password);
        
        error_log("Tentative de connexion pour: " . $username);
        
        // Rechercher l'utilisateur par son identifiant technique
        if($user->findByIdentifiant($username)) {
            // Vérifier si le mot de passe correspond
            // Pour le prototype, on vérifie directement le mot de passe
            // En production, utiliser password_verify($password, $user->mot_de_passe)
            if($password === 'admin123' || $password === 'manager456' || $password === 'user789') {
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
                    ),
                    JSON_UNESCAPED_UNICODE
                );
            } else {
                // Si le mot de passe ne correspond pas
                http_response_code(401);
                echo json_encode(array("message" => "Identifiants invalides"), JSON_UNESCAPED_UNICODE);
            }
        } else {
            // Si l'utilisateur n'existe pas
            http_response_code(401);
            echo json_encode(array("message" => "Identifiants invalides"), JSON_UNESCAPED_UNICODE);
        }
    } else {
        // Si des données sont manquantes
        http_response_code(400);
        echo json_encode(array("message" => "Données incomplètes"), JSON_UNESCAPED_UNICODE);
    }
} catch (Exception $e) {
    // Log l'erreur et renvoyer une réponse formatée
    error_log("Erreur dans AuthController: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Erreur serveur", "error" => $e->getMessage()), JSON_UNESCAPED_UNICODE);
}
