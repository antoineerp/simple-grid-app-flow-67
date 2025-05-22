
<?php
// Configuration des headers
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Configurer l'affichage des erreurs
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Journaliser l'exécution
error_log("=== EXÉCUTION DE init-users-table.php ===");

try {
    // Configuration de la base de données
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_richard";
    $password = "Trottinette43!";
    
    // Connexion à la base de données
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Nom de la table utilisateurs
    $tableName = 'utilisateurs_p71x6d_richard';
    
    // Vérifier si la table existe
    $tableExistsQuery = "SHOW TABLES LIKE '{$tableName}'";
    $stmt = $pdo->prepare($tableExistsQuery);
    $stmt->execute();
    
    $modifications = [];
    
    if ($stmt->rowCount() == 0) {
        // La table n'existe pas, la créer
        $createTableQuery = "CREATE TABLE {$tableName} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            prenom VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            mot_de_passe VARCHAR(255) NOT NULL,
            identifiant_technique VARCHAR(100) NOT NULL UNIQUE,
            role ENUM('administrateur', 'utilisateur', 'gestionnaire') NOT NULL DEFAULT 'utilisateur',
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($createTableQuery);
        $modifications[] = "Table '{$tableName}' créée";
        
        // Créer un utilisateur admin par défaut
        $adminQuery = "INSERT INTO {$tableName} (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
                      VALUES ('Admin', 'System', 'admin@system.local', :password, 'p71x6d_richard', 'administrateur')";
        
        $stmt = $pdo->prepare($adminQuery);
        $hashedPassword = password_hash('admin123', PASSWORD_BCRYPT);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->execute();
        
        $modifications[] = "Utilisateur admin par défaut créé";
    } else {
        $modifications[] = "Table '{$tableName}' existe déjà";
        
        // Vérifier la structure de la colonne 'role'
        $roleColumnQuery = "SHOW COLUMNS FROM {$tableName} LIKE 'role'";
        $stmt = $pdo->prepare($roleColumnQuery);
        $stmt->execute();
        $roleColumn = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($roleColumn) {
            $modifications[] = "Structure actuelle de la colonne 'role': " . $roleColumn['Type'];
            
            // Vérifier si la colonne 'role' a besoin d'être modifiée
            if (strpos($roleColumn['Type'], 'enum') === 0 && 
                (!strpos($roleColumn['Type'], 'gestionnaire') || 
                 !strpos($roleColumn['Type'], 'utilisateur') || 
                 !strpos($roleColumn['Type'], 'administrateur'))) {
                
                $alterRoleQuery = "ALTER TABLE {$tableName} MODIFY COLUMN role 
                                  ENUM('administrateur', 'utilisateur', 'gestionnaire') 
                                  NOT NULL DEFAULT 'utilisateur'";
                $pdo->exec($alterRoleQuery);
                $modifications[] = "Structure de la colonne 'role' mise à jour";
            }
            
            // Mettre à jour les rôles admin vers administrateur
            $updateAdminQuery = "UPDATE {$tableName} SET role = 'administrateur' WHERE role = 'admin'";
            $stmt = $pdo->prepare($updateAdminQuery);
            $stmt->execute();
            $adminCount = $stmt->rowCount();
            if ($adminCount > 0) {
                $modifications[] = "$adminCount utilisateur(s) avec rôle 'admin' mis à jour vers 'administrateur'";
            }
            
            // Mettre à jour les rôles user vers utilisateur
            $updateUserQuery = "UPDATE {$tableName} SET role = 'utilisateur' WHERE role = 'user'";
            $stmt = $pdo->prepare($updateUserQuery);
            $stmt->execute();
            $userCount = $stmt->rowCount();
            if ($userCount > 0) {
                $modifications[] = "$userCount utilisateur(s) avec rôle 'user' mis à jour vers 'utilisateur'";
            }
        }
    }
    
    // Vérification finale des utilisateurs
    $usersQuery = "SELECT id, nom, prenom, email, role, identifiant_technique FROM {$tableName}";
    $stmt = $pdo->prepare($usersQuery);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Réponse
    echo json_encode([
        'status' => 'success', 
        'success' => true,
        'message' => 'Initialisation de la table utilisateurs terminée', 
        'modifications' => $modifications,
        'users' => $users
    ]);
    
} catch (PDOException $e) {
    error_log("PDOException dans init-users-table.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Exception dans init-users-table.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
