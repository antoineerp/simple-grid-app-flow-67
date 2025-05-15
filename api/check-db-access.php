
<?php
// Script pour vérifier l'accès aux différentes bases de données
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Fonction pour tester la connexion à une base de données
function testDatabase($host, $db_name, $username, $password) {
    try {
        $dsn = "mysql:host={$host};dbname={$db_name};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        // Tenter d'établir la connexion
        $pdo = new PDO($dsn, $username, $password, $options);
        
        // Vérifier la connexion avec une requête simple
        $stmt = $pdo->query("SELECT DATABASE() as db_name");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Récupérer la liste des tables
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        return [
            'status' => 'success',
            'database' => $result['db_name'],
            'tables' => $tables,
            'table_count' => count($tables)
        ];
    } catch (PDOException $e) {
        return [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
}

// Configurer les bases de données à tester
$databases = [
    'richard' => [
        'host' => 'p71x6d.myd.infomaniak.com',
        'db_name' => 'p71x6d_richard',
        'username' => 'p71x6d_richard',
        'password' => 'Trottinette43!' // À modifier avec votre mot de passe réel
    ]
];

// Tester les connexions
$results = [];
foreach ($databases as $name => $config) {
    $results[$name] = testDatabase(
        $config['host'],
        $config['db_name'],
        $config['username'],
        $config['password']
    );
}

// Retourner les résultats
echo json_encode([
    'status' => 'success',
    'timestamp' => date('Y-m-d H:i:s'),
    'databases' => $results
]);
?>
