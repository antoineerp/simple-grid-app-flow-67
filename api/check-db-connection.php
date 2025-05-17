
<?php
// Script pour vérifier la connexion à la base de données avec diagnostic
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Vérifier si la requête est OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Paramètres par défaut pour la connexion de test
$dbParams = [
    'host' => '',
    'name' => '',
    'user' => '',
    'pass' => ''
];

// Essayer de charger les variables d'environnement
$envFiles = [
    __DIR__ . '/config/env.php',
    __DIR__ . '/config/env.example.php',
    __DIR__ . '/config/db_config.json'
];

$envLoaded = false;

foreach ($envFiles as $envFile) {
    if (file_exists($envFile)) {
        if (pathinfo($envFile, PATHINFO_EXTENSION) === 'php') {
            // Charger le fichier PHP
            include $envFile;
            if (defined('DB_HOST') && defined('DB_NAME') && defined('DB_USER')) {
                $dbParams['host'] = DB_HOST;
                $dbParams['name'] = DB_NAME;
                $dbParams['user'] = DB_USER;
                $dbParams['pass'] = defined('DB_PASS') ? DB_PASS : '';
                $envLoaded = true;
                break;
            }
        } elseif (pathinfo($envFile, PATHINFO_EXTENSION) === 'json') {
            // Charger le fichier JSON
            $config = json_decode(file_get_contents($envFile), true);
            if (isset($config['host']) && isset($config['database']) && isset($config['user'])) {
                $dbParams['host'] = $config['host'];
                $dbParams['name'] = $config['database'];
                $dbParams['user'] = $config['user'];
                $dbParams['pass'] = $config['password'] ?? '';
                $envLoaded = true;
                break;
            }
        }
    }
}

// Si aucun fichier de configuration n'a été trouvé, créer un fichier env.php de base
if (!$envLoaded) {
    $configDir = __DIR__ . '/config';
    if (!is_dir($configDir)) {
        mkdir($configDir, 0755, true);
    }
    
    $envContent = "<?php
// Configuration de la base de données
define('DB_HOST', 'localhost');
define('DB_NAME', 'qualiopi_db');
define('DB_USER', 'qualiopi_user');
define('DB_PASS', ''); // À définir
";
    
    file_put_contents($configDir . '/env.php', $envContent);
}

// Résultat par défaut
$result = [
    'success' => false,
    'message' => 'Test de connexion à la base de données',
    'config_loaded' => $envLoaded,
    'db_config' => [
        'host' => $dbParams['host'],
        'database' => $dbParams['name'],
        'user' => $dbParams['user']
    ],
    'tests' => [],
    'timestamp' => date('Y-m-d H:i:s')
];

// Tester la connexion si les paramètres sont définis
if ($dbParams['host'] && $dbParams['name'] && $dbParams['user']) {
    try {
        $dsn = "mysql:host=" . $dbParams['host'] . ";dbname=" . $dbParams['name'] . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $result['tests']['connection_start'] = microtime(true);
        $pdo = new PDO($dsn, $dbParams['user'], $dbParams['pass'], $options);
        $result['tests']['connection_end'] = microtime(true);
        $result['tests']['connection_time'] = $result['tests']['connection_end'] - $result['tests']['connection_start'];
        
        // Vérifier la connexion avec une requête simple
        $stmt = $pdo->query("SELECT 1 AS test");
        $test = $stmt->fetchColumn();
        
        if ($test === 1) {
            $result['success'] = true;
            $result['message'] = 'Connexion à la base de données réussie';
            
            // Informations sur le serveur MySQL
            $serverInfo = $pdo->getAttribute(PDO::ATTR_SERVER_VERSION);
            $result['db_info'] = [
                'version' => $serverInfo,
                'type' => 'MySQL'
            ];
            
            // Vérifier si des tables existent
            $tables = [];
            $stmt = $pdo->query("SHOW TABLES");
            while ($row = $stmt->fetch()) {
                $tables[] = $row[0];
            }
            $result['tables'] = [
                'count' => count($tables),
                'list' => $tables
            ];
        }
        
    } catch (PDOException $e) {
        $result['message'] = 'Erreur de connexion à la base de données';
        $result['error'] = $e->getMessage();
        $result['error_code'] = $e->getCode();
    }
} else {
    $result['message'] = 'Configuration de base de données incomplète';
    $result['missing'] = [];
    
    if (!$dbParams['host']) $result['missing'][] = 'host';
    if (!$dbParams['name']) $result['missing'][] = 'name';
    if (!$dbParams['user']) $result['missing'][] = 'user';
    if (!$dbParams['pass']) $result['missing'][] = 'pass';
}

// Renvoyer le résultat en JSON
echo json_encode($result);
?>
