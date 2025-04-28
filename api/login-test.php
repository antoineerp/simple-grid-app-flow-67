
<?php
// Login de test pour le fallback de l'authentification
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Journalisation pour le débogage
error_log("=== DEBUT DE L'EXÉCUTION DE login-test.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Vérifier si la méthode est POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Méthode non autorisée. Utilisez POST.', 'status' => 405]);
    exit;
}

// Récupérer les données JSON
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Journaliser les données reçues (masquer le mot de passe)
$log_data = $data;
if (isset($log_data['password'])) {
    $log_data['password'] = '******';
}
error_log("Données reçues: " . json_encode($log_data));

// Vérifier si les données sont valides
if (!$data || !isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Données invalides', 'status' => 400]);
    error_log("Données invalides reçues");
    exit;
}

// Utilisateurs de test
$test_users = [
    'admin' => ['password' => 'admin123', 'role' => 'admin'],
    'p71x6d_system' => ['password' => 'Trottinette43!', 'role' => 'admin'],
    'antcirier@gmail.com' => ['password' => ['password123', 'Password123!'], 'role' => 'admin'],
    'p71x6d_dupont' => ['password' => 'manager456', 'role' => 'gestionnaire'],
    'p71x6d_martin' => ['password' => 'user789', 'role' => 'utilisateur']
];

// Extraire les données
$username = $data['username'];
$password = $data['password'];

// Journaliser l'utilisateur qui tente de se connecter
error_log("Tentative de connexion pour: " . $username);

// Vérifier l'existence de l'utilisateur
$username_exists = array_key_exists($username, $test_users);
$available_users = array_keys($test_users);

// Authentification
$is_authenticated = false;
$user_role = null;

// Vérifier si l'utilisateur existe et si le mot de passe est correct
if ($username_exists) {
    $user_data = $test_users[$username];
    
    // Journaliser le format du mot de passe pour l'utilisateur
    error_log("Vérification du mot de passe pour: " . $username);
    error_log("Type du mot de passe stocké: " . (is_array($user_data['password']) ? 'array' : 'string'));
    error_log("Mot de passe fourni (longueur): " . strlen($password));
    
    if (is_array($user_data['password'])) {
        // Si plusieurs mots de passe sont acceptés
        $is_authenticated = in_array($password, $user_data['password']);
        if ($is_authenticated) {
            error_log("Authentification réussie avec mot de passe multiple");
        } else {
            error_log("Échec d'authentification avec mot de passe multiple. Mot de passe fourni: " . substr($password, 0, 2) . "****");
        }
    } else {
        // Si un seul mot de passe est accepté
        $is_authenticated = ($password === $user_data['password']);
        if ($is_authenticated) {
            error_log("Authentification réussie avec mot de passe simple");
        } else {
            error_log("Échec d'authentification. Mot de passe attendu: " . substr($user_data['password'], 0, 2) . "****");
            error_log("Mot de passe fourni: " . substr($password, 0, 2) . "****");
        }
    }
    
    $user_role = $user_data['role'];
}

// Réponse
if ($is_authenticated) {
    // Générer un token simple
    $token = base64_encode(json_encode([
        'user' => $username,
        'role' => $user_role,
        'exp' => time() + 3600
    ]));
    
    // Format du nom d'utilisateur pour affichage
    if ($username === 'antcirier@gmail.com') {
        $prenom = 'Antoine';
        $nom = 'Cirier';
    } else if ($username === 'p71x6d_system') {
        $prenom = 'System';
        $nom = 'Admin';
    } else {
        $name_parts = explode('_', $username);
        $prenom = isset($name_parts[1]) ? ucfirst($name_parts[1]) : 'User';
        $nom = isset($name_parts[2]) ? ucfirst($name_parts[2]) : 'Test';
    }
    
    error_log("Connexion réussie pour: " . $username . " (rôle: " . $user_role . ")");
    
    http_response_code(200);
    echo json_encode([
        'message' => 'Connexion réussie',
        'token' => $token,
        'user' => [
            'id' => rand(1000, 9999),
            'nom' => $nom,
            'prenom' => $prenom,
            'email' => $username,
            'identifiant_technique' => $username,
            'role' => $user_role
        ]
    ]);
} else {
    error_log("Échec d'authentification pour: " . $username);
    error_log("Utilisateur existe: " . ($username_exists ? "oui" : "non"));
    
    http_response_code(401);
    echo json_encode([
        'message' => 'Identifiants invalides',
        'status' => 401,
        'debug' => [
            'username_exists' => $username_exists,
            'submitted_username' => $username,
            'users_available' => $available_users
        ]
    ]);
}

error_log("=== FIN DE L'EXÉCUTION DE login-test.php ===");
?>
