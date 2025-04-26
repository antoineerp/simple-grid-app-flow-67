
<?php
// Point d'entrée simplifié pour les informations de base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Configurer la gestion des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/db_info_errors.log');

try {
    // Connexion directe à la base de données
    $dsn = "mysql:host=p71x6d.myd.infomaniak.com;dbname=p71x6d_system;charset=utf8mb4";
    $username = "p71x6d_system";
    $password = "Trottinette43!";
    
    $pdo = new PDO($dsn, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Récupérer des informations sur la base de données
    // Liste des tables
    $tables = [];
    $tablesStmt = $pdo->query("SHOW TABLES");
    while ($row = $tablesStmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }
    
    // Taille de la base de données
    $sizeStmt = $pdo->query("
        SELECT 
            SUM(data_length + index_length) as size
        FROM 
            information_schema.TABLES 
        WHERE 
            table_schema = 'p71x6d_system'
    ");
    $sizeData = $sizeStmt->fetch(PDO::FETCH_ASSOC);
    $sizeMB = round(($sizeData['size'] ?? 0) / (1024 * 1024), 2) . ' MB';
    
    // Encodage et collation
    $encodingStmt = $pdo->query("
        SELECT default_character_set_name, default_collation_name
        FROM information_schema.SCHEMATA
        WHERE schema_name = 'p71x6d_system'
    ");
    $encodingData = $encodingStmt->fetch(PDO::FETCH_ASSOC);
    
    // Construire la réponse
    $response = [
        "status" => "success",
        "message" => "Informations de la base de données récupérées avec succès",
        "database_info" => [
            "host" => "p71x6d.myd.infomaniak.com",
            "database" => "p71x6d_system",
            "username" => $username,
            "size" => $sizeMB,
            "tables" => count($tables),
            "tableList" => $tables,
            "encoding" => $encodingData['default_character_set_name'] ?? 'utf8mb4',
            "collation" => $encodingData['default_collation_name'] ?? 'utf8mb4_unicode_ci',
            "lastBackup" => "Non disponible",
            "status" => "Online"
        ]
    ];
    
    // Envoyer la réponse
    http_response_code(200);
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    error_log("Erreur de base de données: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erreur lors de la connexion à la base de données",
        "error" => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    error_log("Erreur générale: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erreur lors de la récupération des informations",
        "error" => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>
