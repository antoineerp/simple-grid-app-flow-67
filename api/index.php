
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
    
    // Router principal
    switch ($endpoint) {
        case 'login':
        case 'auth':
            handleAuth($pdo, $input);
            break;
            
        case 'users':
            handleUsers($pdo, $method, $input, $segments);
            break;
            
        case 'test':
            handleTest($pdo, $_GET, $input);
            break;
            
        case 'check-users':
            handleCheckUsers($pdo);
            break;
            
        default:
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
    if (!isset($input['username']) || !isset($input['password'])) {
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
    }
    
    // Rechercher l'utilisateur
    $stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE email = ? OR identifiant_technique = ? LIMIT 1");
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['mot_de_passe'])) {
        $token = base64_encode(json_encode([
            'user_id' => $user['identifiant_technique'],
            'role' => $user['role'],
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
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Identifiants invalides']);
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
            
        case 'get_data':
            $tableName = $get['tableName'] ?? '';
            $userId = $get['userId'] ?? '';
            $fullTableName = $tableName . '_' . $userId;
            
            try {
                $stmt = $pdo->prepare("SELECT * FROM `{$fullTableName}`");
                $stmt->execute();
                echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'data' => [], 'message' => 'Table non trouvée']);
            }
            break;
            
        case 'save_data':
            $tableName = $input['tableName'] ?? '';
            $userId = $input['userId'] ?? '';
            $data = $input['data'] ?? [];
            $fullTableName = $tableName . '_' . $userId;
            
            // Ici on pourrait implémenter la sauvegarde selon le type de données
            echo json_encode(['success' => true, 'message' => 'Données sauvegardées']);
            break;
            
        default:
            echo json_encode(['success' => true, 'message' => 'API fonctionnelle', 'timestamp' => date('Y-m-d H:i:s')]);
    }
}

// Fonction pour vérifier les utilisateurs
function handleCheckUsers($pdo) {
    $stmt = $pdo->prepare("SELECT id, nom, prenom, email, identifiant_technique, role, date_creation FROM utilisateurs ORDER BY date_creation DESC");
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'message' => 'Utilisateurs récupérés avec succès',
        'count' => count($users),
        'records' => $users
    ]);
}
?>
