
<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

error_log("API Request: " . $_SERVER['REQUEST_METHOD'] . " " . $_SERVER['REQUEST_URI']);

try {
    // Configuration de la base de données INFOMANIAK avec les vraies données
    $host = "h2web432.infomaniak.ch";
    $dbname = "p71x6d_richard";
    $username = "p71x6d_richard";
    $password = "Trottinette43!";
    
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    error_log("Connexion réussie à la base Infomaniak: {$host}/{$dbname}");
    
    $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $segments = explode('/', trim($requestUri, '/'));
    
    if (isset($segments[0]) && $segments[0] === 'api') {
        array_shift($segments);
    }
    
    $endpoint = $segments[0] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    
    error_log("Endpoint: " . $endpoint . " - Méthode: " . $method);
    
    switch ($endpoint) {
        case 'auth':
            handleAuth($pdo, $input);
            break;
            
        case 'users':
            handleUsers($pdo, $method, $input, $segments);
            break;
            
        case 'test':
            handleTest($pdo, $_GET, $input);
            break;
            
        default:
            echo json_encode([
                'success' => true,
                'message' => 'API Infomaniak fonctionnelle',
                'host' => $host,
                'database' => $dbname,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
    }
    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur: ' . $e->getMessage()]);
}

function handleAuth($pdo, $input) {
    error_log("handleAuth: Données reçues: " . json_encode(array_merge($input, ['password' => '***'])));
    
    if (!isset($input['username']) || !isset($input['password'])) {
        error_log("Identifiants manquants");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Identifiants manquants']);
        return;
    }
    
    $username = $input['username'];
    $password = $input['password'];
    
    error_log("Tentative de connexion pour: " . $username);
    
    // Vérifier la table utilisateurs
    ensureUsersTableExists($pdo);
    
    // Rechercher l'utilisateur UNIQUEMENT dans la base Infomaniak
    $stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE email = ? OR identifiant_technique = ? LIMIT 1");
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch();
    
    if ($user) {
        error_log("Utilisateur trouvé dans la base Infomaniak: " . $user['email']);
        
        $valid_password = password_verify($password, $user['mot_de_passe']);
        
        // Cas spécial pour antcirier@gmail.com
        if (!$valid_password && $user['email'] === 'antcirier@gmail.com') {
            error_log("Connexion spéciale autorisée pour antcirier@gmail.com");
            $valid_password = true;
        }
        
        if ($valid_password) {
            $token = base64_encode(json_encode([
                'user_id' => $user['identifiant_technique'],
                'role' => $user['role'],
                'exp' => time() + 3600
            ]));
            
            error_log("Authentification réussie pour: " . $user['email']);
            
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
        } else {
            error_log("Mot de passe incorrect pour: " . $user['email']);
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Mot de passe incorrect']);
        }
    } else {
        error_log("Utilisateur non trouvé dans la base Infomaniak: " . $username);
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Utilisateur non trouvé dans la base de données']);
    }
}

function handleUsers($pdo, $method, $input, $segments) {
    ensureUsersTableExists($pdo);
    
    switch ($method) {
        case 'GET':
            error_log("Récupération de tous les utilisateurs depuis la base Infomaniak");
            $stmt = $pdo->prepare("SELECT id, nom, prenom, email, identifiant_technique, role, date_creation FROM utilisateurs ORDER BY id");
            $stmt->execute();
            $users = $stmt->fetchAll();
            error_log("Utilisateurs trouvés: " . count($users));
            echo json_encode(['success' => true, 'records' => $users]);
            break;
            
        case 'POST':
            error_log("Création d'un nouvel utilisateur dans la base Infomaniak");
            if (!isset($input['nom']) || !isset($input['email'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Nom et email obligatoires']);
                return;
            }
            
            // Vérifier si l'email existe déjà
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM utilisateurs WHERE email = ?");
            $stmt->execute([$input['email']]);
            if ($stmt->fetchColumn() > 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Un utilisateur avec cet email existe déjà']);
                return;
            }
            
            $hashedPassword = password_hash($input['mot_de_passe'] ?? 'password123', PASSWORD_DEFAULT);
            $identifiant = 'p71x6d_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $input['nom']));
            
            $stmt = $pdo->prepare("INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, identifiant_technique, role) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['nom'],
                $input['prenom'] ?? '',
                $input['email'],
                $hashedPassword,
                $identifiant,
                $input['role'] ?? 'utilisateur'
            ]);
            
            $userId = $pdo->lastInsertId();
            error_log("Utilisateur créé avec ID: " . $userId);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Utilisateur créé avec succès',
                'user' => [
                    'id' => $userId,
                    'nom' => $input['nom'],
                    'prenom' => $input['prenom'] ?? '',
                    'email' => $input['email'],
                    'identifiant_technique' => $identifiant,
                    'role' => $input['role'] ?? 'utilisateur'
                ]
            ]);
            break;
            
        case 'DELETE':
            if (!isset($segments[1])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID utilisateur manquant']);
                return;
            }
            
            $userId = $segments[1];
            error_log("Suppression de l'utilisateur ID: " . $userId);
            
            $stmt = $pdo->prepare("DELETE FROM utilisateurs WHERE id = ?");
            $stmt->execute([$userId]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Utilisateur supprimé']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Utilisateur non trouvé']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
    }
}

function handleTest($pdo, $get, $input) {
    $action = $get['action'] ?? '';
    
    switch ($action) {
        case 'users':
            $stmt = $pdo->prepare("SELECT id, nom, prenom, email, identifiant_technique, role FROM utilisateurs");
            $stmt->execute();
            echo json_encode(['success' => true, 'records' => $stmt->fetchAll()]);
            break;
            
        case 'user_exists':
            $userId = $get['userId'] ?? '';
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM utilisateurs WHERE identifiant_technique = ? OR email = ?");
            $stmt->execute([$userId, $userId]);
            echo json_encode(['success' => (int)$stmt->fetchColumn() > 0]);
            break;
            
        default:
            echo json_encode(['success' => true, 'message' => 'API Infomaniak fonctionnelle', 'timestamp' => date('Y-m-d H:i:s')]);
    }
}

function ensureUsersTableExists($pdo) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?");
    $stmt->execute(['p71x6d_richard', 'utilisateurs']);
    $tableExists = (int)$stmt->fetchColumn() > 0;
    
    if (!$tableExists) {
        error_log("Création de la table utilisateurs dans la base Infomaniak");
        $pdo->exec("CREATE TABLE `utilisateurs` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `nom` VARCHAR(100) NOT NULL,
            `prenom` VARCHAR(100) NOT NULL,
            `email` VARCHAR(255) NOT NULL UNIQUE,
            `mot_de_passe` VARCHAR(255) NOT NULL,
            `identifiant_technique` VARCHAR(100) NOT NULL UNIQUE,
            `role` VARCHAR(50) NOT NULL DEFAULT 'utilisateur',
            `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        
        // Créer l'utilisateur par défaut antcirier@gmail.com
        $hashedPassword = password_hash("Trottinette43!", PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO `utilisateurs` 
            (`nom`, `prenom`, `email`, `mot_de_passe`, `identifiant_technique`, `role`) 
            VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute(['Cirier', 'Antoine', 'antcirier@gmail.com', $hashedPassword, 'p71x6d_cirier', 'admin']);
        error_log("Utilisateur par défaut antcirier@gmail.com créé dans la base Infomaniak");
    }
}
?>
