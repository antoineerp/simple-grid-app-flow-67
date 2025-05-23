
<?php
// Fichier de test de connexion à la base de données utilisé par l'application
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'exécution
error_log("=== EXÉCUTION DE db-connection-test.php ===");

try {
    // Tester la connexion PDO directement avec la base richard
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_richard";
    $username = "p71x6d_richard";
    $password = "Trottinette43!";
    
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    error_log("Tentative de connexion PDO directe à la base de données richard");
    $pdo = new PDO($dsn, $username, $password, $options);
    error_log("Connexion PDO réussie à la base richard");
    
    // Vérifier que la connexion fonctionne en exécutant une requête
    $stmt = $pdo->query("SELECT DATABASE() as db");
    $result = $stmt->fetch();
    $current_db = $result['db'];
    
    // Tester l'existence de la table utilisateurs
    $stmt = $pdo->query("SHOW TABLES LIKE 'utilisateurs'");
    $tableExists = $stmt->rowCount() > 0;
    
    // Compter le nombre d'utilisateurs si la table existe
    $userCount = 0;
    if ($tableExists) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM utilisateurs");
        $result = $stmt->fetch();
        $userCount = $result['count'];
    }
    
    // Préparer la réponse
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Connexion PDO directe réussie à la base richard',
        'connection_info' => [
            'host' => $host,
            'database' => $dbname,
            'user' => $username,
            'current_database' => $current_db,
            'table_users_exists' => $tableExists,
            'user_count' => $userCount
        ],
    ]);
    exit;
} catch (PDOException $e) {
    error_log("Erreur de connexion PDO à la base richard: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Échec de la connexion PDO directe à la base richard',
        'error' => $e->getMessage()
    ]);
    exit;
} catch (Exception $e) {
    error_log("Erreur générale: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du test de connexion',
        'error' => $e->getMessage()
    ]);
    exit;
}
?>
