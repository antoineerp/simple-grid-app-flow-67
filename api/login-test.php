
<?php
// En-têtes et configuration initiale
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

error_log("=== DEBUT DE L'EXÉCUTION DE login-test.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Gestion du preflight CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Vérification de la méthode POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Méthode non autorisée. Utilisez POST.', 'status' => 405]);
    exit;
}

// Récupération des données JSON
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Journalisation sécurisée
$log_data = $data;
if (isset($log_data['password'])) {
    $log_data['password'] = '******';
}
error_log("Données reçues: " . json_encode($log_data));

// Validation des données
if (!$data || !isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Données invalides', 'status' => 400]);
    error_log("Données invalides reçues");
    exit;
}

$username = $data['username'];
$password = $data['password'];

error_log("Tentative de connexion pour: " . $username);

try {
    // Configuration de la base de données
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $db_username = "p71x6d_system";
    $db_password = "Trottinette43!";
    
    // Connexion à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $db_username, $db_password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    error_log("Connexion à la base de données réussie, recherche de l'utilisateur: " . $username);
    
    // Recherche par email
    $query = "SELECT * FROM utilisateurs WHERE email = ? LIMIT 1";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    // Si pas trouvé par email, essayer par identifiant technique
    if (!$user) {
        $query = "SELECT * FROM utilisateurs WHERE identifiant_technique = ? LIMIT 1";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$username]);
        $user = $stmt->fetch();
    }
    
    // Vérification de l'utilisateur et du mot de passe
    if ($user) {
        error_log("Utilisateur trouvé en base de données: " . $user['email']);
        
        $valid_password = password_verify($password, $user['mot_de_passe']) || 
                         $password === $user['mot_de_passe'];
        
        if ($valid_password) {
            error_log("Authentification réussie pour l'utilisateur");
            
            // Génération du token
            $token = base64_encode(json_encode([
                'user' => $user['identifiant_technique'],
                'role' => $user['role'],
                'exp' => time() + 3600
            ]));
            
            // Réponse réussie
            http_response_code(200);
            echo json_encode([
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
        
        error_log("Mot de passe incorrect pour l'utilisateur");
    } else {
        error_log("Utilisateur non trouvé en base de données");
    }

    // Si on arrive ici, l'authentification a échoué
    http_response_code(401);
    echo json_encode([
        'message' => 'Identifiants invalides',
        'status' => 401
    ]);
    
} catch (PDOException $e) {
    error_log("Erreur de base de données: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'message' => 'Erreur de base de données: ' . $e->getMessage(),
        'status' => 500
    ]);
}

error_log("=== FIN DE L'EXÉCUTION DE login-test.php ===");
?>
