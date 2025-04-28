
<?php
// Activer le debug pour le développement
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Définition des en-têtes HTTP pour CORS et type de contenu
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
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
error_log("=== EXÉCUTION DE direct-db-test.php ===");

try {
    // Tester la connexion PDO directement
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
    
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Récupérer la version de MySQL
    $versionStmt = $pdo->query('SELECT VERSION() as version');
    $versionRow = $versionStmt->fetch();
    $version = $versionRow['version'];
    
    // Récupérer la liste des tables
    $tablesStmt = $pdo->query('SHOW TABLES');
    $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Récupérer quelques utilisateurs (limité à 5 pour raisons de sécurité)
    $utilisateurs = [];
    $utilisateurs_count = 0;
    
    if (in_array('utilisateurs', $tables)) {
        $countStmt = $pdo->query('SELECT COUNT(*) FROM utilisateurs');
        $utilisateurs_count = $countStmt->fetchColumn();
        
        $utilisateursStmt = $pdo->query('SELECT id, identifiant_technique, email, role FROM utilisateurs LIMIT 5');
        $utilisateurs = $utilisateursStmt->fetchAll();
    }
    
    // Récupérer la taille de la base de données
    $sizeStmt = $pdo->query("SELECT sum(data_length + index_length) / 1024 / 1024 as size FROM information_schema.TABLES WHERE table_schema = '{$dbname}'");
    $sizeRow = $sizeStmt->fetch();
    $size = round($sizeRow['size'], 2) . ' MB';
    
    // Encoder et renvoyer la réponse JSON
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Connexion réussie à la base de données',
        'host' => $host,
        'database' => $dbname,
        'version' => $version,
        'tables' => $tables,
        'size' => $size,
        'utilisateurs_count' => $utilisateurs_count,
        'utilisateurs_sample' => $utilisateurs
    ]);
    
} catch (PDOException $e) {
    // En cas d'erreur de connexion PDO
    error_log("Erreur PDO: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Échec de la connexion à la base de données',
        'error' => $e->getMessage(),
        'connection_info' => [
            'host' => $host,
            'database' => $dbname,
            'username' => $username,
            'php_version' => PHP_VERSION,
            'pdo_drivers' => implode(', ', PDO::getAvailableDrivers())
        ]
    ]);
    
} catch (Exception $e) {
    // Pour toute autre erreur
    error_log("Erreur générale: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Une erreur est survenue',
        'error' => $e->getMessage()
    ]);
}
?>
