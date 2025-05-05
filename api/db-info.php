
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Fichier pour récupérer les informations de la base de données
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
error_log("=== EXÉCUTION DE db-info.php ===");

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
    
    error_log("Tentative de connexion PDO directe à la base de données");
    $pdo = new PDO($dsn, $username, $password, $options);
    error_log("Connexion PDO réussie");
    
    // Récupérer des informations sur la base de données
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $tableCount = count($tables);
    
    // Récupérer la taille de la base de données
    $dbSizeQuery = "SELECT 
        SUM(data_length + index_length) / 1024 / 1024 AS size_mb 
        FROM information_schema.tables 
        WHERE table_schema = :dbname";
    $dbSizeStmt = $pdo->prepare($dbSizeQuery);
    $dbSizeStmt->bindParam(':dbname', $dbname);
    $dbSizeStmt->execute();
    $dbSizeResult = $dbSizeStmt->fetch();
    $dbSize = round($dbSizeResult['size_mb'], 2) . " MB";
    
    // Récupérer l'encodage et la collation
    $collationQuery = "SELECT default_character_set_name, default_collation_name 
                      FROM information_schema.SCHEMATA 
                      WHERE schema_name = :dbname";
    $collationStmt = $pdo->prepare($collationQuery);
    $collationStmt->bindParam(':dbname', $dbname);
    $collationStmt->execute();
    $collationResult = $collationStmt->fetch();
    
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Informations de la base de données récupérées avec succès',
        'database' => [
            'host' => $host,
            'database' => $dbname,
            'status' => 'Online',
            'tables' => $tableCount,
            'tableList' => $tables,
            'size' => $dbSize,
            'encoding' => $collationResult['default_character_set_name'],
            'collation' => $collationResult['default_collation_name'],
            'lastBackup' => 'Non disponible',
            'connection_user' => $username
        ]
    ]);
} catch (PDOException $e) {
    error_log("Erreur de connexion PDO: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Échec de la connexion à la base de données',
        'error' => $e->getMessage(),
        'database' => [
            'host' => isset($host) ? $host : 'Non défini',
            'database' => isset($dbname) ? $dbname : 'Non défini',
            'status' => 'Offline',
            'tables' => 0,
            'tableList' => [],
            'size' => '0 MB',
            'encoding' => 'Non disponible',
            'collation' => 'Non disponible',
            'lastBackup' => 'Non disponible',
            'connection_user' => isset($username) ? $username : 'Non défini'
        ]
    ]);
} catch (Exception $e) {
    error_log("Erreur générale: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de la récupération des informations de la base de données',
        'error' => $e->getMessage()
    ]);
} finally {
    // S'assurer que tout buffer est vidé
    if (ob_get_level()) ob_end_flush();
}
?>
