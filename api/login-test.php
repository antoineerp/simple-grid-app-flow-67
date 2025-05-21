
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
    // Configuration de la base de données - MODIFIÉ pour utiliser p71x6d_richard
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_richard"; // Changé de p71x6d_system à p71x6d_richard
    $db_username = "p71x6d_richard"; // Changé pour utiliser le même utilisateur
    $db_password = "Trottinette43!";
    
    // Connexion à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $db_username, $db_password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    error_log("Connexion à la base de données réussie, recherche de l'utilisateur: " . $username);
    
    // Vérifier si la table utilisateurs existe
    $tableExistsQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?";
    $stmt = $pdo->prepare($tableExistsQuery);
    $stmt->execute([$dbname, 'utilisateurs']);
    $tableExists = (int)$stmt->fetchColumn() > 0;
    
    if (!$tableExists) {
        error_log("La table 'utilisateurs' n'existe pas, création en cours...");
        
        // Créer la table utilisateurs
        $createTableQuery = "CREATE TABLE `utilisateurs` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `nom` VARCHAR(100) NOT NULL,
            `prenom` VARCHAR(100) NOT NULL,
            `email` VARCHAR(255) NOT NULL UNIQUE,
            `mot_de_passe` VARCHAR(255) NOT NULL,
            `identifiant_technique` VARCHAR(100) NOT NULL UNIQUE,
            `role` VARCHAR(50) NOT NULL DEFAULT 'utilisateur',
            `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        $pdo->exec($createTableQuery);
        
        // Créer un utilisateur administrateur par défaut
        $adminEmail = "admin@example.com";
        $adminPassword = password_hash("admin123", PASSWORD_DEFAULT);
        $insertAdminQuery = "INSERT INTO `utilisateurs` 
            (`nom`, `prenom`, `email`, `mot_de_passe`, `identifiant_technique`, `role`) 
            VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($insertAdminQuery);
        $stmt->execute(['Admin', 'System', $adminEmail, $adminPassword, 'p71x6d_system', 'admin']);
        
        // Créer également un utilisateur avec l'e-mail antcirier@gmail.com pour faciliter les tests
        $insertUserQuery = "INSERT INTO `utilisateurs` 
            (`nom`, `prenom`, `email`, `mot_de_passe`, `identifiant_technique`, `role`) 
            VALUES (?, ?, ?, ?, ?, ?)";
        $userPassword = password_hash("Trottinette43!", PASSWORD_DEFAULT);
        $stmt = $pdo->prepare($insertUserQuery);
        $stmt->execute(['Cirier', 'Antoine', 'antcirier@gmail.com', $userPassword, 'p71x6d_cirier', 'admin']);
        
        error_log("Table 'utilisateurs' et utilisateurs par défaut créés dans la base p71x6d_richard");
    }
    
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
        
        $valid_password = password_verify($password, $user['mot_de_passe']);
        
        // Pour la compatibilité, accepter aussi les mots de passe non hashés
        if (!$valid_password && $password === $user['mot_de_passe']) {
            $valid_password = true;
        }
        
        // Au début, pour faciliter les tests, accepter le mot de passe "Trottinette43!" pour antcirier@gmail.com
        if (!$valid_password && $user['email'] === 'antcirier@gmail.com' && $password === 'Trottinette43!') {
            $valid_password = true;
            
            // Mettre à jour le mot de passe hashé pour les prochaines connexions
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $updateQuery = "UPDATE utilisateurs SET mot_de_passe = ? WHERE email = ?";
            $stmt = $pdo->prepare($updateQuery);
            $stmt->execute([$hashedPassword, 'antcirier@gmail.com']);
            
            error_log("Mot de passe mis à jour pour antcirier@gmail.com");
        }
        
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
        error_log("Utilisateur non trouvé en base de données: " . $username);
        
        // Si c'est antcirier@gmail.com et que l'utilisateur n'existe pas, le créer automatiquement
        if ($username === 'antcirier@gmail.com') {
            error_log("Création automatique de l'utilisateur antcirier@gmail.com");
            
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $insertQuery = "INSERT INTO utilisateurs 
                (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
                VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($insertQuery);
            $stmt->execute(['Cirier', 'Antoine', 'antcirier@gmail.com', $hashedPassword, 'p71x6d_cirier', 'admin']);
            
            $userId = $pdo->lastInsertId();
            
            // Génération du token
            $token = base64_encode(json_encode([
                'user' => 'p71x6d_cirier',
                'role' => 'admin',
                'exp' => time() + 3600
            ]));
            
            // Réponse réussie
            http_response_code(200);
            echo json_encode([
                'message' => 'Compte créé et connexion réussie',
                'token' => $token,
                'user' => [
                    'id' => $userId,
                    'nom' => 'Cirier',
                    'prenom' => 'Antoine',
                    'email' => 'antcirier@gmail.com',
                    'identifiant_technique' => 'p71x6d_cirier',
                    'role' => 'admin'
                ]
            ]);
            exit;
        }
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
