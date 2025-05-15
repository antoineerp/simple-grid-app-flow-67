
<?php
header('Content-Type: application/json');

// Tentative de chargement des fichiers de configuration
$config_paths = [
    __DIR__ . '/config/env.php',
    __DIR__ . '/../api/config/env.php',
    dirname(__DIR__) . '/api/config/env.php',
    $_SERVER['DOCUMENT_ROOT'] . '/api/config/env.php'
];

$loaded = false;
$loaded_path = '';

foreach ($config_paths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $loaded = true;
        $loaded_path = $path;
        break;
    }
}

// Tester la connexion à la base de données
$db_connected = false;
$db_error = '';

if ($loaded && defined('DB_HOST') && defined('DB_NAME') && defined('DB_USER') && defined('DB_PASS')) {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        $db_connected = true;
        
        // Tester une requête simple
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM utilisateurs");
        $user_count = $stmt->fetch()['count'];
    } catch (PDOException $e) {
        $db_error = $e->getMessage();
    }
}

// Récupérer les informations sur le système
$system_info = [
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'document_root' => $_SERVER['DOCUMENT_ROOT'],
    'script_filename' => $_SERVER['SCRIPT_FILENAME'],
    'current_dir' => __DIR__,
    'parent_dir' => dirname(__DIR__),
    'time' => date('Y-m-d H:i:s')
];

// Construire la réponse
$response = [
    'status' => $loaded && $db_connected ? 'success' : 'error',
    'message' => $loaded && $db_connected ? 'API et base de données fonctionnelles' : 'Problèmes détectés',
    'config' => [
        'env_loaded' => $loaded,
        'env_path' => $loaded ? $loaded_path : 'Non trouvé',
        'constants' => [
            'DB_HOST' => defined('DB_HOST') ? DB_HOST : 'Non défini',
            'DB_NAME' => defined('DB_NAME') ? DB_NAME : 'Non défini',
            'DB_USER' => defined('DB_USER') ? DB_USER : 'Non défini',
            'API_BASE_URL' => defined('API_BASE_URL') ? API_BASE_URL : 'Non défini',
            'APP_ENV' => defined('APP_ENV') ? APP_ENV : 'Non défini'
        ]
    ],
    'database' => [
        'connected' => $db_connected,
        'error' => $db_error,
        'user_count' => $db_connected ? $user_count : 'N/A'
    ],
    'system' => $system_info,
    'debug_info' => [
        'config_paths_checked' => $config_paths
    ]
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>
