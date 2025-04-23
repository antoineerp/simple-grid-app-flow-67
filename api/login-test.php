
<?php
// Fichier de test de login simplifié
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Journaliser l'accès pour le diagnostic
error_log("=== EXÉCUTION DE login-test.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Afficher un message de test et les infos disponibles si c'est une requête GET
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $test_users = [
        'admin' => ['password' => 'admin123', 'role' => 'admin'],
        'p71x6d_system' => ['password' => 'Trottinette43!', 'role' => 'admin'],
        'antcirier@gmail.com' => ['password' => 'password123', 'role' => 'admin'],
        'p71x6d_dupont' => ['password' => 'manager456', 'role' => 'gestionnaire'],
        'p71x6d_martin' => ['password' => 'user789', 'role' => 'utilisateur']
    ];
    
    http_response_code(200);
    echo json_encode([
        'message' => 'Service de test de connexion FormaCert',
        'status' => 200,
        'diagnostic' => [
            'timestamp' => date('Y-m-d H:i:s'),
            'ip_client' => $_SERVER['REMOTE_ADDR'],
            'methode' => $_SERVER['REQUEST_METHOD'],
            'uri' => $_SERVER['REQUEST_URI'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Non disponible',
            'php_version' => phpversion()
        ],
        'usage' => [
            'method' => 'POST',
            'content_type' => 'application/json',
            'body_format' => ['username' => 'string', 'password' => 'string']
        ],
        'test_users' => array_map(function($user) {
            return ['password' => $user['password'], 'role' => $user['role']];
        }, $test_users),
        'exemple_curl' => 'curl -X POST ' . (isset($_SERVER["HTTPS"]) ? "https" : "http") . '://' . $_SERVER["HTTP_HOST"] . $_SERVER["REQUEST_URI"] . ' -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin123"}\''
    ]);
    exit;
}

// Si ce n'est pas une requête POST après ce point, renvoyer une erreur
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Méthode non autorisée', 'status' => 405]);
    exit;
}

// Récupérer les données POST
$json_input = file_get_contents("php://input");
$data = json_decode($json_input);

// Journaliser les données reçues (masquer le mot de passe)
$log_data = $data;
if (isset($log_data->password)) {
    $log_data->password = '********';
}
error_log("Données reçues: " . json_encode($log_data));

// Vérifier si les données sont présentes
if (!empty($data->username) && !empty($data->password)) {
    // Liste des utilisateurs de test autorisés
    $test_users = [
        'admin' => ['password' => 'admin123', 'role' => 'admin'],
        'p71x6d_system' => ['password' => 'Trottinette43!', 'role' => 'admin'],
        'antcirier@gmail.com' => ['password' => 'password123', 'role' => 'admin'],
        'p71x6d_dupont' => ['password' => 'manager456', 'role' => 'gestionnaire'],
        'p71x6d_martin' => ['password' => 'user789', 'role' => 'utilisateur']
    ];
    
    $username = $data->username;
    $password = $data->password;
    
    error_log("Tentative de connexion pour: " . $username . " avec mot de passe fourni");
    
    // Debug: vérifier quels utilisateurs sont disponibles
    error_log("Utilisateurs disponibles: " . implode(", ", array_keys($test_users)));
    
    // Vérifier si l'utilisateur existe et si le mot de passe correspond
    if (isset($test_users[$username]) && $test_users[$username]['password'] === $password) {
        // Générer un token fictif
        $token = base64_encode(json_encode([
            'user' => $username,
            'role' => $test_users[$username]['role'],
            'exp' => time() + 3600
        ]));
        
        error_log("Connexion réussie pour: " . $username);
        
        http_response_code(200);
        echo json_encode([
            'message' => 'Connexion réussie',
            'token' => $token,
            'user' => [
                'id' => 0,
                'nom' => explode('_', $username)[1] ?? $username,
                'prenom' => '',
                'email' => $username . '@example.com',
                'identifiant_technique' => $username,
                'role' => $test_users[$username]['role']
            ]
        ]);
    } else {
        error_log("Identifiants invalides pour: " . $username);
        
        if (isset($test_users[$username])) {
            error_log("Utilisateur trouvé, mais mot de passe incorrect");
        } else {
            error_log("Utilisateur non trouvé dans la liste");
        }
        
        http_response_code(401);
        echo json_encode([
            'message' => 'Identifiants invalides', 
            'status' => 401,
            'debug' => [
                'username_exists' => isset($test_users[$username]),
                'submitted_username' => $username,
                'users_available' => array_keys($test_users)
            ]
        ]);
    }
} else {
    error_log("Données incomplètes reçues");
    http_response_code(400);
    echo json_encode([
        'message' => 'Données incomplètes', 
        'status' => 400,
        'debug' => [
            'received_data' => $json_input,
            'expected' => ['username' => 'string', 'password' => 'string']
        ]
    ]);
}
?>
