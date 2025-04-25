
<?php
// En-têtes pour s'assurer que nous renvoyons toujours du JSON, même en cas d'erreur
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Désactiver l'affichage des erreurs PHP - elles seraient journalisées mais pas affichées
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'accès
error_log("=== EXÉCUTION DE db-connection-test.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

try {
    // Connexion directe à la base de données pour test
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
    
    error_log("Tentative de connexion directe à la base de données");
    $pdo = new PDO($dsn, $username, $password, $options);
    error_log("Connexion PDO réussie");
    
    // Récupérer quelques informations sur la base de données
    $stmt = $pdo->query("SELECT DATABASE() as db");
    $current_db = $stmt->fetch();
    
    // Liste des tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $tables[] = current($row);
    }
    
    // Envoyer la réponse
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Connexion à la base de données établie',
        'connection_info' => [
            'host' => $host,
            'database' => $dbname,
            'user' => $username,
            'current_db' => $current_db['db'] ?? $dbname
        ],
        'info' => [
            'database_name' => $dbname,
            'host' => $host,
            'tables' => $tables,
            'table_count' => count($tables),
            'size' => 'Non disponible',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci'
        ]
    ]);
    exit;
    
} catch (PDOException $e) {
    error_log("Erreur PDO: " . $e->getMessage());
    // Envoyer toujours une réponse JSON, même en cas d'erreur
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Échec de la connexion à la base de données',
        'error' => $e->getMessage()
    ]);
    exit;
} catch (Exception $e) {
    error_log("Erreur: " . $e->getMessage());
    // Envoyer toujours une réponse JSON, même en cas d'erreur
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur serveur',
        'error' => $e->getMessage()
    ]);
    exit;
}
?>
