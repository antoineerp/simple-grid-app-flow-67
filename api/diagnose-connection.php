
<?php
// Fichier de diagnostic optimisé pour la connexion à la base de données de production
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

// Configuration de production uniquement
$db_config = [
    'host' => 'p71x6d.myd.infomaniak.com',
    'db_name' => 'p71x6d_system',
    'username' => 'p71x6d_system',
    'password' => 'Trottinette43!'
];

// Fonction pour tester la connexion à la base de données
function testDatabaseConnection($config) {
    try {
        $dsn = "mysql:host={$config['host']};dbname={$config['db_name']};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ];
        
        $pdo = new PDO($dsn, $config['username'], $config['password'], $options);
        
        // Vérifier la connexion
        $stmt = $pdo->query("SELECT VERSION() as version");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Récupérer la liste des tables
        $tableQuery = $pdo->query("SHOW TABLES");
        $tables = $tableQuery->fetchAll(PDO::FETCH_COLUMN);
        
        // Récupérer des informations sur le jeu de caractères et la collation
        $encodingQuery = $pdo->query("SELECT @@character_set_database as encoding, @@collation_database as collation");
        $encoding = $encodingQuery->fetch(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'version' => $result['version'],
            'encoding' => $encoding['encoding'],
            'collation' => $encoding['collation'],
            'tables_count' => count($tables),
            'tables' => $tables
        ];
    } catch (PDOException $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

try {
    // Exécuter le test de connexion
    $connection_test = testDatabaseConnection($db_config);
    
    // Préparer la réponse
    $response = [
        'timestamp' => date('Y-m-d H:i:s'),
        'server_info' => [
            'php_version' => phpversion(),
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu'
        ],
        'database_info' => [
            'host' => $db_config['host'],
            'database' => $db_config['db_name'],
            'username' => $db_config['username']
        ],
        'connection_test' => $connection_test
    ];
    
    // Définir le statut global
    $response['status'] = $connection_test['success'] ? 'success' : 'error';
    $response['message'] = $connection_test['success'] 
        ? 'Connexion à la base de données réussie' 
        : 'Échec de la connexion à la base de données';
    
    // Envoyer la réponse
    http_response_code(200);
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du diagnostic de connexion: ' . $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>
