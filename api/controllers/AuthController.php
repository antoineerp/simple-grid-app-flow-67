
<?php
// Assurons-nous que rien ne sera affiché avant les en-têtes
ob_start();

// Début de la journalisation
error_log("=== DÉBUT DE L'EXÉCUTION DE AuthController.php ===");

// Inclure notre fichier de configuration d'environnement s'il n'est pas déjà inclus
if (!function_exists('env')) {
    $env_file = __DIR__ . '/../config/env.php';
    if (file_exists($env_file)) {
        error_log("Inclusion du fichier env.php: $env_file");
        require_once $env_file;
    } else {
        // Log et continuer
        error_log("ERREUR: Fichier env.php introuvable: $env_file");
        throw new Exception("Fichier de configuration env.php introuvable");
    }
}

// Journaliser l'accès au contrôleur d'authentification
error_log("AuthController.php appelé | URI: " . $_SERVER['REQUEST_URI'] . " | Méthode: " . $_SERVER['REQUEST_METHOD']);

// Fonction pour vérifier l'existence des fichiers
function check_auth_file($path, $description) {
    if (!file_exists($path)) {
        error_log("ERREUR: Fichier $description introuvable: $path");
        return false;
    }
    if (!is_readable($path)) {
        error_log("ERREUR: Fichier $description non lisible: $path");
        return false;
    }
    error_log("OK: Fichier $description trouvé et lisible: $path");
    return true;
}

// Vérifions si la fonction cleanUTF8 n'existe pas déjà avant de la déclarer
if (!function_exists('cleanUTF8')) {
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

    // Vérification de tous les fichiers requis
    $files_ok = true;
    $files_ok = $files_ok && check_auth_file($configFile, "config/database.php");
    $files_ok = $files_ok && check_auth_file($userFile, "models/User.php");
    $files_ok = $files_ok && check_auth_file($jwtFile, "utils/JwtHandler.php");

    if (!$files_ok) {
        throw new Exception("Un ou plusieurs fichiers requis sont introuvables ou non lisibles");
    }

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
        
        try {
            // Inclure les fichiers requis
            error_log("Inclusion des fichiers requis...");
            include_once $configFile;
            include_once $jwtFile;
            error_log("Fichiers de base inclus avec succès");
            
            // Exiger une connexion à la base de données
            $database = new Database();
            $db = $database->getConnection(true); // Exiger une connexion
            
            if (!$database->is_connected) {
                throw new Exception("Impossible de se connecter à la base de données");
            }
            
            error_log("Connexion à la base de données établie avec succès");
            
            // Inclure le modèle utilisateur
            include_once $userFile;
            
            // Instancier l'utilisateur
            $user = new User($db);
            error_log("Objet User créé avec succès");
            
            // Rechercher l'utilisateur par son identifiant technique
            if($user->findByIdentifiant($username)) {
                error_log("Utilisateur trouvé dans la base de données: " . $username);
                
                // Pour le prototype, nous acceptons n'importe quel mot de passe valide
                // et aussi une liste de mots de passe pré-configurés
                $known_passwords = ['admin123', 'manager456', 'user789', 'password123'];
                
                // Vérifier si c'est un des mots de passe connus ou si c'est un utilisateur de test
                $is_valid_password = in_array($password, $known_passwords) || 
                                     ($username === 'admin' && $password === 'admin123') ||
                                     ($username === 'antcirier@gmail.com' && $password === 'password123');
                
                // Log pour le débogage
                error_log("Vérification du mot de passe pour: " . $username . " - Est valide: " . ($is_valid_password ? "OUI" : "NON"));
                
                if($is_valid_password) {
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
                    echo json_encode(array("message" => "Identifiants invalides. Mot de passe incorrect.", "status" => 401));
                }
            } else {
                // Si l'utilisateur n'existe pas
                error_log("Utilisateur non trouvé: " . $username);
                
                // Vérifier si c'est un des identifiants de secours
                $fallback_users = [
                    'admin' => ['password' => 'admin123', 'role' => 'admin'],
                    'antcirier@gmail.com' => ['password' => 'password123', 'role' => 'admin'],
                    'p71x6d_system' => ['password' => 'admin123', 'role' => 'admin'],
                    'p71x6d_dupont' => ['password' => 'manager456', 'role' => 'gestionnaire'],
                    'p71x6d_martin' => ['password' => 'user789', 'role' => 'utilisateur']
                ];
                
                if (isset($fallback_users[$username]) && $fallback_users[$username]['password'] === $password) {
                    error_log("Identifiant de secours reconnu: " . $username);
                    
                    // Créer un JWT handler
                    $jwt = new JwtHandler();
                    
                    // Données à encoder dans le JWT pour l'utilisateur de secours
                    $token_data = array(
                        "id" => 0,
                        "identifiant_technique" => $username,
                        "role" => $fallback_users[$username]['role']
                    );
                    
                    // Générer le token JWT
                    $token = $jwt->encode($token_data);
                    
                    // Réponse pour l'utilisateur de secours
                    http_response_code(200);
                    echo json_encode(
                        array(
                            "message" => "Connexion de secours réussie",
                            "token" => $token,
                            "user" => array(
                                "id" => 0,
                                "nom" => $username,
                                "prenom" => "",
                                "email" => $username . "@example.com",
                                "identifiant_technique" => $username,
                                "role" => $fallback_users[$username]['role']
                            )
                        )
                    );
                } else {
                    http_response_code(401);
                    echo json_encode(array("message" => "Identifiants invalides. Utilisateur non trouvé.", "status" => 401));
                }
            }
        } catch (Exception $e) {
            // En cas d'erreur lors de l'authentification
            error_log("Erreur lors de l'authentification: " . $e->getMessage());
            throw $e;
        }
    } else {
        // Si des données sont manquantes
        error_log("Données incomplètes pour la connexion");
        http_response_code(400);
        echo json_encode(array("message" => "Données incomplètes", "status" => 400));
    }
} catch (Exception $e) {
    // Log l'erreur et renvoyer une réponse formatée
    error_log("Erreur dans AuthController: " . $e->getMessage());
    error_log("Trace: " . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode(array(
        "message" => "Erreur serveur", 
        "error" => $e->getMessage(),
        "trace" => $e->getTraceAsString()
    ));
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE AuthController.php ===");
    // Vider et terminer le tampon de sortie pour s'assurer que seule la réponse JSON est envoyée
    ob_end_flush();
}
