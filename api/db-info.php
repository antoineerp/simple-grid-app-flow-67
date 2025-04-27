
<?php
// Fichier d'information sur la base de données
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
    // Connexion à la base de données
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
    
    error_log("Tentative de connexion à la base de données");
    $pdo = new PDO($dsn, $username, $password, $options);
    error_log("Connexion à la base de données réussie");
    
    // Récupérer des informations sur la base
    $infos = [];
    
    // Récupérer le nombre de tables
    $tables = [];
    $tableCount = 0;
    $stmt = $pdo->query("SHOW TABLES");
    while($row = $stmt->fetch()) {
        $tableCount++;
        $tables[] = $row[0];
    }
    
    // Récupérer l'encodage et la collation
    $stmt = $pdo->query("SELECT @@character_set_database AS charset, @@collation_database AS collation");
    $dbCharset = $stmt->fetch();
    
    // Récupérer la taille de la base
    try {
        $stmt = $pdo->query("SELECT 
            ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb 
            FROM information_schema.TABLES 
            WHERE table_schema = '$dbname'");
        $sizeData = $stmt->fetch();
        $size = $sizeData ? $sizeData['size_mb'] . " MB" : "Inconnue";
    } catch (Exception $e) {
        error_log("Erreur lors de la récupération de la taille: " . $e->getMessage());
        $size = "Non disponible";
    }
    
    // Préparer les informations à renvoyer
    $dbInfo = [
        'host' => $host,
        'database' => $dbname,
        'size' => $size,
        'tables' => $tableCount,
        'lastBackup' => 'N/A', // Non disponible sans accès au système de fichiers
        'status' => 'Online',
        'encoding' => $dbCharset['charset'] ?? 'utf8mb4',
        'collation' => $dbCharset['collation'] ?? 'utf8mb4_general_ci',
        'tableList' => $tables
    ];
    
    // Renvoyer la réponse
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Informations sur la base de données récupérées avec succès',
        'database_info' => $dbInfo
    ]);
    exit;
    
} catch (PDOException $e) {
    error_log("Erreur PDO: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur de connexion à la base de données',
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
