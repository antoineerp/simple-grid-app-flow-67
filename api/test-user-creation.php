
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
error_log("=== EXÉCUTION DE test-user-creation.php ===");

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
    
    if ($stmt->rowCount() == 0) {
        // La table n'existe pas, renvoyer une erreur
        throw new Exception("La table {$tableName} n'existe pas. Veuillez d'abord exécuter init-users-table.php");
    }
    
    // Créer un nouvel utilisateur de test
    $testUser = [
        'nom' => 'Test_' . date('His'),
        'prenom' => 'Utilisateur',
        'email' => 'test_' . date('His') . '@example.com',
        'mot_de_passe' => password_hash('test123', PASSWORD_BCRYPT),
        'identifiant_technique' => 'test_user_' . date('His'),
        'role' => 'utilisateur'
    ];
    
    // Insérer l'utilisateur de test
    $insertQuery = "INSERT INTO {$tableName} 
                   (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
                   VALUES (:nom, :prenom, :email, :mot_de_passe, :identifiant_technique, :role)";
    
    $stmt = $pdo->prepare($insertQuery);
    $stmt->execute([
        ':nom' => $testUser['nom'],
        ':prenom' => $testUser['prenom'],
        ':email' => $testUser['email'],
        ':mot_de_passe' => $testUser['mot_de_passe'],
        ':identifiant_technique' => $testUser['identifiant_technique'],
        ':role' => $testUser['role']
    ]);
    
    $userId = $pdo->lastInsertId();
    $testUser['id'] = $userId;
    
    // Créer les tables pour cet utilisateur
    $tables = [
        "bibliotheque" => "
            CREATE TABLE IF NOT EXISTS `bibliotheque_{$testUser['identifiant_technique']}` (
                `id` VARCHAR(36) PRIMARY KEY,
                `nom` VARCHAR(255) NOT NULL,
                `description` TEXT NULL,
                `link` VARCHAR(255) NULL,
                `groupId` VARCHAR(36) NULL,
                `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ",
        "exigences" => "
            CREATE TABLE IF NOT EXISTS `exigences_{$testUser['identifiant_technique']}` (
                `id` VARCHAR(36) PRIMARY KEY,
                `nom` VARCHAR(255) NOT NULL,
                `responsabilites` TEXT,
                `exclusion` TINYINT(1) DEFAULT 0,
                `atteinte` ENUM('NC', 'PC', 'C') NULL,
                `groupId` VARCHAR(36) NULL,
                `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        "
    ];
    
    $createdTables = [];
    foreach ($tables as $tableName => $query) {
        $pdo->exec($query);
        $createdTables[] = "{$tableName}_{$testUser['identifiant_technique']}";
    }
    
    // Réponse
    echo json_encode([
        'status' => 'success',
        'success' => true, 
        'message' => 'Utilisateur de test créé avec succès',
        'user' => $testUser,
        'tables_created' => $createdTables
    ]);
    
} catch (PDOException $e) {
    error_log("PDOException dans test-user-creation.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Exception dans test-user-creation.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
