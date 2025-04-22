
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
    }
}

// Journaliser l'accès au contrôleur d'authentification
error_log("AuthController.php appelé | URI: " . $_SERVER['REQUEST_URI'] . " | Méthode: " . $_SERVER['REQUEST_METHOD']);

// Fonction pour nettoyer les données UTF-8
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

    // Récupérer les données POST
    $json_input = file_get_contents("php://input");

    // Log la réception des données (masquer les infos sensibles)
    $log_input = json_decode($json_input, true);
    if (isset($log_input['password'])) {
        $log_input['password'] = '********';
    }
    error_log("Données reçues: " . json_encode($log_input ?? $json_input));

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
        
        // Tenter la connexion à la base de données
        try {
            // Inclure les fichiers requis pour la base de données
            $basePath = __DIR__ . '/../';
            $configFile = $basePath . 'config/database.php';
            $userFile = $basePath . 'models/User.php';
            $jwtFile = $basePath . 'utils/JwtHandler.php';
            
            if (!file_exists($configFile) || !file_exists($jwtFile)) {
                throw new Exception("Fichiers requis introuvables");
            }
            
            // Inclure les fichiers requis
            include_once $configFile;
            include_once $jwtFile;
            
            // Essayer une connexion à la base de données
            $database = new Database();
            $db = $database->getConnection(true); // Exiger une connexion réussie
            
            if ($database->is_connected && file_exists($userFile)) {
                include_once $userFile;
                $user = new User($db);
                
                // Journaliser l'état de la connexion à la base de données
                error_log("Connexion à la base de données établie. Recherche de l'utilisateur: " . $username);
                
                // Rechercher l'utilisateur par son identifiant technique
                if($user->findByIdentifiant($username)) {
                    error_log("Utilisateur trouvé dans la base de données: " . $username);
                    
                    // Pour la démo, accepter certains mots de passe spécifiques
                    // En production, utiliser password_verify($password, $user->mot_de_passe)
                    $valid_password = false;
                    
                    // Si le mot de passe est hashé dans la BD, vérifier avec password_verify
                    if (password_verify($password, $user->mot_de_passe)) {
                        $valid_password = true;
                        error_log("Mot de passe vérifié avec succès via password_verify()");
                    }
                    // Pour les tests, accepter aussi les mots de passe de développement
                    else if (in_array($password, ['admin123', 'manager456', 'user789', 'password123']) && 
                             (strpos($username, 'admin') !== false || strpos($username, 'system') !== false)) {
                        $valid_password = true;
                        error_log("Mot de passe accepté via liste de développement (uniquement pour admin/system)");
                    }
                    
                    if($valid_password) {
                        // Créer un JWT handler
                        $jwt = new JwtHandler();
                        
                        // Données à encoder dans le JWT
                        $token_data = [
                            'id' => $user->id,
                            'identifiant_technique' => $user->identifiant_technique,
                            'role' => $user->role
                        ];
                        
                        // Générer le token JWT
                        $token = $jwt->encode($token_data);
                        
                        error_log("Connexion réussie pour: " . $username);
                        
                        // Réponse
                        http_response_code(200);
                        echo json_encode([
                            'message' => 'Connexion réussie',
                            'token' => $token,
                            'user' => [
                                'id' => $user->id,
                                'nom' => $user->nom,
                                'prenom' => $user->prenom,
                                'email' => $user->email,
                                'identifiant_technique' => $user->identifiant_technique,
                                'role' => $user->role
                            ]
                        ]);
                        exit;
                    } else {
                        error_log("Mot de passe incorrect pour: " . $username);
                        throw new Exception("Mot de passe incorrect");
                    }
                } else {
                    error_log("Utilisateur non trouvé dans la base de données: " . $username);
                    throw new Exception("Utilisateur non trouvé dans la base de données");
                }
            } else {
                error_log("Problème de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
                throw new Exception("La connexion à la base de données a échoué: " . ($database->connection_error ?? "Erreur inconnue"));
            }
        } catch (Exception $e) {
            // Échec de l'authentification par la base de données
            error_log("Échec de l'authentification: " . $e->getMessage());
            
            // Si l'utilisateur n'existe pas ou le mot de passe est incorrect
            http_response_code(401);
            echo json_encode([
                'message' => 'Identifiants invalides ou base de données inaccessible',
                'status' => 401,
                'error' => $e->getMessage()
            ]);
            exit;
        }
    } else {
        // Si des données sont manquantes
        error_log("Données incomplètes pour la connexion");
        http_response_code(400);
        echo json_encode(['message' => 'Données incomplètes', 'status' => 400]);
        exit;
    }
} catch (Exception $e) {
    // Log l'erreur et renvoyer une réponse formatée
    error_log("Erreur dans AuthController: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'message' => 'Erreur serveur', 
        'error' => $e->getMessage()
    ]);
    exit;
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE AuthController.php ===");
    // Vider et terminer le tampon de sortie
    ob_end_flush();
}
