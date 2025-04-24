
<?php
// Forcer le bon démarrage du script
ob_start();

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

// Récupérer les données POST
$json_input = file_get_contents("php://input");
$data = json_decode($json_input);

// Journaliser les données reçues (masquer le mot de passe)
$log_data = clone $data;
if (isset($log_data->password)) {
    $log_data->password = '********';
}
error_log("Données reçues: " . json_encode($log_data));

// Vérifier si les données sont présentes
if (!empty($data->username) && !empty($data->password)) {
    error_log("Tentative d'authentification pour: " . $data->username . " avec mot de passe: " . substr($data->password, 0, 3) . "***");
    try {
        // Inclure la configuration de base de données
        require_once 'config/database.php';
        
        // Créer une instance de la base de données
        $database = new Database();
        $db = $database->getConnection(false); // Ne pas exiger une connexion réussie
        
        if ($database->is_connected) {
            // Vérifier si l'utilisateur existe par identifiant technique OU par email
            $query = "SELECT id, nom, prenom, email, mot_de_passe, identifiant_technique, role 
                     FROM utilisateurs 
                     WHERE identifiant_technique = ? OR email = ?";
            
            $stmt = $db->prepare($query);
            $stmt->execute([$data->username, $data->username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                error_log("Utilisateur trouvé dans la base de données: " . ($user['identifiant_technique'] ?: $user['email']));
                error_log("Vérification du mot de passe pour: " . ($user['identifiant_technique'] ?: $user['email']));
                error_log("Type du mot de passe stocké: " . gettype($user['mot_de_passe']));
                error_log("Format du mot de passe stocké (début): " . substr($user['mot_de_passe'], 0, 20));
                error_log("Format du mot de passe fourni: " . substr($data->password, 0, 3) . '***');
                
                // Pour les tests, accepter aussi les mots de passe de développement
                $valid_password = false;
                
                // Pour l'utilisateur p71x6d_system, accepter à la fois le mot de passe haché et 'Trottinette43!'
                if ($user['identifiant_technique'] === 'p71x6d_system' && $data->password === 'Trottinette43!') {
                    error_log("Mot de passe spécial accepté pour p71x6d_system");
                    $valid_password = true;
                }
                // Pour les utilisateurs ayant l'email "antcirier@gmail.com", accepter le mot de passe 'password123'
                else if ($user['email'] === 'antcirier@gmail.com' && ($data->password === 'password123' || $data->password === 'Password123!')) {
                    error_log("Mot de passe spécial accepté pour antcirier@gmail.com");
                    $valid_password = true;
                } 
                // Vérifier le mot de passe avec password_verify (si le mot de passe est haché)
                else if (password_verify($data->password, $user['mot_de_passe'])) {
                    error_log("Mot de passe vérifié avec succès via password_verify()");
                    $valid_password = true;
                }
                // Si c'est un mot de passe non haché, comparer directement
                else if ($data->password === $user['mot_de_passe']) {
                    error_log("Mot de passe vérifié avec succès via comparaison directe");
                    $valid_password = true;
                }
                // Pour les tests, accepter toujours certains mots de passe spécifiques
                else if (in_array($data->password, ['admin123', 'manager456', 'user789', 'password123', 'Password123!']) && 
                        (strpos($user['identifiant_technique'], 'admin') !== false || 
                         strpos($user['identifiant_technique'], 'system') !== false || 
                         strpos($user['email'], 'antcirier') !== false)) {
                    error_log("Mot de passe de test accepté pour utilisateur spécial");
                    $valid_password = true;
                }
                
                if ($valid_password) {
                    // Générer un token JWT
                    // Puisque JwtHandler est défini dans utils/JwtHandler.php, nous l'incluons
                    require_once 'utils/JwtHandler.php';
                    $jwt = new JwtHandler();
                    
                    // Données à encoder dans le JWT
                    $token_data = [
                        'id' => $user['id'],
                        'identifiant_technique' => $user['identifiant_technique'],
                        'role' => $user['role']
                    ];
                    
                    // Générer le token JWT
                    $token = $jwt->encode($token_data);
                    
                    error_log("Connexion réussie pour: " . $data->username);
                    
                    // Réponse
                    http_response_code(200);
                    echo json_encode([
                        'message' => 'Connexion réussie',
                        'token' => $token,
                        'user' => [
                            'id' => $user['id'],
                            'nom' => $user['nom'],
                            'prenom' => $user['prenom'],
                            'email' => $user['email'],
                            'identifiant_technique' => $user['identifiant_technique'] ?: $user['email'],
                            'role' => $user['role']
                        ]
                    ]);
                    exit;
                } else {
                    error_log("Mot de passe incorrect pour: " . ($user['identifiant_technique'] ?: $user['email']));
                    error_log("Mot de passe fourni: " . substr($data->password, 0, 3) . '***');
                    error_log("Format du mot de passe stocké: " . substr($user['mot_de_passe'], 0, 10) . '...');
                    http_response_code(401);
                    echo json_encode([
                        'message' => 'Identifiants invalides',
                        'status' => 401,
                        'reason' => 'password_mismatch'
                    ]);
                    exit;
                }
            } else {
                error_log("Utilisateur non trouvé dans la base de données: " . $data->username);
            }
        } else {
            error_log("Connexion à la base de données impossible: " . ($database->connection_error ?? 'Erreur inconnue'));
        }
        
        // Liste des utilisateurs de test autorisés (si l'utilisateur n'est pas en base ou si la connexion BDD a échoué)
        $test_users = [
            'admin' => ['password' => 'admin123', 'role' => 'admin'],
            'p71x6d_system' => ['password' => 'Trottinette43!', 'role' => 'admin'],
            'antcirier@gmail.com' => ['password' => 'password123', 'role' => 'admin'],
            'p71x6d_dupont' => ['password' => 'manager456', 'role' => 'gestionnaire'],
            'p71x6d_martin' => ['password' => 'user789', 'role' => 'utilisateur']
        ];
        
        $username = $data->username;
        $password = $data->password;
        
        error_log("Tentative de connexion pour: " . $username . " avec mot de passe fourni via système de test");
        
        // Vérifier si l'utilisateur existe et si le mot de passe correspond
        if (isset($test_users[$username]) && (
            $test_users[$username]['password'] === $password || 
            ($username === 'antcirier@gmail.com' && ($password === 'password123' || $password === 'Password123!'))
        )) {
            // Générer un token fictif
            $token = base64_encode(json_encode([
                'user' => $username,
                'role' => $test_users[$username]['role'],
                'exp' => time() + 3600
            ]));
            
            error_log("Connexion réussie pour: " . $username . " (utilisateur test)");
            
            http_response_code(200);
            echo json_encode([
                'message' => 'Connexion réussie (utilisateur de test)',
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
            exit;
        } else {
            error_log("Identifiants invalides pour: " . $username);
            
            http_response_code(401);
            echo json_encode([
                'message' => 'Identifiants invalides', 
                'status' => 401
            ]);
            exit;
        }
        
    } catch (Exception $e) {
        error_log("Erreur: " . $e->getMessage());
        // En cas d'erreur, on renvoie une réponse d'erreur
        http_response_code(500);
        echo json_encode([
            'message' => 'Erreur serveur', 
            'error' => $e->getMessage()
        ]);
        exit;
    }
} else {
    // Si les données sont incomplètes
    http_response_code(400);
    echo json_encode(['message' => 'Données incomplètes', 'status' => 400]);
    exit;
}

error_log("=== FIN DE L'EXÉCUTION DE auth.php ===");
ob_end_flush();
?>
