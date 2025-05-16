
<?php
// Script de diagnostic pour l'authentification
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Activer l'affichage des erreurs pour ce test
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    // Informations Infomaniak en dur
    $host = 'p71x6d.myd.infomaniak.com';
    $db_name = 'p71x6d_richard';
    $username = 'p71x6d_richard';
    $password = 'Trottinette43!';
    
    // Récupérer la méthode et les données
    $method = $_SERVER['REQUEST_METHOD'];
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Masquer les mots de passe pour le log
    $safe_data = $data;
    if (isset($safe_data['password'])) {
        $safe_data['password'] = '********';
    }
    
    // Tester la connexion à la base de données
    $dsn = "mysql:host=$host;dbname=$db_name;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    $db_status = "Connexion réussie";
    
    // Vérifier si la table utilisateurs existe
    $table_exists = false;
    $stmt = $pdo->query("SHOW TABLES LIKE 'utilisateurs'");
    if ($stmt->rowCount() > 0) {
        $table_exists = true;
    }
    
    // Si l'email "antcirier@gmail.com" est fourni et le mot de passe correspond
    if (isset($data['email']) && $data['email'] === 'antcirier@gmail.com' && 
        isset($data['password']) && ($data['password'] === 'Trottinette43!' || $data['password'] === 'password123')) {
        
        // Générer un simple token pour tester
        $token = base64_encode(json_encode([
            'user' => [
                'id' => '999',
                'username' => 'antcirier@gmail.com',
                'identifiant_technique' => 'p71x6d_cirier',
                'email' => 'antcirier@gmail.com',
                'role' => 'admin',
                'nom' => 'Cirier',
                'prenom' => 'Antoine'
            ],
            'exp' => time() + 3600
        ]));
        
        echo json_encode([
            'success' => true,
            'message' => 'Connexion de test réussie',
            'token' => $token,
            'user' => [
                'id' => '999',
                'nom' => 'Cirier',
                'prenom' => 'Antoine',
                'email' => 'antcirier@gmail.com',
                'identifiant_technique' => 'p71x6d_cirier',
                'role' => 'admin'
            ],
            'debug' => [
                'method' => $method,
                'data_received' => $safe_data,
                'db_status' => $db_status,
                'table_exists' => $table_exists
            ]
        ]);
        exit;
    }
    
    // Recherche de l'utilisateur dans la base
    if (isset($data['email']) && isset($data['password']) && $table_exists) {
        $email = $data['email'];
        $password = $data['password'];
        
        $stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE email = ? OR identifiant_technique = ? LIMIT 1");
        $stmt->execute([$email, $email]);
        $user = $stmt->fetch();
        
        if ($user) {
            $is_valid = password_verify($password, $user['mot_de_passe']);
            
            // Accepter aussi le mot de passe en clair pour la compatibilité
            if (!$is_valid && $password === $user['mot_de_passe']) {
                $is_valid = true;
            }
            
            if ($is_valid) {
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
                    'message' => 'Connexion réussie depuis la base de données',
                    'token' => $token,
                    'user' => [
                        'id' => $user['id'],
                        'nom' => $user['nom'],
                        'prenom' => $user['prenom'],
                        'email' => $user['email'],
                        'identifiant_technique' => $user['identifiant_technique'],
                        'role' => $user['role']
                    ],
                    'debug' => [
                        'method' => $method,
                        'data_received' => $safe_data,
                        'db_status' => $db_status,
                        'table_exists' => $table_exists
                    ]
                ]);
                exit;
            }
        }
    }
    
    // Réponse par défaut
    echo json_encode([
        'success' => false,
        'message' => 'Identifiants invalides',
        'debug' => [
            'method' => $method,
            'data_received' => $safe_data,
            'db_status' => $db_status,
            'table_exists' => $table_exists
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage(),
        'debug' => [
            'error_type' => get_class($e),
            'error_code' => $e->getCode(),
            'error_line' => $e->getLine(),
            'error_file' => $e->getFile()
        ]
    ]);
}
?>
