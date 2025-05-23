
<?php
// Configuration des en-têtes CORS
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
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

// Configuration de la base de données
$host = "p71x6d.myd.infomaniak.com";
$dbname = "p71x6d_system";
$username = "p71x6d_richard";
$password = "Trottinette43!";

try {
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
    
    // Variable pour stocker si la table a été créée
    $tableCreated = false;
    
    if ($stmt->rowCount() == 0) {
        // La table n'existe pas, la créer
        $createTableQuery = "
            CREATE TABLE `{$tableName}` (
              `id` INT AUTO_INCREMENT PRIMARY KEY,
              `nom` VARCHAR(100) NOT NULL,
              `prenom` VARCHAR(100) NOT NULL,
              `email` VARCHAR(255) NOT NULL UNIQUE,
              `mot_de_passe` VARCHAR(255) NOT NULL,
              `identifiant_technique` VARCHAR(255) NOT NULL UNIQUE,
              `role` ENUM('administrateur', 'utilisateur', 'gestionnaire') NOT NULL DEFAULT 'utilisateur',
              `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        $pdo->exec($createTableQuery);
        $tableCreated = true;
        
        // Insérer un utilisateur administrateur par défaut
        $insertAdminQuery = "
            INSERT INTO {$tableName} 
            (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
            VALUES ('Admin', 'Système', 'admin@system.local', :password, 'admin@system.local', 'administrateur')
        ";
        
        $stmt = $pdo->prepare($insertAdminQuery);
        $defaultPassword = password_hash('admin123', PASSWORD_BCRYPT);
        $stmt->bindParam(':password', $defaultPassword);
        $stmt->execute();
    }
    
    // Vérifier s'il y a des utilisateurs dans la table
    $countQuery = "SELECT COUNT(*) as count FROM {$tableName}";
    $stmt = $pdo->query($countQuery);
    $result = $stmt->fetch();
    
    echo json_encode([
        'status' => 'success',
        'message' => $tableCreated 
            ? "Table {$tableName} créée avec succès" 
            : "La table {$tableName} existe déjà",
        'user_count' => $result['count'],
        'table_name' => $tableName
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
?>
