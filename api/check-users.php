
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Fichier pour vérifier l'état des utilisateurs dans la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Forced-DB-User, X-User-Prefix");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Journalisation pour le débogage
error_log("Exécution de check-users.php - Méthode: " . $_SERVER['REQUEST_METHOD']);

// Configuration de base pour la base de données
require_once __DIR__ . '/config/database.php';

try {
    // Créer une connexion à la base de données
    $database = new Database();
    $conn = $database->getConnection(true);
    
    // Vérifier que la connexion a réussi
    if (!$conn) {
        throw new Exception("Échec de connexion à la base de données: " . $database->getError());
    }
    
    // Initialiser la table des utilisateurs (toujours p71x6d_richard)
    $table = 'utilisateurs_p71x6d_richard';
    
    // Vérifier si la table existe, sinon la créer
    $checkTableQuery = "SHOW TABLES LIKE '$table'";
    $result = $conn->query($checkTableQuery);
    
    if ($result->rowCount() === 0) {
        // La table n'existe pas, la créer
        $createTableQuery = "CREATE TABLE IF NOT EXISTS `$table` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `nom` VARCHAR(100) NOT NULL,
            `prenom` VARCHAR(100) NOT NULL,
            `email` VARCHAR(100) NOT NULL,
            `mot_de_passe` VARCHAR(255) NOT NULL,
            `identifiant_technique` VARCHAR(100) NOT NULL,
            `role` VARCHAR(20) NOT NULL DEFAULT 'utilisateur',
            `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $conn->exec($createTableQuery);
        error_log("Table $table créée");
        
        // Insérer un utilisateur administrateur par défaut
        $insertQuery = "INSERT INTO `$table` 
            (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
            VALUES ('Admin', 'Système', 'admin@system.local', :password, 'p71x6d_richard', 'admin')";
        
        $stmt = $conn->prepare($insertQuery);
        $password = password_hash('admin123', PASSWORD_BCRYPT);
        $stmt->bindParam(':password', $password);
        $stmt->execute();
        
        error_log("Utilisateur administrateur par défaut créé");
    }
    
    // Récupérer tous les utilisateurs
    $query = "SELECT * FROM `$table`";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Si aucun utilisateur n'est trouvé, en créer un par défaut
    if (count($users) === 0) {
        $insertQuery = "INSERT INTO `$table` 
            (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
            VALUES ('Admin', 'Default', 'admin@example.com', :password, 'p71x6d_richard', 'admin')";
        
        $stmt = $conn->prepare($insertQuery);
        $password = password_hash('admin123', PASSWORD_BCRYPT);
        $stmt->bindParam(':password', $password);
        $stmt->execute();
        
        // Récupérer à nouveau les utilisateurs
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("Utilisateur créé car aucun n'existait");
    }
    
    // Retourner la liste des utilisateurs
    echo json_encode([
        'success' => true,
        'records' => $users,
        'count' => count($users),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    error_log("Erreur dans check-users.php: " . $e->getMessage());
    
    // Nettoyer tout buffer de sortie existant
    if (ob_get_level()) {
        ob_clean();
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => "Erreur serveur: " . $e->getMessage(),
        'debug_info' => $e->getTraceAsString()
    ]);
}
