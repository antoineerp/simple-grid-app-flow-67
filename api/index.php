
<?php
// Point d'entrée unique pour toutes les requêtes API
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Gestion CORS preflight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Journalisation
error_log("API Request: " . $_SERVER['REQUEST_METHOD'] . " " . $_SERVER['REQUEST_URI']);

try {
    // Configuration de la base de données
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_richard";
    $username = "p71x6d_richard";
    $password = "Trottinette43!";
    
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Analyser l'URL pour déterminer l'action
    $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $segments = explode('/', trim($requestUri, '/'));
    
    // Supprimer 'api' du chemin si présent
    if (isset($segments[0]) && $segments[0] === 'api') {
        array_shift($segments);
    }
    
    $endpoint = $segments[0] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    
    error_log("Endpoint demandé: " . $endpoint . " - Méthode: " . $method);
    
    // Router principal
    switch ($endpoint) {
        case 'auth':
            error_log("Traitement de l'authentification");
            handleAuth($pdo, $input);
            break;
            
        case 'users':
            error_log("Traitement des utilisateurs");
            handleUsers($pdo, $method, $input, $segments);
            break;
            
        case 'test':
            handleTest($pdo, $_GET, $input);
            break;
            
        default:
            error_log("Endpoint non trouvé: " . $endpoint);
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint non trouvé: ' . $endpoint]);
    }
    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur: ' . $e->getMessage()]);
}

// Fonction d'authentification
function handleAuth($pdo, $input) {
    error_log("handleAuth appelée avec les données: " . json_encode(array_merge($input, ['password' => '***'])));
    
    if (!isset($input['username']) || !isset($input['password'])) {
        error_log("Identifiants manquants dans la requête");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Identifiants manquants']);
        return;
    }
    
    $username = $input['username'];
    $password = $input['password'];
    
    error_log("Tentative de connexion: " . $username);
    
    // Vérifier si la table utilisateurs existe
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?");
    $stmt->execute(['p71x6d_richard', 'utilisateurs']);
    $tableExists = (int)$stmt->fetchColumn() > 0;
    
    if (!$tableExists) {
        error_log("Table utilisateurs n'existe pas, création...");
        // Créer la table utilisateurs
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
        
        // Créer l'utilisateur par défaut
        $hashedPassword = password_hash("Trottinette43!", PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO `utilisateurs` 
            (`nom`, `prenom`, `email`, `mot_de_passe`, `identifiant_technique`, `role`) 
            VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute(['Cirier', 'Antoine', 'antcirier@gmail.com', $hashedPassword, 'p71x6d_cirier', 'admin']);
        error_log("Utilisateur par défaut créé");
    }
    
    // Rechercher l'utilisateur
    $stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE email = ? OR identifiant_technique = ? LIMIT 1");
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch();
    
    if ($user) {
        error_log("Utilisateur trouvé: " . $user['email']);
        
        $valid_password = password_verify($password, $user['mot_de_passe']);
        
        // Pour antcirier@gmail.com, accepter n'importe quel mot de passe en développement
        if (!$valid_password && $user['email'] === 'antcirier@gmail.com') {
            error_log("Connexion spéciale pour antcirier@gmail.com");
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
            echo json_encode(['success' => false, 'message' => 'Identifiants invalides']);
        }
    } else {
        error_log("Utilisateur non trouvé: " . $username);
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Utilisateur non trouvé']);
    }
}

// Fonction de gestion des utilisateurs
function handleUsers($pdo, $method, $input, $segments) {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->prepare("SELECT id, nom, prenom, email, identifiant_technique, role, date_creation FROM utilisateurs");
            $stmt->execute();
            $users = $stmt->fetchAll();
            echo json_encode(['success' => true, 'records' => $users]);
            break;
            
        case 'POST':
            if (!isset($input['nom']) || !isset($input['email'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Données manquantes']);
                return;
            }
            
            $hashedPassword = password_hash($input['mot_de_passe'] ?? 'password123', PASSWORD_DEFAULT);
            $identifiant = 'p71x6d_' . strtolower($input['nom']);
            
            $stmt = $pdo->prepare("INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, identifiant_technique, role) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['nom'],
                $input['prenom'] ?? '',
                $input['email'],
                $hashedPassword,
                $identifiant,
                $input['role'] ?? 'utilisateur'
            ]);
            
            echo json_encode(['success' => true, 'message' => 'Utilisateur créé']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
    }
}

// Fonction de test et actions diverses
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
            echo json_encode(['success' => true, 'message' => 'API fonctionnelle', 'timestamp' => date('Y-m-d H:i:s')]);
    }
}
?>
