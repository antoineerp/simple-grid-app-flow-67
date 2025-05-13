
<?php
// Activer la journalisation d'erreurs plus détaillée
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Enregistrer le début de l'exécution
error_log("=== DÉBUT DE L'EXÉCUTION DE auth.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Définir explicitement le type de contenu JSON et les en-têtes CORS
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Vérifier si la méthode est POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['message' => 'Méthode non autorisée. Utilisez POST pour l\'authentification.', 'status' => 405]);
    exit;
}

// Créer un gestionnaire d'exceptions global
function exception_handler($exception) {
    error_log("Exception globale attrapée dans auth.php: " . $exception->getMessage());
    error_log("Trace: " . $exception->getTraceAsString());
    
    // Envoyer une réponse JSON en cas d'erreur
    http_response_code(500);
    echo json_encode([
        'status' => 500,
        'message' => 'Erreur serveur interne',
        'error' => $exception->getMessage()
    ]);
}

// Définir le gestionnaire d'exceptions
set_exception_handler('exception_handler');

try {
    // Chargement des configurations d'environnement
    if (file_exists(__DIR__ . '/config/env.php')) {
        require_once __DIR__ . '/config/env.php';
    } else {
        error_log("Le fichier env.php est manquant, utilisation des valeurs par défaut");
        // Valeurs par défaut si le fichier env.php n'est pas trouvé
        define('DB_HOST', 'p71x6d.myd.infomaniak.com');
        define('DB_NAME', 'p71x6d_system');
        define('DB_USER', 'p71x6d_system');
        define('DB_PASS', 'Trottinette43!');
    }

    // Récupérer les données POST
    $json_input = file_get_contents("php://input");

    // Journaliser la réception des données (masquer les infos sensibles)
    $log_input = json_decode($json_input, true);
    if (isset($log_input['password'])) {
        $log_input['password'] = '********';
    }
    error_log("Données reçues: " . json_encode($log_input ?? $json_input));

    // Vérifier si les données sont vides
    if (empty($json_input)) {
        throw new Exception("Aucune donnée reçue");
    }
    
    $data = json_decode($json_input);

    // Vérifier si le décodage a réussi
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Erreur de décodage JSON: " . json_last_error_msg());
    }

    // Vérifier si les données sont présentes et récupérer le nom d'utilisateur et le mot de passe
    $username = null;
    $password = null;
    
    // Récupérer le nom d'utilisateur et le mot de passe, en tenant compte des différents formats possibles
    if (!empty($data->username)) {
        $username = $data->username;
    } elseif (!empty($data->email)) {
        $username = $data->email;
    }
    
    if (!empty($data->password)) {
        $password = $data->password;
    }
    
    if ($username && $password) {
        error_log("Tentative de connexion pour: " . $username);
        
        // Se connecter directement avec PDO pour plus de fiabilité
        try {
            // Connexion directe à la base
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            error_log("Connexion à la base de données réussie");
            
            // Rechercher l'utilisateur par email
            $query = "SELECT * FROM utilisateurs WHERE email = ? OR identifiant_technique = ? LIMIT 1";
            $stmt = $pdo->prepare($query);
            $stmt->execute([$username, $username]);
            $user = $stmt->fetch();
            
            if (!$user) {
                error_log("Utilisateur non trouvé: " . $username);
                http_response_code(401);
                echo json_encode([
                    'message' => 'Identifiants invalides',
                    'status' => 401
                ]);
                exit;
            }
            
            error_log("Utilisateur trouvé: " . $user['email']);
            
            // Vérifier le mot de passe
            $valid_password = password_verify($password, $user['mot_de_passe']);
            
            // Pour la compatibilité, accepter aussi les mots de passe non hashés temporairement
            if (!$valid_password && $password === $user['mot_de_passe']) {
                $valid_password = true;
                
                // Mettre à jour le mot de passe avec le hash pour les prochaines connexions
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $updateQuery = "UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?";
                $updateStmt = $pdo->prepare($updateQuery);
                $updateStmt->execute([$hashedPassword, $user['id']]);
                error_log("Mot de passe mis à jour avec hash pour: " . $user['email']);
            }
            
            if ($valid_password) {
                error_log("Mot de passe valide pour: " . $user['email']);
                
                // Générer un token JWT avec le format correct
                $header = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
                
                // Créer le payload avec les informations utilisateur
                $payload = base64url_encode(json_encode([
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['email'],
                        'identifiant_technique' => $user['identifiant_technique'],
                        'email' => $user['email'],
                        'role' => $user['role'],
                        'nom' => $user['nom'],
                        'prenom' => $user['prenom']
                    ],
                    'exp' => time() + 3600 // expire dans 1 heure
                ]));
                
                // Créer la signature avec un secret (à remplacer par une clé sécurisée en production)
                $secret = 'your_jwt_secret_key_here';
                $signature = base64url_encode(hash_hmac('sha256', "$header.$payload", $secret, true));
                
                // Construire le JWT conforme au standard (header.payload.signature)
                $token = "$header.$payload.$signature";
                
                error_log("Token JWT généré: " . substr($token, 0, 20) . "...");
                
                // Envoyer la réponse
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Connexion réussie',
                    'token' => $token,
                    'user' => [
                        'id' => $user['id'],
                        'nom' => $user['nom'],
                        'prenom' => $user['prenom'],
                        'email' => $user['email'],
                        'identifiant_technique' => $user['identifiant_technique'],
                        'role' => $user['role']
                    ]
                ]);
                exit;
            } else {
                error_log("Mot de passe invalide pour: " . $user['email']);
                http_response_code(401);
                echo json_encode([
                    'message' => 'Identifiants invalides',
                    'status' => 401
                ]);
                exit;
            }
        } catch (PDOException $e) {
            error_log("Erreur PDO: " . $e->getMessage());
            throw new Exception("Erreur de connexion à la base de données: " . $e->getMessage());
        }
    } else {
        // Si des données sont manquantes
        error_log("Données incomplètes pour la connexion. Username: " . ($username ? 'présent' : 'manquant') . 
                  ", Password: " . ($password ? 'présent' : 'manquant'));
        http_response_code(400);
        echo json_encode(['message' => 'Données incomplètes. Username et password sont requis.', 'status' => 400]);
        exit;
    }
} catch (Exception $e) {
    // Log l'erreur et renvoyer une réponse formatée
    error_log("Erreur dans auth.php: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur', 
        'error' => $e->getMessage()
    ]);
    exit;
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE auth.php ===");
}

// Fonction d'encodage URL safe pour base64 (pour JWT)
function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
?>
