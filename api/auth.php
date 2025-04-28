
<?php
// Activer la journalisation d'erreurs plus détaillée
ini_set('display_errors', 1);
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

    // Vérifier si les données sont présentes
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
        
        // DÉBUT - AUTHENTIFICATION DE SECOURS
        // Liste des utilisateurs de test
        $test_users = [
            'admin' => ['password' => 'admin123', 'role' => 'admin'],
            'p71x6d_system' => ['password' => 'Trottinette43!', 'role' => 'admin'],
            'antcirier@gmail.com' => ['password' => ['password123', 'Password123!', 'Trottinette43!'], 'role' => 'admin'],
            'p71x6d_dupont' => ['password' => 'manager456', 'role' => 'gestionnaire'],
            'p71x6d_martin' => ['password' => 'user789', 'role' => 'utilisateur']
        ];
        
        // Vérifier les utilisateurs de test
        foreach ($test_users as $user_id => $user_data) {
            if ($username === $user_id) {
                $valid_password = false;
                if (is_array($user_data['password'])) {
                    $valid_password = in_array($password, $user_data['password']);
                } else {
                    $valid_password = ($password === $user_data['password']);
                }
                
                if ($valid_password) {
                    error_log("Connexion acceptée pour l'utilisateur: " . $user_id);
                    
                    // Token de secours simple
                    $token = base64_encode(json_encode([
                        'user' => $user_id,
                        'role' => $user_data['role'],
                        'exp' => time() + 3600
                    ]));
                    
                    // Format du nom d'utilisateur pour affichage
                    $name_parts = explode('_', $user_id);
                    $prenom = isset($name_parts[1]) ? ucfirst($name_parts[1]) : 'User';
                    $nom = isset($name_parts[2]) ? ucfirst($name_parts[2]) : 'Test';
                    
                    // Si c'est un email, extraire le nom
                    if (strpos($user_id, '@') !== false) {
                        $prenom = 'Antoine';
                        $nom = 'Cirier';
                    }
                    
                    http_response_code(200);
                    echo json_encode([
                        'message' => 'Connexion réussie',
                        'token' => $token,
                        'user' => [
                            'id' => rand(1000, 9999),
                            'nom' => $nom,
                            'prenom' => $prenom,
                            'email' => $user_id,
                            'identifiant_technique' => $user_id === 'antcirier@gmail.com' ? 'p71x6d_system' : $user_id,
                            'role' => $user_data['role']
                        ]
                    ]);
                    exit;
                }
            }
        }
        
        // Si on arrive ici, l'authentification a échoué
        http_response_code(401);
        echo json_encode([
            'message' => 'Identifiants invalides',
            'status' => 401
        ]);
        exit;
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
        'message' => 'Erreur serveur', 
        'error' => $e->getMessage()
    ]);
    exit;
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE auth.php ===");
}
?>
