
<?php
// Diagnostic complet du système PHP et configuration
// Ce script vérifie tous les fichiers essentiels et routes

// En-têtes pour éviter la mise en cache et permettre les accès CORS
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Fonction pour formater les résultats de test
function testResult($test, $result, $message = '', $details = null) {
    return [
        'test' => $test,
        'status' => $result ? 'success' : 'error',
        'message' => $message,
        'details' => $details
    ];
}

// Journalisation de l'exécution
error_log('Exécution du script check-system.php - Diagnostique système');

$results = [];

// 1. Vérifier l'environnement PHP
$results['php'] = [
    'version' => phpversion(),
    'modules' => get_loaded_extensions(),
    'server_api' => php_sapi_name(),
    'display_errors' => ini_get('display_errors'),
    'error_reporting' => ini_get('error_reporting')
];

// 2. Vérifier les fichiers essentiels
$essential_files = [
    'env.php' => __DIR__ . '/env.php',
    'config/index.php' => __DIR__ . '/config/index.php',
    'config/DatabaseConfig.php' => __DIR__ . '/config/DatabaseConfig.php',
    'config/DatabaseConnection.php' => __DIR__ . '/config/DatabaseConnection.php',
    'config/database.php' => __DIR__ . '/config/database.php',
    'services/RequestHandler.php' => __DIR__ . '/services/RequestHandler.php',
    'services/TransactionManager.php' => __DIR__ . '/services/TransactionManager.php',
    'services/DataSyncService.php' => __DIR__ . '/services/DataSyncService.php',
    'config-test.php' => __DIR__ . '/config-test.php',
    'membres-load.php' => __DIR__ . '/membres-load.php',
    'membres-sync.php' => __DIR__ . '/membres-sync.php',
    'documents-load.php' => __DIR__ . '/documents-load.php',
    'documents-sync.php' => __DIR__ . '/documents-sync.php'
];

$files_results = [];
foreach ($essential_files as $name => $path) {
    $exists = file_exists($path);
    $files_results[$name] = testResult(
        "Fichier $name", 
        $exists, 
        $exists ? "Le fichier existe" : "Fichier manquant", 
        ['path' => $path, 'readable' => $exists ? is_readable($path) : false]
    );
}
$results['files'] = $files_results;

// 3. Vérifier les routes API essentielles
$routes_to_check = [
    '/api/index.php',
    '/api/check-php.php',
    '/api/config-test.php',
    '/api/membres-load.php',
    '/api/documents-load.php',
    '/api/membres-sync.php',
    '/api/documents-sync.php'
];

// Calculer l'URL de base
$protocol = ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$domain_name = $_SERVER['HTTP_HOST'];
$base_url = $protocol . $domain_name;

$routes_results = [];
foreach ($routes_to_check as $route) {
    $file_path = str_replace('/api/', '', $route);
    $file_path = __DIR__ . '/' . $file_path;
    $routes_results[$route] = testResult(
        "Route $route",
        file_exists($file_path),
        file_exists($file_path) ? "Le fichier existe" : "La route peut être inaccessible",
        ['file_path' => $file_path, 'url' => $base_url . $route]
    );
}
$results['routes'] = $routes_results;

// 4. Vérifier les paramètres de base de données
try {
    if (file_exists(__DIR__ . '/env.php')) {
        require_once __DIR__ . '/env.php';
        $db_params = [
            'host' => defined('DB_HOST') ? DB_HOST : 'Non défini',
            'database' => defined('DB_NAME') ? DB_NAME : 'Non défini',
            'user' => defined('DB_USER') ? DB_USER : 'Non défini',
            'password' => defined('DB_PASS') ? (defined('DB_PASS') ? '******' : 'Non défini') : 'Non défini',
        ];
        $db_defined = defined('DB_HOST') && defined('DB_NAME') && defined('DB_USER') && defined('DB_PASS');
        $results['database'] = testResult(
            "Configuration base de données", 
            $db_defined,
            $db_defined ? "Les paramètres de base de données sont définis" : "Les paramètres de base de données sont incomplets",
            $db_params
        );
    } else {
        $results['database'] = testResult(
            "Configuration base de données", 
            false,
            "Impossible de vérifier: env.php manquant",
            null
        );
    }
} catch (Exception $e) {
    $results['database'] = testResult(
        "Configuration base de données", 
        false,
        "Erreur lors de la vérification: " . $e->getMessage(),
        null
    );
}

// 5. Test de connexion à la base de données
try {
    if (file_exists(__DIR__ . '/env.php') && 
        file_exists(__DIR__ . '/config/database.php') && 
        defined('DB_HOST') && defined('DB_NAME') && 
        defined('DB_USER') && defined('DB_PASS')) {
        
        require_once __DIR__ . '/config/database.php';
        $database = new Database();
        $connection_test = $database->testConnection();
        
        $results['db_connection'] = testResult(
            "Test de connexion à la base de données",
            $connection_test,
            $connection_test ? "Connexion réussie à la base de données" : "Échec de la connexion",
            $database->getConfig()
        );
    } else {
        $results['db_connection'] = testResult(
            "Test de connexion à la base de données",
            false,
            "Impossible de tester: fichiers ou configurations manquants",
            null
        );
    }
} catch (Exception $e) {
    $results['db_connection'] = testResult(
        "Test de connexion à la base de données",
        false,
        "Erreur lors du test de connexion: " . $e->getMessage(),
        null
    );
}

// 6. Test d'exécution PHP
$results['php_execution'] = testResult(
    "Exécution PHP",
    true,
    "Ce script s'exécute correctement, PHP est fonctionnel",
    ['timestamp' => date('Y-m-d H:i:s'), 'memory_usage' => memory_get_usage(true)]
);

// 7. Vérification des dépendances PHP
$required_extensions = ['pdo', 'pdo_mysql', 'mbstring', 'json'];
$missing_extensions = [];

foreach ($required_extensions as $ext) {
    if (!extension_loaded($ext)) {
        $missing_extensions[] = $ext;
    }
}

$results['php_extensions'] = testResult(
    "Extensions PHP requises",
    empty($missing_extensions),
    empty($missing_extensions) ? "Toutes les extensions requises sont chargées" : "Extensions manquantes: " . implode(', ', $missing_extensions),
    ['required' => $required_extensions, 'missing' => $missing_extensions]
);

// 8. Vérifier la configuration CORS
if (file_exists(__DIR__ . '/env.php')) {
    require_once __DIR__ . '/env.php';
    $cors_config = [
        'dev_origin' => isset($_ENV['ALLOWED_ORIGIN_DEV']) ? $_ENV['ALLOWED_ORIGIN_DEV'] : 'Non défini',
        'prod_origin' => isset($_ENV['ALLOWED_ORIGIN_PROD']) ? $_ENV['ALLOWED_ORIGIN_PROD'] : 'Non défini',
        'current_env' => isset($_ENV['APP_ENV']) ? $_ENV['APP_ENV'] : 'Non défini'
    ];
    $cors_defined = isset($_ENV['ALLOWED_ORIGIN_DEV']) && isset($_ENV['ALLOWED_ORIGIN_PROD']);
    
    $results['cors'] = testResult(
        "Configuration CORS", 
        $cors_defined,
        $cors_defined ? "La configuration CORS est définie" : "La configuration CORS est incomplète",
        $cors_config
    );
} else {
    $results['cors'] = testResult(
        "Configuration CORS", 
        false,
        "Impossible de vérifier: env.php manquant",
        null
    );
}

// Résumé et recommandations
$error_count = 0;
foreach ($results as $category => $result) {
    if (is_array($result) && isset($result['status']) && $result['status'] === 'error') {
        $error_count++;
    } else if (is_array($result)) {
        foreach ($result as $test) {
            if (isset($test['status']) && $test['status'] === 'error') {
                $error_count++;
            }
        }
    }
}

$results['summary'] = [
    'total_tests' => count($essential_files) + count($routes_to_check) + 5, // +5 pour autres tests
    'errors' => $error_count,
    'status' => $error_count === 0 ? 'success' : 'warning',
    'message' => $error_count === 0 
        ? "Tous les composants essentiels sont correctement configurés"
        : "Il y a $error_count problème(s) à résoudre pour assurer le bon fonctionnement de l'application"
];

// Retourner les résultats au format JSON
echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
