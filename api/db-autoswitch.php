
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Device-ID");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

error_log("=== EXÉCUTION DE db-autoswitch.php ===");

// Fonction pour tester une connexion à la base de données
function testConnection($host, $dbname, $username, $password) {
    try {
        $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 3, // Timeout après 3 secondes
        ];
        
        error_log("Tentative de connexion à {$dbname}");
        $pdo = new PDO($dsn, $username, $password, $options);
        
        // Test simple
        $stmt = $pdo->query("SELECT 1");
        $result = $stmt->fetchColumn();
        
        error_log("Connexion réussie à {$dbname}");
        return true;
    } catch (PDOException $e) {
        error_log("Échec de connexion à {$dbname}: " . $e->getMessage());
        return false;
    }
}

// Configurations des bases de données disponibles
$databases = [
    'system' => [
        'host' => 'p71x6d.myd.infomaniak.com',
        'db_name' => 'p71x6d_system',
        'username' => 'p71x6d_system',
        'password' => 'Trottinette43!'
    ]
];

// Tester chaque base de données dans l'ordre
$working_connections = [];
$primary_db = null;

foreach ($databases as $name => $config) {
    $result = testConnection(
        $config['host'],
        $config['db_name'],
        $config['username'],
        $config['password']
    );
    
    if ($result) {
        $working_connections[] = $name;
        
        // La première base de données qui fonctionne devient la principale
        if ($primary_db === null) {
            $primary_db = $name;
            
            // Mettre à jour le fichier de configuration
            $config_file = __DIR__ . '/config/db_config.json';
            $updated_config = json_encode($config, JSON_PRETTY_PRINT);
            file_put_contents($config_file, $updated_config);
            
            error_log("Configuration mise à jour pour utiliser {$name}");
        }
    }
}

// Retourner le résultat
echo json_encode([
    'status' => 'success',
    'working_connections' => $working_connections,
    'primary_db' => $primary_db,
    'message' => $primary_db ? 
        "Connexion établie avec {$databases[$primary_db]['db_name']}" : 
        "Aucune base de données disponible"
]);

error_log("=== FIN DE db-autoswitch.php ===");
?>
