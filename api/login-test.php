
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
$log_data = $data;
if (isset($log_data->password)) {
    $log_data->password = '********';
}
error_log("Données reçues: " . json_encode($log_data));

// Vérifier si les données sont présentes
if (!empty($data->username) && !empty($data->password)) {
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
                
                // Pour les tests, accepter aussi les mots de passe de développement
                $valid_password = false;
                
                // Pour l'utilisateur p71x6d_system, accepter à la fois le mot de passe haché et 'Trottinette43!'
                if ($user['identifiant_technique'] === 'p71x6d_system' && $data->password === 'Trottinette43!') {
                    error_log("Mot de passe spécial accepté pour p71x6d_system");
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
                // Pour les tests, accepter toujours "password123" pour les nouveaux utilisateurs
                else if ($data->password === 'password123') {
                    error_log("Mot de passe de test accepté pour nouvel utilisateur");
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
            
            // Si l'utilisateur n'est pas trouvé, on continue avec les utilisateurs de test ci-dessous
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
        if (isset($test_users[$username]) && $test_users[$username]['password'] === $password) {
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
        } else {
            error_log("Identifiants invalides pour: " . $username);
            
            if (isset($test_users[$username])) {
                error_log("Utilisateur test trouvé, mais mot de passe incorrect");
            } else {
                error_log("Utilisateur non trouvé dans la liste des utilisateurs test");
            }
            
            // Récupérer les utilisateurs disponibles dans la base de données pour les afficher dans l'erreur
            $available_users = array_keys($test_users);
            try {
                if ($database->is_connected) {
                    $query = "SELECT identifiant_technique, email FROM utilisateurs LIMIT 5";
                    $stmt = $db->prepare($query);
                    $stmt->execute();
                    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                        if (!empty($row['email']) && !in_array($row['email'], $available_users)) {
                            $available_users[] = $row['email'];
                        } else if (!empty($row['identifiant_technique']) && !in_array($row['identifiant_technique'], $available_users)) {
                            $available_users[] = $row['identifiant_technique'];
                        }
                    }
                }
            } catch (Exception $e) {
                error_log("Erreur lors de la récupération des utilisateurs disponibles: " . $e->getMessage());
            }
            
            http_response_code(401);
            echo json_encode([
                'message' => 'Identifiants invalides', 
                'status' => 401,
                'debug' => [
                    'username_exists' => isset($test_users[$username]),
                    'submitted_username' => $username,
                    'users_available' => $available_users
                ]
            ]);
        }
        
    } catch (Exception $e) {
        error_log("Erreur: " . $e->getMessage());
        // En cas d'erreur, on tombe sur les utilisateurs de test
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
                    'users_available' => array_keys($test_users),
                    'error' => $e->getMessage()
                ]
            ]);
        }
        exit;
    }
} else {
    // Si les données sont incomplètes
    http_response_code(400);
    echo json_encode(['message' => 'Données incomplètes', 'status' => 400]);
}
?>
