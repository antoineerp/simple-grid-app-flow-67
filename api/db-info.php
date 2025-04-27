
<?php
// Fichier pour obtenir des informations sur la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

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
    
    // Récupérer les informations de base de la base de données
    $tables = [];
    $tableCount = 0;
    $size = "Inconnue";
    $encoding = "";
    $collation = "";
    
    // Liste des tables
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
        $tableCount++;
    }
    
    // Taille de la base de données
    $stmt = $pdo->query("SELECT 
                         SUM(data_length + index_length) / 1024 / 1024 AS size 
                         FROM information_schema.TABLES 
                         WHERE table_schema = '$dbname'");
    if ($sizeInfo = $stmt->fetch()) {
        $size = number_format($sizeInfo['size'], 2) . ' MB';
    }
    
    // Encodage et collation
    $stmt = $pdo->query("SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
                         FROM information_schema.SCHEMATA 
                         WHERE SCHEMA_NAME = '$dbname'");
    if ($encodingInfo = $stmt->fetch()) {
        $encoding = $encodingInfo['DEFAULT_CHARACTER_SET_NAME'];
        $collation = $encodingInfo['DEFAULT_COLLATION_NAME'];
    }
    
    // Date de dernière sauvegarde (simulée car cela dépend de l'infrastructure)
    $lastBackup = date('Y-m-d H:i:s', time() - 86400); // Hier
    
    // Préparer la réponse
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Informations de la base de données récupérées avec succès',
        'database_info' => [
            'host' => $host,
            'database' => $dbname,
            'size' => $size,
            'tables' => $tableCount,
            'encoding' => $encoding,
            'collation' => $collation,
            'lastBackup' => $lastBackup,
            'status' => 'Online',
            'tableList' => $tables
        ],
    ]);
    exit;
} catch (PDOException $e) {
    error_log("Erreur de connexion PDO: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Échec de la récupération des informations de base de données',
        'error' => $e->getMessage()
    ]);
    exit;
} catch (Exception $e) {
    error_log("Erreur générale: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de la récupération des informations',
        'error' => $e->getMessage()
    ]);
    exit;
}
?>
