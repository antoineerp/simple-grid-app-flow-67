
<?php
// Fichier de test de login simplifié
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Include database configuration
require_once 'config/database.php';

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
    // Récupérer la liste des utilisateurs dynamiquement depuis la base de données
    $users_in_db = [];
    try {
        // Créer une instance de la base de données
        $database = new Database();
        $db = $database->getConnection(false); // Ne pas exiger une connexion réussie
        
        if ($database->is_connected) {
            $query = "SELECT identifiant_technique, email FROM utilisateurs";
            $stmt = $db->prepare($query);
            $stmt->execute();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $users_in_db[] = $row['email'] ?: $row['identifiant_technique'];
            }
            error_log("Utilisateurs trouvés en base de données: " . implode(", ", $users_in_db));
        } else {
            error_log("Impossible de se connecter à la base pour lister les utilisateurs");
        }
    } catch (Exception $e) {
        error_log("Erreur lors de la récupération des utilisateurs: " . $e->getMessage());
    }
    
    // Liste des utilisateurs de test (fallback)
    $test_users = [
        'admin' => ['password' => 'admin123', 'role' => 'admin'],
        'p71x6d_system' => ['password' => 'Trottinette43!', 'role' => 'admin'],
        'antcirier@gmail.com' => ['password' => 'password123', 'role' => 'admin'],
        'p71x6d_dupont' => ['password' => 'manager456', 'role' => 'gestionnaire'],
        'p71x6d_martin' => ['password' => 'user789', 'role' => 'utilisateur']
    ];
    
    // Ajouter les utilisateurs de la base à la liste
    if (!empty($users_in_db)) {
        foreach ($users_in_db as $user) {
            if (!isset($test_users[$user])) {
                $test_users[$user] = ['password' => 'password123', 'role' => 'utilisateur'];
            }
        }
    }
    
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
        'available_usernames' => array_keys($test_users),
        'server_info' => [
            'method' => $_SERVER['REQUEST_METHOD'],
            'uri' => $_SERVER['REQUEST_URI'],
            'time' => date('Y-m-d H:i:s')
        ],
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
$log_data = clone $data;
if (isset($log_data->password)) {
    $log_data->password = '********';
}
error_log("Données reçues: " . json_encode($log_data ?? $json_input));

// Vérifier si les données sont présentes
if (!empty($data->username) && !empty($data->password)) {
    error_log("Tentative d'authentification pour: " . $data->username . " avec mot de passe: " . substr($data->password, 0, 3) . "***");
    
    // Liste des utilisateurs de test autorisés pour tester rapidement
    $test_users = [
        'admin' => ['password' => 'admin123', 'role' => 'admin'],
        'p71x6d_system' => ['password' => 'Trottinette43!', 'role' => 'admin'],
        'antcirier@gmail.com' => ['password' => ['password123', 'Password123!'], 'role' => 'admin'],
        'p71x6d_dupont' => ['password' => 'manager456', 'role' => 'gestionnaire'],
        'p71x6d_martin' => ['password' => 'user789', 'role' => 'utilisateur']
    ];
    
    try {
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
                error_log("Format du mot de passe fourni: " . substr($data->password, 0, 3) . '***');
                
                // Pour les tests, accepter aussi les mots de passe de développement
                $valid_password = false;
                
                // Pour l'utilisateur p71x6d_system, accepter mot de passe 'Trottinette43!'
                if ($user['identifiant_technique'] === 'p71x6d_system' && $data->password === 'Trottinette43!') {
                    error_log("Mot de passe spécial accepté pour p71x6d_system");
                    $valid_password = true;
                }
                // Pour antcirier@gmail.com, accepter password123 ou Password123!
                else if ($user['email'] === 'antcirier@gmail.com' && 
                         ($data->password === 'password123' || $data->password === 'Password123!')) {
                    error_log("Mot de passe spécial accepté pour antcirier@gmail.com");
                    $valid_password = true;
                } 
                // Vérifier le mot de passe avec password_verify (si le mot de passe est haché)
                else if ($user['mot_de_passe'] && password_verify($data->password, $user['mot_de_passe'])) {
                    error_log("Mot de passe vérifié avec succès via password_verify()");
                    $valid_password = true;
                }
                // Si c'est un mot de passe non haché, comparer directement
                else if ($data->password === $user['mot_de_passe']) {
                    error_log("Mot de passe vérifié avec succès via comparaison directe");
                    $valid_password = true;
                }
                
                if ($valid_password) {
                    // Générer un token fictif
                    $token = base64_encode(json_encode([
                        'user' => $user['identifiant_technique'] ?: $user['email'],
                        'role' => $user['role'],
                        'exp' => time() + 3600
                    ]));
                    
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
                }
            }
        }
        
        // Si nous arrivons ici, c'est que l'utilisateur n'a pas été trouvé en BDD
        // ou que la connexion à la BDD a échoué
        // Utilisons les utilisateurs de test définis au-dessus
        
        $username = $data->username;
        $password = $data->password;
        
        error_log("Authentification via liste de test pour: " . $username);
        
        // Vérification spéciale pour antcirier@gmail.com
        if ($username === 'antcirier@gmail.com' && 
            ($password === 'password123' || $password === 'Password123!')) {
            
            error_log("Connexion spéciale acceptée pour antcirier@gmail.com avec password: " . substr($password, 0, 3) . "***");
            
            // Générer un token fictif
            $token = base64_encode(json_encode([
                'user' => $username,
                'role' => 'admin',
                'exp' => time() + 3600
            ]));
            
            http_response_code(200);
            echo json_encode([
                'message' => 'Connexion réussie (utilisateur de test)',
                'token' => $token,
                'user' => [
                    'id' => 999,
                    'nom' => 'Cirier',
                    'prenom' => 'Antoine',
                    'email' => $username,
                    'identifiant_technique' => $username,
                    'role' => 'admin'
                ]
            ]);
            exit;
        }
        
        // Vérifier les autres utilisateurs de test
        if (isset($test_users[$username])) {
            $test_password = $test_users[$username]['password'];
            $valid = false;
            
            // Si password est un tableau, vérifier chaque valeur
            if (is_array($test_password)) {
                $valid = in_array($password, $test_password);
            } else {
                $valid = ($password === $test_password);
            }
            
            if ($valid) {
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
                        'nom' => explode('@', $username)[0] ?? $username,
                        'prenom' => '',
                        'email' => $username,
                        'identifiant_technique' => $username,
                        'role' => $test_users[$username]['role']
                    ]
                ]);
                exit;
            }
        }
        
        // Si nous arrivons ici, c'est que l'authentification a échoué
        error_log("Identifiants invalides pour: " . $username);
        
        if (isset($test_users[$username])) {
            error_log("Utilisateur trouvé, mais mot de passe incorrect");
            error_log("Mot de passe fourni: " . substr($password, 0, 3) . "***");
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
        
    } catch (Exception $e) {
        error_log("Erreur lors de l'authentification: " . $e->getMessage());
        
        // En cas d'erreur, vérifier quand même les utilisateurs de test
        $username = $data->username;
        $password = $data->password;
        
        // Vérification spéciale pour antcirier@gmail.com
        if ($username === 'antcirier@gmail.com' && 
            ($password === 'password123' || $password === 'Password123!')) {
            
            // Générer un token fictif
            $token = base64_encode(json_encode([
                'user' => $username,
                'role' => 'admin',
                'exp' => time() + 3600
            ]));
            
            http_response_code(200);
            echo json_encode([
                'message' => 'Connexion réussie (mode fallback)',
                'token' => $token,
                'user' => [
                    'id' => 999,
                    'nom' => 'Cirier',
                    'prenom' => 'Antoine',
                    'email' => $username,
                    'identifiant_technique' => $username,
                    'role' => 'admin'
                ]
            ]);
            exit;
        }
        
        // Autres utilisateurs de test (plus simple)
        if (isset($test_users[$username])) {
            $test_password = $test_users[$username]['password'];
            $valid = false;
            
            if (is_array($test_password)) {
                $valid = in_array($password, $test_password);
            } else {
                $valid = ($password === $test_password);
            }
            
            if ($valid) {
                // Générer un token fictif
                $token = base64_encode(json_encode([
                    'user' => $username,
                    'role' => $test_users[$username]['role'],
                    'exp' => time() + 3600
                ]));
                
                http_response_code(200);
                echo json_encode([
                    'message' => 'Connexion réussie (fallback)',
                    'token' => $token,
                    'user' => [
                        'id' => 0,
                        'nom' => explode('@', $username)[0] ?? $username,
                        'prenom' => '',
                        'email' => $username,
                        'identifiant_technique' => $username,
                        'role' => $test_users[$username]['role']
                    ]
                ]);
                exit;
            }
        }
        
        // Si nous arrivons ici, l'authentification a échoué
        http_response_code(401);
        echo json_encode([
            'message' => 'Identifiants invalides', 
            'status' => 401,
            'debug' => [
                'username_exists' => isset($test_users[$username]),
                'submitted_username' => $username,
                'users_available' => array_keys($test_users),
                'error' => $e->getMessage()
            ]
        ]);
    }
} else {
    // Si les données sont incomplètes
    http_response_code(400);
    echo json_encode(['message' => 'Données incomplètes', 'status' => 400]);
}

error_log("=== FIN DE L'EXÉCUTION DE login-test.php ===");
?>
