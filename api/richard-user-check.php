
<?php
// Script pour diagnostiquer spécifiquement la connexion avec l'utilisateur p71x6d_richard
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'exécution
error_log("=== EXÉCUTION DE richard-user-check.php ===");

// Paramètres de connexion forcés pour p71x6d_richard
$host = "p71x6d.myd.infomaniak.com";
$dbname = "p71x6d_system";
$username = "p71x6d_richard";
$password = "Trottinette43!";

try {
    // Tester la connexion PDO directement
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    error_log("Tentative de connexion PDO directe à la base de données avec utilisateur: " . $username);
    $pdo = new PDO($dsn, $username, $password, $options);
    error_log("Connexion PDO réussie avec p71x6d_richard");
    
    // Vérifier si la table utilisateurs existe
    $tableExistsQuery = "SHOW TABLES LIKE 'utilisateurs'";
    $stmt = $pdo->prepare($tableExistsQuery);
    $stmt->execute();
    
    $tableExists = $stmt->rowCount() > 0;
    
    if ($tableExists) {
        // Récupérer les utilisateurs
        $query = "SELECT id, nom, prenom, email, role, identifiant_technique, date_creation FROM utilisateurs";
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $count = count($users);
        
        error_log("Nombre d'utilisateurs récupérés avec p71x6d_richard: " . $count);
        
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'Connexion réussie à la base de données avec p71x6d_richard',
            'records' => $users,
            'count' => $count,
            'tableExists' => $tableExists,
            'database_info' => [
                'host' => $host,
                'database' => $dbname,
                'user' => $username
            ]
        ]);
    } else {
        error_log("La table 'utilisateurs' n'existe pas pour p71x6d_richard");
        http_response_code(200);
        echo json_encode([
            'status' => 'warning',
            'message' => "La table 'utilisateurs' n'existe pas",
            'tableExists' => false,
            'database_info' => [
                'host' => $host,
                'database' => $dbname,
                'user' => $username
            ]
        ]);
    }
} catch (PDOException $e) {
    error_log("Erreur de connexion PDO avec p71x6d_richard: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Échec de la connexion à la base de données',
        'error' => $e->getMessage(),
        'database_info' => [
            'host' => $host,
            'database' => $dbname,
            'user' => $username
        ]
    ]);
}
?>
