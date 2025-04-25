
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

// Activation de la journalisation des erreurs
ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', 'php_diagnostic.log');

function checkConfiguration() {
    return [
        'php_version' => [
            'value' => phpversion(),
            'required' => '7.4.0',
            'status' => version_compare(phpversion(), '7.4.0', '>=') ? 'ok' : 'error'
        ],
        'memory_limit' => [
            'value' => ini_get('memory_limit'),
            'recommended' => '256M',
            'status' => (int)ini_get('memory_limit') >= 256 ? 'ok' : 'warning'
        ],
        'max_execution_time' => [
            'value' => ini_get('max_execution_time'),
            'recommended' => '300',
            'status' => (int)ini_get('max_execution_time') >= 300 ? 'ok' : 'warning'
        ]
    ];
}

function checkModules() {
    $required_modules = ['pdo', 'pdo_mysql', 'json', 'mbstring', 'curl'];
    $modules_status = [];
    
    foreach ($required_modules as $module) {
        $modules_status[$module] = [
            'loaded' => extension_loaded($module),
            'version' => phpversion($module),
            'status' => extension_loaded($module) ? 'ok' : 'error'
        ];
    }
    
    return $modules_status;
}

function checkFilePermissions() {
    $paths = [
        'api' => realpath('.'),
        'config' => realpath('./config'),
        'uploads' => realpath('../public/lovable-uploads')
    ];
    
    $permissions = [];
    foreach ($paths as $name => $path) {
        $permissions[$name] = [
            'path' => $path,
            'exists' => $path !== false,
            'readable' => $path !== false && is_readable($path),
            'writable' => $path !== false && is_writable($path),
            'status' => 'unknown'
        ];
        
        if ($path === false) {
            $permissions[$name]['status'] = 'error';
        } else if (is_readable($path) && is_writable($path)) {
            $permissions[$name]['status'] = 'ok';
        } else {
            $permissions[$name]['status'] = 'warning';
        }
    }
    
    return $permissions;
}

function checkServerEnvironment() {
    return [
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
        'server_api' => php_sapi_name(),
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible',
        'server_protocol' => $_SERVER['SERVER_PROTOCOL'] ?? 'Non disponible',
        'https' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Non disponible',
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Non disponible'
    ];
}

function testDatabaseConnection() {
    try {
        if (!file_exists('config/db_config.json')) {
            return ['status' => 'error', 'message' => 'Configuration de base de données non trouvée'];
        }

        $config = json_decode(file_get_contents('config/db_config.json'), true);
        if (!$config) {
            return ['status' => 'error', 'message' => 'Configuration de base de données invalide'];
        }

        $dsn = "mysql:host={$config['host']};dbname={$config['db_name']};charset=utf8mb4";
        $pdo = new PDO($dsn, $config['username'], $config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5
        ]);

        $result = $pdo->query("SELECT 1")->fetch();
        return [
            'status' => 'ok',
            'message' => 'Connexion réussie',
            'database_info' => [
                'host' => $config['host'],
                'database' => $config['db_name'],
                'connected' => true
            ]
        ];
    } catch (PDOException $e) {
        return [
            'status' => 'error',
            'message' => 'Erreur de connexion: ' . $e->getMessage()
        ];
    }
}

// Exécuter tous les tests
$diagnostic_results = [
    'timestamp' => date('Y-m-d H:i:s'),
    'configuration' => checkConfiguration(),
    'modules' => checkModules(),
    'file_permissions' => checkFilePermissions(),
    'server_environment' => checkServerEnvironment(),
    'database' => testDatabaseConnection()
];

// Déterminer le statut global
$global_status = 'ok';
foreach ($diagnostic_results as $category => $results) {
    if (is_array($results)) {
        foreach ($results as $item) {
            if (is_array($item) && isset($item['status']) && $item['status'] === 'error') {
                $global_status = 'error';
                break 2;
            }
        }
    }
}

$diagnostic_results['global_status'] = $global_status;

// Journaliser le résultat
error_log("Diagnostic PHP exécuté le " . date('Y-m-d H:i:s') . " - Statut: " . $global_status);

// Retourner les résultats en JSON
echo json_encode($diagnostic_results, JSON_PRETTY_PRINT);
?>
