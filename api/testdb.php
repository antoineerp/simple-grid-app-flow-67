
<?php
// Test de connexion simple à la base de données pour déboguer
header('Content-Type: application/json');

// Activer la journalisation des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0); // Ne pas afficher dans la sortie JSON
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/db_test_errors.log');

// Démarrer la capture des erreurs
ob_start();

try {
    // Étape 1: Charger la configuration
    echo "Chargement de la configuration...\n";
    $config_file = __DIR__ . '/config/db_config.json';
    
    if (!file_exists($config_file)) {
        throw new Exception("Fichier de configuration non trouvé: $config_file");
    }
    
    $config = json_decode(file_get_contents($config_file), true);
    if ($config === null && json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Erreur de décodage JSON: " . json_last_error_msg());
    }
    
    // Étape 2: Connexion à la base de données
    echo "Tentative de connexion à MySQL...\n";
    $dsn = "mysql:host=" . $config['host'] . ";dbname=" . $config['db_name'] . ";charset=utf8";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $config['username'], $config['password'], $options);
    echo "Connexion établie avec succès.\n";
    
    // Étape 3: Exécuter une requête simple
    echo "Exécution d'une requête de test...\n";
    $stmt = $pdo->query("SELECT VERSION() as version, NOW() as now, DATABASE() as db");
    $result = $stmt->fetch();
    
    echo "Version MySQL: " . $result['version'] . "\n";
    echo "Date/heure MySQL: " . $result['now'] . "\n";
    echo "Base de données: " . $result['db'] . "\n";
    
    // Étape 4: Lister les tables
    echo "Liste des tables:\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($tables as $table) {
        $count = $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
        echo "- $table ($count enregistrements)\n";
    }
    
    // Finaliser le résultat
    $debug_output = ob_get_clean();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Connexion à la base de données établie avec succès',
        'connection_info' => [
            'host' => $config['host'],
            'db_name' => $config['db_name'],
            'php_version' => PHP_VERSION,
            'pdo_drivers' => PDO::getAvailableDrivers(),
            'mysql_version' => $result['version']
        ],
        'tables' => $tables,
        'debug_output' => $debug_output
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    $debug_output = ob_get_clean();
    
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'debug_output' => $debug_output,
        'php_info' => [
            'version' => PHP_VERSION,
            'sapi' => php_sapi_name(),
            'extensions' => get_loaded_extensions()
        ]
    ], JSON_PRETTY_PRINT);
    
    // Journaliser l'erreur
    error_log("Erreur de connexion à la base de données: " . $e->getMessage());
}
?>
