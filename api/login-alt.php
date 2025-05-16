
<?php
// Route de compatibilité pour les clients qui appellent login.php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journaliser l'appel
error_log("=== APPEL à login-alt.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Vérifier si la méthode est POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['message' => 'Méthode non autorisée. Utilisez POST pour l\'authentification.', 'status' => 405]);
    exit;
}

// Récupérer les données JSON
$json_input = file_get_contents("php://input");
$data = json_decode($json_input, true);

// Informations de connexion Infomaniak
$host = 'p71x6d.myd.infomaniak.com';
$db_name = 'p71x6d_richard';
$username = 'p71x6d_richard';
$password = 'Trottinette43!';

// Récupérer les identifiants
$user_email = isset($data['email']) ? $data['email'] : (isset($data['username']) ? $data['username'] : null);
$user_password = isset($data['password']) ? $data['password'] : null;

error_log("Tentative d'authentification pour: " . ($user_email ?? 'non défini'));

// Vérifier si les données nécessaires sont présentes
if (!$user_email || !$user_password) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email/username et mot de passe requis']);
    exit;
}

// Vérification spéciale pour antcirier@gmail.com
if ($user_email === 'antcirier@gmail.com' && 
    ($user_password === 'password123' || $user_password === 'Password123!' || $user_password === 'Trottinette43!')) {
    
    error_log("Connexion spéciale acceptée pour antcirier@gmail.com");
    
    // Identifiant technique standardisé
    $identifiant_technique = 'p71x6d_cirier';
    
    // Générer un token simple
    $token = base64_encode(json_encode([
        'user' => [
            'id' => '999',
            'username' => $user_email,
            'identifiant_technique' => $identifiant_technique,
            'email' => $user_email,
            'role' => 'admin',
            'nom' => 'Cirier',
            'prenom' => 'Antoine'
        ],
        'exp' => time() + 3600
    ]));
    
    // Envoyer la réponse
    echo json_encode([
        'success' => true,
        'message' => 'Connexion réussie',
        'token' => $token,
        'user' => [
            'id' => '999',
            'nom' => 'Cirier',
            'prenom' => 'Antoine',
            'email' => $user_email,
            'identifiant_technique' => $identifiant_technique,
            'role' => 'admin'
        ]
    ]);
    exit;
}

try {
    // Tenter une connexion à la base de données
    $dsn = "mysql:host=$host;dbname=$db_name;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Chercher l'utilisateur
    $stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE email = ? OR identifiant_technique = ? LIMIT 1");
    $stmt->execute([$user_email, $user_email]);
    $user = $stmt->fetch();
    
    if ($user) {
        $valid_password = password_verify($user_password, $user['mot_de_passe']);
        
        // Accepter les mots de passe en clair pour la compatibilité
        if (!$valid_password && $user_password === $user['mot_de_passe']) {
            $valid_password = true;
        }
        
        if ($valid_password) {
            // Générer un token simple
            $token = base64_encode(json_encode([
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['email'],
                    'identifiant_technique' => $user['identifiant_technique'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'nom' => $user['nom'],
                    'prenom' => $user['prenom']
                ],
                'exp' => time() + 3600
            ]));
            
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
        }
    }
    
    // Si l'authentification échoue
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Identifiants invalides']);
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans login-alt.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données']);
} catch (Exception $e) {
    error_log("Exception dans login-alt.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
}
?>
