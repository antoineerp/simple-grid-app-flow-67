
<?php
// Fichier pour vérifier l'état des utilisateurs dans la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'exécution
error_log("=== EXÉCUTION DE check-users.php ===");

// Capturer toute sortie pour éviter la contamination du JSON
ob_start();

try {
    // Tester la connexion PDO directement sans passer par notre classe Database
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_system";
    $password = "Trottinette43!";
    
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    error_log("Tentative de connexion PDO directe à la base de données");
    $pdo = new PDO($dsn, $username, $password, $options);
    error_log("Connexion PDO réussie");
    
    // Vérifier si la table existe
    $tableExistsQuery = "SHOW TABLES LIKE 'utilisateurs'";
    $stmt = $pdo->prepare($tableExistsQuery);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        // La table n'existe pas, la créer
        error_log("La table 'utilisateurs' n'existe pas, création en cours");
        $createTableQuery = "CREATE TABLE IF NOT EXISTS utilisateurs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            prenom VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            mot_de_passe VARCHAR(255) NOT NULL,
            identifiant_technique VARCHAR(100) NOT NULL UNIQUE,
            role VARCHAR(20) NOT NULL,
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($createTableQuery);
        error_log("Table 'utilisateurs' créée avec succès");
        
        // Créer un utilisateur admin par défaut
        $defaultAdminQuery = "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
        VALUES ('Admin', 'System', 'admin@system.local', :password, 'p71x6d_system_admin', 'admin')";
        
        $stmt = $pdo->prepare($defaultAdminQuery);
        $hashedPassword = password_hash('admin123', PASSWORD_BCRYPT);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->execute();
        
        error_log("Utilisateur admin par défaut créé");
    } else {
        error_log("La table 'utilisateurs' existe déjà");
    }
    
    // Récupérer tous les utilisateurs
    $query = "SELECT id, nom, prenom, email, role, identifiant_technique, date_creation, mot_de_passe FROM utilisateurs";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $count = count($users);
    
    error_log("Nombre d'utilisateurs récupérés: " . $count);
    
    // Nettoyer tout output accumulé
    ob_clean();
    
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
            'user' => $username
        ]
    ]);
    exit;
} catch (PDOException $e) {
    error_log("Erreur de connexion PDO: " . $e->getMessage());
    
    // Nettoyer tout output accumulé
    ob_clean();
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Échec de la connexion à la base de données',
        'error' => $e->getMessage()
    ]);
    exit;
} catch (Exception $e) {
    error_log("Erreur générale: " . $e->getMessage());
    
    // Nettoyer tout output accumulé
    ob_clean();
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du test de connexion',
        'error' => $e->getMessage()
    ]);
    exit;
}
?>
