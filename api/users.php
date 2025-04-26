
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Configuration des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0); // Ne pas afficher les erreurs dans la réponse
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// En-têtes CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journaliser l'appel
error_log("API users.php - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - Requête: " . $_SERVER['REQUEST_URI']);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Nettoyer tout buffer de sortie existant
if (ob_get_level()) ob_clean();

try {
    // Définir la constante pour le contrôle d'accès direct pour permettre l'accès
    define('DIRECT_ACCESS_CHECK', true);
    
    // Vérifier si la table utilisateurs existe, sinon la créer
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
    
    // Connexion à la base de données
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Vérifier si la table existe
    $tableExistsQuery = "SHOW TABLES LIKE 'utilisateurs'";
    $stmt = $pdo->prepare($tableExistsQuery);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        // La table n'existe pas, la créer
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
        
        // Créer un utilisateur admin par défaut
        $defaultAdminQuery = "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
        VALUES ('Admin', 'System', 'admin@system.local', :password, 'p71x6d_system_admin', 'admin')";
        
        $stmt = $pdo->prepare($defaultAdminQuery);
        $hashedPassword = password_hash('admin123', PASSWORD_BCRYPT);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->execute();
    }
    
    // Récupérer tous les utilisateurs
    $query = "SELECT id, nom, prenom, email, role, identifiant_technique, date_creation FROM utilisateurs";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    // Renvoyer la liste des utilisateurs
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "message" => "Service utilisateurs en ligne",
        "records" => $users,
        "timestamp" => date('Y-m-d H:i:s')
    ]);
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans users.php: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    
    // Nettoyer tout buffer de sortie existant
    if (ob_get_level()) ob_clean();
    
    // S'assurer que les en-têtes sont correctement définis
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code(500);
    }
    
    echo json_encode([
        'status' => 'error',
        'message' => "Erreur de base de données: " . $e->getMessage(),
    ]);
} catch (Exception $e) {
    error_log("Erreur dans users.php: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    
    // Nettoyer tout buffer de sortie existant
    if (ob_get_level()) ob_clean();
    
    // S'assurer que les en-têtes sont correctement définis
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code(500);
    }
    
    echo json_encode([
        'status' => 'error',
        'message' => "Erreur serveur: " . $e->getMessage()
    ]);
}

// S'assurer que tout buffer est vidé
if (ob_get_level()) ob_end_flush();
?>
