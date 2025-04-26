
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Configuration stricte des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// En-têtes CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Définir DIRECT_ACCESS_CHECK comme true pour permettre l'accès direct
define('DIRECT_ACCESS_CHECK', true);

// Journaliser l'exécution
error_log("Exécution de database-test.php - Méthode: " . $_SERVER['REQUEST_METHOD']);

try {
    // Paramètres de connexion
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_system";
    $password = "Trottinette43!";
    
    // Tenter une connexion PDO
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5,
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Récupérer la version de la base de données
    $stmt = $pdo->query("SELECT VERSION() as version");
    $dbVersion = $stmt->fetch();
    
    // Récupérer le nombre de tables
    $stmt = $pdo->query("SHOW TABLES");
    $tablesCount = $stmt->rowCount();
    
    // Renvoyer une réponse positive
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Test de connexion à la base de données réussi',
        'connection_info' => [
            'host' => $host,
            'database' => $dbname,
            'user' => $username,
            'connected' => true,
            'db_version' => $dbVersion['version'] ?? 'MySQL 8.0.x',
            'tables_count' => $tablesCount
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    // Journaliser l'erreur
    error_log("Erreur PDO dans database-test.php: " . $e->getMessage());
    
    // Nettoyer tout output buffer
    if (ob_get_level()) ob_clean();
    
    // Renvoyer une réponse d'erreur formatée en JSON
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => "Erreur de connexion à la base de données: " . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    // Journaliser l'erreur
    error_log("Erreur dans database-test.php: " . $e->getMessage());
    
    // Nettoyer tout output buffer
    if (ob_get_level()) ob_clean();
    
    // Renvoyer une réponse d'erreur formatée en JSON
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => "Erreur lors du test de connexion: " . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

// Libérer le output buffer
if (ob_get_level()) ob_end_flush();
?>
