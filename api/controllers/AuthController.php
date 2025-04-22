
<?php
// Assurons-nous que rien ne sera affiché avant les en-têtes
ob_start();

// Inclure notre fichier de configuration d'environnement s'il n'est pas déjà inclus
if (!function_exists('env')) {
    if (file_exists(__DIR__ . '/../config/env.php')) {
        require_once __DIR__ . '/../config/env.php';
    } else {
        // Log et continuer
        error_log("Fichier env.php introuvable");
    }
}

// Journaliser l'accès au contrôleur d'authentification
error_log("AuthController.php appelé | URI: " . $_SERVER['REQUEST_URI'] . " | Méthode: " . $_SERVER['REQUEST_METHOD']);

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

// Configuration des en-têtes CORS et de la réponse JSON
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

try {
    // Vérifier si la méthode est POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        error_log("Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
        http_response_code(405);
        echo json_encode(['message' => 'Méthode non autorisée. Utilisez POST pour l\'authentification.', 'status' => 405]);
        exit;
    }

    // Inclusion des fichiers nécessaires
    $basePath = __DIR__ . '/../';
    error_log("Chemin de base: " . $basePath);

    // Vérifier si les fichiers existent avant de les inclure
    $configFile = $basePath . 'config/database.php';
    $userFile = $basePath . 'models/User.php';
    $jwtFile = $basePath . 'utils/JwtHandler.php';

    if (!file_exists($configFile)) {
        throw new Exception("Fichier config/database.php non trouvé");
    }

    if (!file_exists($userFile)) {
        throw new Exception("Fichier models/User.php non trouvé");
    }

    if (!file_exists($jwtFile)) {
        throw new Exception("Fichier utils/JwtHandler.php non trouvé");
    }

    // Inclure les fichiers requis
    include_once $configFile;
    include_once $userFile;
    include_once $jwtFile;

    // Obtenir la connexion à la base de données
    $database = new Database();
    $db = $database->getConnection();

    // Instancier l'utilisateur
    $user = new User($db);

    // Récupérer les données POST
    $json_input = file_get_contents("php://input");

    // Log la réception des données
    error_log("Données reçues: " . $json_input);

    // Vérifier si les données sont vides
    if (empty($json_input)) {
        throw new Exception("Aucune donnée reçue");
    }
    
    $data = json_decode(cleanUTF8($json_input));

    // Vérifier si le décodage a réussi
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Erreur de décodage JSON: " . json_last_error_msg());
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
                
                error_log("Connexion réussie pour: " . $username);
                
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
                error_log("Mot de passe incorrect pour: " . $username);
                http_response_code(401);
                echo json_encode(array("message" => "Identifiants invalides"));
            }
        } else {
            // Si l'utilisateur n'existe pas
            error_log("Utilisateur non trouvé: " . $username);
            http_response_code(401);
            echo json_encode(array("message" => "Identifiants invalides"));
        }
    } else {
        // Si des données sont manquantes
        error_log("Données incomplètes pour la connexion");
        http_response_code(400);
        echo json_encode(array("message" => "Données incomplètes"));
    }
} catch (Exception $e) {
    // Log l'erreur et renvoyer une réponse formatée
    error_log("Erreur dans AuthController: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Erreur serveur", "error" => $e->getMessage()));
} finally {
    // Vider et terminer le tampon de sortie pour s'assurer que seule la réponse JSON est envoyée
    ob_end_flush();
}
