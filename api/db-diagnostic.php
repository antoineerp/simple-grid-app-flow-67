
<?php
// Configuration des headers
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

// Activer la journalisation d'erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/db_diagnostic_errors.log');

// Fonction pour nettoyer la sortie
function clean_output() {
    if (ob_get_level()) ob_clean();
}

// Démarrer un buffer de sortie pour éviter les erreurs d'en-têtes déjà envoyés
ob_start();

try {
    // Initialiser le tableau de résultats
    $result = [
        'timestamp' => date('Y-m-d H:i:s'),
        'server_info' => [
            'php_version' => phpversion(),
            'server_name' => $_SERVER['SERVER_NAME'] ?? 'unknown',
            'script' => $_SERVER['SCRIPT_NAME'] ?? 'unknown',
            'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]
    ];
    
    // Configuration directe pour le PDO Test (unique et fiable)
    $pdo_config = [
        'host' => 'p71x6d.myd.infomaniak.com',
        'db_name' => 'p71x6d_richard',
        'username' => 'p71x6d_richard',
        'password' => 'Trottinette43!'
    ];
    
    // Test direct PDO (méthode principale et fiable)
    $result['database_connection'] = testPdoConnection($pdo_config);
    
    // Nettoyer toute sortie précédente
    clean_output();
    
    // Renvoyer les résultats du diagnostic
    http_response_code(200);
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    // Nettoyer toute sortie précédente
    clean_output();
    
    // Log et renvoie l'erreur
    error_log("Erreur dans le diagnostic DB: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => "Erreur lors du diagnostic de la base de données: " . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

// Fin du script: vidage du buffer
ob_end_flush();

// Fonction pour tester la connexion PDO (unique et fiable)
function testPdoConnection($config) {
    try {
        $dsn = "mysql:host={$config['host']};dbname={$config['db_name']};charset=utf8mb4";
        $pdo = new PDO($dsn, $config['username'], $config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);
        
        // Vérifier la connexion avec une requête simple
        $stmt = $pdo->query("SELECT VERSION() as version");
        $version = $stmt->fetchColumn();
        
        // Récupérer la liste des tables
        $tableQuery = $pdo->query("SHOW TABLES");
        $tables = $tableQuery->fetchAll(PDO::FETCH_COLUMN);
        
        return [
            'status' => 'success',
            'message' => 'Connexion à la base de données réussie',
            'connection_info' => [
                'host' => $config['host'],
                'database' => $config['db_name'],
                'user' => $config['username'],
                'version' => $version,
                'tables_count' => count($tables),
                'tables' => $tables
            ]
        ];
    } catch (PDOException $e) {
        return [
            'status' => 'error',
            'message' => 'Échec de la connexion à la base de données',
            'error' => $e->getMessage()
        ];
    }
}
?>
