
<?php
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

// Créer un gestionnaire d'exceptions global
function exception_handler($exception) {
    error_log("Exception globale attrapée dans auth.php: " . $exception->getMessage());
    error_log("Trace: " . $exception->getTraceAsString());
    
    // Envoyer une réponse JSON en cas d'erreur
    http_response_code(500);
    echo json_encode([
        'status' => 500,
        'message' => 'Erreur serveur interne',
        'error' => $exception->getMessage()
    ]);
}

// Définir le gestionnaire d'exceptions
set_exception_handler('exception_handler');

try {
    // Récupérer les données POST
    $json_input = file_get_contents("php://input");

    // Journaliser la réception des données (masquer les infos sensibles)
    $log_input = json_decode($json_input, true);
    if (isset($log_input['password'])) {
        $log_input['password'] = '********';
    }
    error_log("Données reçues: " . json_encode($log_input ?? $json_input));

    // Vérifier si les données sont vides
    if (empty($json_input)) {
        throw new Exception("Aucune donnée reçue");
    }
    
    $data = json_decode($json_input);

    // Vérifier si le décodage a réussi
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Erreur de décodage JSON: " . json_last_error_msg());
    }

    // Vérifier si les données sont présentes et récupérer le nom d'utilisateur et le mot de passe
    $username = null;
    $password = null;
    
    // Récupérer le nom d'utilisateur et le mot de passe, en tenant compte des différents formats possibles
    if (!empty($data->username)) {
        $username = $data->username;
    } elseif (!empty($data->email)) {
        $username = $data->email;
    }
    
    if (!empty($data->password)) {
        $password = $data->password;
    }
    
    if ($username && $password) {
        error_log("Tentative de connexion pour: " . $username);
        
        // Configuration de la base de données
        $host = "p71x6d.myd.infomaniak.com";
        $dbname = "p71x6d_system";
        $db_username = "p71x6d_system";
        $db_password = "Trottinette43!";
        
        // Connexion à la base de données
        try {
            $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $db_username, $db_password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            error_log("Connexion à la base de données réussie");
            
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
                
                error_log("Table 'utilisateurs' créée avec un utilisateur administrateur par défaut");
                
                // Créer également un utilisateur avec l'e-mail antcirier@gmail.com pour faciliter les tests
                $insertUserQuery = "INSERT INTO `utilisateurs` 
                    (`nom`, `prenom`, `email`, `mot_de_passe`, `identifiant_technique`, `role`) 
                    VALUES (?, ?, ?, ?, ?, ?)";
                $userPassword = password_hash("Trottinette43!", PASSWORD_DEFAULT);
                $stmt = $pdo->prepare($insertUserQuery);
                $stmt->execute(['Cirier', 'Antoine', 'antcirier@gmail.com', $userPassword, 'p71x6d_cirier', 'admin']);
                
                error_log("Utilisateur de test 'antcirier@gmail.com' créé");
            }
            
            // Rechercher l'utilisateur par email
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
            
            if ($user) {
                error_log("Utilisateur trouvé: " . $user['email']);
                
                // Vérifier le mot de passe
                $valid_password = password_verify($password, $user['mot_de_passe']);
                
                // Pour la compatibilité, accepter aussi les mots de passe non hashés
                if (!$valid_password && $password === $user['mot_de_passe']) {
                    $valid_password = true;
                }
                
                if ($valid_password) {
                    error_log("Mot de passe valide pour: " . $user['email']);
                    
                    // Générer un token simple
                    $token = base64_encode(json_encode([
                        'user_id' => $user['id'],
                        'email' => $user['email'],
                        'role' => $user['role'],
                        'exp' => time() + 3600 // expire dans 1 heure
                    ]));
                    
                    // Envoyer la réponse
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
                } else {
                    error_log("Mot de passe invalide pour: " . $user['email']);
                    throw new Exception("Identifiants invalides");
                }
            } else {
                error_log("Utilisateur non trouvé: " . $username);
                throw new Exception("Identifiants invalides");
            }
        } catch (PDOException $e) {
            error_log("Erreur PDO: " . $e->getMessage());
            throw new Exception("Erreur de connexion à la base de données: " . $e->getMessage());
        }
    } else {
        // Si des données sont manquantes
        error_log("Données incomplètes pour la connexion. Username: " . ($username ? 'présent' : 'manquant') . 
                  ", Password: " . ($password ? 'présent' : 'manquant'));
        http_response_code(400);
        echo json_encode(['message' => 'Données incomplètes. Username et password sont requis.', 'status' => 400]);
        exit;
    }
} catch (Exception $e) {
    // Log l'erreur et renvoyer une réponse formatée
    error_log("Erreur dans auth.php: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'message' => 'Erreur serveur', 
        'error' => $e->getMessage()
    ]);
    exit;
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE auth.php ===");
}
?>
