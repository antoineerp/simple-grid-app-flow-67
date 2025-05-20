
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Fichier pour vérifier l'état des utilisateurs dans la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'exécution
error_log("=== EXÉCUTION DE check-users.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);
error_log("Paramètres GET: " . print_r($_GET, true));

// Mode d'authentification - POST pour login, GET pour vérifier les utilisateurs
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Récupérer les données JSON
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    // Journalisation sécurisée (masquer le mot de passe)
    $log_data = $data;
    if (isset($log_data['password'])) {
        $log_data['password'] = '******';
    }
    error_log("Données POST reçues: " . json_encode($log_data));
    
    // Validation des données pour le login
    if (!$data || !isset($data['username']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Données de connexion invalides']);
        exit;
    }
    
    // Récupérer les identifiants
    $username = $data['username'];
    $password = $data['password'];
    
    try {
        // Configuration de la base de données
        $host = "p71x6d.myd.infomaniak.com";
        $dbname = "p71x6d_system";
        $db_username = "p71x6d_richard";
        $db_password = "Trottinette43!";
        
        // Connexion à la base de données
        $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $db_username, $db_password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        
        error_log("Connexion à la base de données réussie, recherche de l'utilisateur: " . $username);
        
        // Vérifier si la table utilisateurs existe
        $tableExistsQuery = "SHOW TABLES LIKE 'utilisateurs'";
        $stmt = $pdo->prepare($tableExistsQuery);
        $stmt->execute();
        $tableExists = $stmt->rowCount() > 0;
        
        if (!$tableExists) {
            // Créer la table utilisateurs si elle n'existe pas
            $createTableQuery = "CREATE TABLE IF NOT EXISTS utilisateurs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nom VARCHAR(100) NOT NULL,
                prenom VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                mot_de_passe VARCHAR(255) NOT NULL,
                identifiant_technique VARCHAR(100) NOT NULL UNIQUE,
                role ENUM('admin', 'user', 'administrateur', 'utilisateur', 'gestionnaire') NOT NULL,
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
            
            $pdo->exec($createTableQuery);
            
            // Créer un utilisateur admin par défaut
            $adminEmail = "admin@example.com";
            $adminPassword = password_hash("admin123", PASSWORD_DEFAULT);
            $insertAdminQuery = "INSERT INTO utilisateurs 
                (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
                VALUES ('Admin', 'System', :email, :password, 'p71x6d_system', 'admin')";
            $stmt = $pdo->prepare($insertAdminQuery);
            $stmt->bindParam(':email', $adminEmail);
            $stmt->bindParam(':password', $adminPassword);
            $stmt->execute();
            
            // Créer un utilisateur pour antcirier@gmail.com
            $userEmail = "antcirier@gmail.com";
            $userPassword = password_hash("Trottinette43!", PASSWORD_DEFAULT);
            $insertUserQuery = "INSERT INTO utilisateurs 
                (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
                VALUES ('Cirier', 'Antoine', :email, :password, 'p71x6d_cirier', 'admin')";
            $stmt = $pdo->prepare($insertUserQuery);
            $stmt->bindParam(':email', $userEmail);
            $stmt->bindParam(':password', $userPassword);
            $stmt->execute();
        }
        
        // Recherche de l'utilisateur
        $query = "SELECT * FROM utilisateurs WHERE email = ? OR identifiant_technique = ? LIMIT 1";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();
        
        // Vérification de l'utilisateur et du mot de passe
        if ($user) {
            $valid_password = password_verify($password, $user['mot_de_passe']);
            
            // Accepter aussi les mots de passe non hashés pour compatibilité
            if (!$valid_password && $password === $user['mot_de_passe']) {
                $valid_password = true;
            }
            
            // Accepter Trottinette43! pour antcirier@gmail.com
            if (!$valid_password && $user['email'] === 'antcirier@gmail.com' && $password === 'Trottinette43!') {
                $valid_password = true;
                
                // Mettre à jour le mot de passe hashé
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $updateQuery = "UPDATE utilisateurs SET mot_de_passe = ? WHERE email = ?";
                $stmt = $pdo->prepare($updateQuery);
                $stmt->execute([$hashedPassword, 'antcirier@gmail.com']);
            }
            
            if ($valid_password) {
                // Génération du token (un JWT simplifié)
                $payload = [
                    'user' => [
                        'id' => $user['id'],
                        'nom' => $user['nom'],
                        'prenom' => $user['prenom'],
                        'email' => $user['email'],
                        'identifiant_technique' => $user['identifiant_technique'],
                        'role' => $user['role']
                    ],
                    'exp' => time() + 86400 // 24 heures
                ];
                
                // Créer les parties du JWT
                $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
                $payload = base64_encode(json_encode($payload));
                $signature = base64_encode(hash_hmac('sha256', "$header.$payload", "secret_key", true));
                $token = "$header.$payload.$signature";
                
                // Réponse réussie
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
            
            // Mot de passe invalide
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Identifiants invalides']);
            exit;
        }
        
        // Utilisateur non trouvé
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Utilisateur non trouvé']);
        exit;
    } catch (PDOException $e) {
        error_log("Erreur de base de données lors de la connexion: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        exit;
    }
} 
// Mode GET - récupération des utilisateurs
else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Récupérer l'utilisateur source, si spécifié
    $source = isset($_GET['userId']) ? $_GET['userId'] : 'p71x6d_richard';
    error_log("Source de connexion pour la liste d'utilisateurs: " . $source);

    try {
        // Configuration de la base de données
        $host = "p71x6d.myd.infomaniak.com";
        $dbname = "p71x6d_system";
        $username = "p71x6d_richard";
        $password = "Trottinette43!";
        
        $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $pdo = new PDO($dsn, $username, $password, $options);
        error_log("Connexion PDO réussie pour récupérer les utilisateurs");
        
        // Récupérer tous les utilisateurs
        $query = "SELECT id, nom, prenom, email, role, identifiant_technique, date_creation FROM utilisateurs";
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $count = count($users);
        
        error_log("Nombre d'utilisateurs récupérés: " . $count);
        
        // Nettoyer tout output accumulé
        if (ob_get_level()) ob_clean();
        
        // Préparer la réponse
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'Connexion réussie à la base de données',
            'records' => $users,
            'count' => $count,
            'database_info' => [
                'host' => $host,
                'database' => $dbname,
                'user' => $username,
                'source' => $source
            ]
        ]);
        exit;
    } catch (PDOException $e) {
        error_log("Erreur de connexion PDO: " . $e->getMessage());
        
        // Nettoyer tout output accumulé
        if (ob_get_level()) ob_clean();
        
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Échec de la connexion à la base de données',
            'error' => $e->getMessage(),
            'source_attempted' => $source ?? 'default'
        ]);
        exit;
    }
}
?>
