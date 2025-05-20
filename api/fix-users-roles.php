
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

// Journaliser l'exécution
error_log("=== EXÉCUTION DE fix-users-roles.php ===");

try {
    require_once 'config/database.php';
    
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    // Créer un tableau pour suivre les modifications
    $modifications = [];
    
    // Vérifier si la table utilisateurs existe
    $tableExistsQuery = "SHOW TABLES LIKE 'utilisateurs'";
    $stmt = $db->prepare($tableExistsQuery);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        // La table n'existe pas, la créer
        $createTableQuery = "CREATE TABLE IF NOT EXISTS utilisateurs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            prenom VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            mot_de_passe VARCHAR(255) NOT NULL,
            identifiant_technique VARCHAR(100) NOT NULL UNIQUE,
            role ENUM('admin', 'user', 'administrateur', 'utilisateur', 'gestionnaire') NOT NULL DEFAULT 'utilisateur',
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $db->exec($createTableQuery);
        $modifications[] = "Table 'utilisateurs' créée";
        
        // Créer un utilisateur admin par défaut
        $adminQuery = "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
            VALUES ('Admin', 'System', 'admin@system.local', :password, 'p71x6d_system_admin', 'administrateur')";
        
        $stmt = $db->prepare($adminQuery);
        $hashedPassword = password_hash('admin123', PASSWORD_BCRYPT);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->execute();
        
        $modifications[] = "Utilisateur admin par défaut créé";
    } else {
        $modifications[] = "Table 'utilisateurs' existe déjà";
        
        // Vérifier la structure de la colonne 'role'
        $roleColumnQuery = "SHOW COLUMNS FROM utilisateurs LIKE 'role'";
        $stmt = $db->prepare($roleColumnQuery);
        $stmt->execute();
        $roleColumn = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($roleColumn) {
            $modifications[] = "Structure actuelle de la colonne 'role': " . $roleColumn['Type'];
            
            // Vérifier si la colonne 'role' a besoin d'être modifiée
            if (strpos($roleColumn['Type'], 'enum') === 0) {
                // Mettre à jour les rôles admin vers administrateur
                $updateAdminQuery = "UPDATE utilisateurs SET role = 'administrateur' WHERE role = 'admin'";
                $stmt = $db->prepare($updateAdminQuery);
                $stmt->execute();
                $adminCount = $stmt->rowCount();
                if ($adminCount > 0) {
                    $modifications[] = "$adminCount utilisateur(s) avec rôle 'admin' mis à jour vers 'administrateur'";
                }
                
                // Mettre à jour les rôles user vers utilisateur
                $updateUserQuery = "UPDATE utilisateurs SET role = 'utilisateur' WHERE role = 'user'";
                $stmt = $db->prepare($updateUserQuery);
                $stmt->execute();
                $userCount = $stmt->rowCount();
                if ($userCount > 0) {
                    $modifications[] = "$userCount utilisateur(s) avec rôle 'user' mis à jour vers 'utilisateur'";
                }
                
                // Modifier la structure de la colonne role si nécessaire
                if (!strpos($roleColumn['Type'], 'gestionnaire') || 
                    !strpos($roleColumn['Type'], 'utilisateur') || 
                    !strpos($roleColumn['Type'], 'administrateur')) {
                    
                    $alterRoleQuery = "ALTER TABLE utilisateurs MODIFY COLUMN role ENUM('administrateur', 'utilisateur', 'gestionnaire') NOT NULL";
                    $db->exec($alterRoleQuery);
                    $modifications[] = "Structure de la colonne 'role' mise à jour";
                }
            }
        }
    }
    
    // Vérification finale des utilisateurs
    $usersQuery = "SELECT id, nom, prenom, email, role, identifiant_technique FROM utilisateurs";
    $stmt = $db->prepare($usersQuery);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Réponse
    http_response_code(200);
    echo json_encode([
        'status' => 'success', 
        'message' => 'Rôles utilisateurs vérifiés et corrigés', 
        'modifications' => $modifications,
        'users' => $users
    ]);
    
} catch (PDOException $e) {
    error_log("PDOException dans fix-users-roles.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Exception dans fix-users-roles.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
