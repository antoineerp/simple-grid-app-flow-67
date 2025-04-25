
<?php
// Script de diagnostic complet pour vérifier l'environnement PHP et les requêtes API
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Vérifier si c'est une requête OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Collecter les informations sur le serveur PHP
$phpInfo = [
    'version' => phpversion(),
    'sapi' => php_sapi_name(),
    'os' => PHP_OS,
    'modules' => get_loaded_extensions(),
    'has_pdo' => extension_loaded('pdo'),
    'has_mysql' => extension_loaded('pdo_mysql'),
    'has_json' => extension_loaded('json'),
    'has_mbstring' => extension_loaded('mbstring'),
    'has_curl' => extension_loaded('curl'),
    'memory_limit' => ini_get('memory_limit'),
    'max_execution_time' => ini_get('max_execution_time'),
    'session_status' => session_status() == PHP_SESSION_ACTIVE ? 'Active' : 'Inactive',
    'output_buffering' => ini_get('output_buffering')
];

// Tester l'accès aux fichiers et dossiers
$filesystemTests = [];
$dirChecks = [
    '.' => 'Répertoire API courant',
    '..' => 'Répertoire racine',
    '../assets' => 'Dossier assets',
    '../public' => 'Dossier public'
];
foreach ($dirChecks as $dir => $label) {
    $filesystemTests[$label] = [
        'exists' => is_dir($dir),
        'readable' => is_readable($dir),
        'writable' => is_writable($dir),
        'file_count' => is_dir($dir) ? count(scandir($dir)) - 2 : 0
    ];
}

// Vérifier les fichiers critiques
$fileChecks = [
    'index.php' => 'API Index',
    '../index.html' => 'Index HTML principal',
    '../.htaccess' => 'Configuration Apache principale'
];
foreach ($fileChecks as $file => $label) {
    $filesystemTests[$label] = [
        'exists' => file_exists($file),
        'readable' => file_exists($file) && is_readable($file),
        'size' => file_exists($file) ? filesize($file) : 0
    ];
}

// Tester l'environnement réseau
$networkTests = [
    'server_name' => $_SERVER['SERVER_NAME'] ?? 'non disponible',
    'server_addr' => $_SERVER['SERVER_ADDR'] ?? 'non disponible',
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'non disponible',
    'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'non disponible',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'non disponible',
    'http_host' => $_SERVER['HTTP_HOST'] ?? 'non disponible',
    'https' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'oui' : 'non'
];

// Tester la base de données si possible
$databaseTest = [];
try {
    // Tenter une connexion à la base de données avec les paramètres de config s'ils existent
    $dbConfigFile = 'config/db_config.json';
    if (file_exists($dbConfigFile)) {
        $dbConfig = json_decode(file_get_contents($dbConfigFile), true);
        
        if ($dbConfig && isset($dbConfig['host'], $dbConfig['db_name'], $dbConfig['username'], $dbConfig['password'])) {
            $dsn = "mysql:host=" . $dbConfig['host'] . ";dbname=" . $dbConfig['db_name'] . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 5
            ];
            
            $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $options);
            $databaseTest = [
                'status' => 'success',
                'message' => 'Connexion à la base de données réussie',
                'host' => $dbConfig['host'],
                'database' => $dbConfig['db_name'],
                'tables' => []
            ];
            
            // Récupérer la liste des tables
            $stmt = $pdo->query("SHOW TABLES");
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                $databaseTest['tables'][] = $row[0];
            }
        } else {
            $databaseTest = [
                'status' => 'error',
                'message' => 'Configuration de base de données incomplète ou invalide'
            ];
        }
    } else {
        $databaseTest = [
            'status' => 'error',
            'message' => 'Fichier de configuration de base de données non trouvé'
        ];
    }
} catch (PDOException $e) {
    $databaseTest = [
        'status' => 'error',
        'message' => 'Erreur de connexion à la base de données: ' . $e->getMessage()
    ];
}

// Tester les assets et les CSS/JS si possible
$assetTests = [];
$assetsDir = '../assets';
if (is_dir($assetsDir)) {
    $jsFiles = glob("$assetsDir/*.js");
    $cssFiles = glob("$assetsDir/*.css");
    
    $assetTests = [
        'assets_dir_exists' => true,
        'js_count' => count($jsFiles),
        'css_count' => count($cssFiles),
        'js_files' => array_map('basename', $jsFiles),
        'css_files' => array_map('basename', $cssFiles)
    ];
} else {
    $assetTests = [
        'assets_dir_exists' => false
    ];
}

// Assembler tous les résultats de diagnostic
$diagnosticData = [
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => [
        'php' => $phpInfo,
        'network' => $networkTests
    ],
    'filesystem' => $filesystemTests,
    'database' => $databaseTest,
    'assets' => $assetTests
];

// Ajouter des informations sur les variables d'environnement si disponibles
if (function_exists('getenv')) {
    $diagnosticData['environment'] = [
        'app_env' => getenv('APP_ENV') ?: 'Non défini',
        'doc_root' => getenv('DOCUMENT_ROOT') ?: 'Non défini'
    ];
}

// Renvoyer les résultats au format JSON
echo json_encode($diagnosticData, JSON_PRETTY_PRINT);
?>
