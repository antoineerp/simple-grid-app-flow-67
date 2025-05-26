
<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

error_log("=== EXÉCUTION DE auth.php ===");
error_log("Méthode: " . $method);

if ($method === 'POST') {
    // Connexion utilisateur via base Infomaniak
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['username']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Nom d\'utilisateur et mot de passe requis']);
        exit;
    }
    
    try {
        $pdo = getDbConnection();
        
        // S'assurer que la table utilisateurs existe
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?");
        $stmt->execute([DB_NAME, 'utilisateurs']);
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
            
            // Créer l'utilisateur par défaut
            $hashedPassword = password_hash("Trottinette43!", PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO `utilisateurs` 
                (`nom`, `prenom`, `email`, `mot_de_passe`, `identifiant_technique`, `role`) 
                VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute(['Cirier', 'Antoine', 'antcirier@gmail.com', $hashedPassword, 'p71x6d_cirier', 'admin']);
            error_log("Utilisateur par défaut créé");
        }
        
        // Vérifier dans la table des utilisateurs
        $stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE identifiant_technique = ? OR email = ?");
        $stmt->execute([$input['username'], $input['username']]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($input['password'], $user['mot_de_passe'])) {
            error_log("Authentification réussie pour: " . $user['email']);
            
            echo json_encode([
                'success' => true,
                'message' => 'Connexion réussie',
                'token' => base64_encode($user['identifiant_technique']),
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
            error_log("Identifiants invalides pour: " . $input['username']);
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Identifiants invalides']);
        }
    } catch (Exception $e) {
        error_log("Erreur lors de la connexion: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la connexion']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}

error_log("=== FIN DE L'EXÉCUTION DE auth.php ===");
?>
