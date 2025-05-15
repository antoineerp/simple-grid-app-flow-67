
<?php
// Test direct de connexion à la base de données
// Ce fichier est accessible via URL pour diagnostiquer les problèmes de connexion
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journaliser l'accès
error_log("=== EXÉCUTION DE direct-db-test.php ===");
$result = [
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'server_info' => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu'
];

try {
    // Charger la configuration depuis le fichier JSON
    $config_file = __DIR__ . '/config/db_config.json';
    
    if (file_exists($config_file)) {
        $result['config_file'] = 'Trouvé';
        $config_content = file_get_contents($config_file);
        $config = json_decode($config_content, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Erreur de décodage JSON: " . json_last_error_msg());
        }
        
        // Masquer le mot de passe dans la réponse
        $result['config'] = [
            'host' => $config['host'] ?? 'Non défini',
            'db_name' => $config['db_name'] ?? 'Non défini',
            'username' => $config['username'] ?? 'Non défini',
        ];
        
        // Tester la connexion PDO
        $result['database'] = ['test_started' => true];
        $start_time = microtime(true);
        
        $dsn = "mysql:host=" . $config['host'] . ";dbname=" . $config['db_name'] . ";charset=utf8";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $pdo = new PDO($dsn, $config['username'], $config['password'], $options);
        $time = round((microtime(true) - $start_time) * 1000, 2);
        
        // Ajouter les résultats de connexion
        $result['database']['connected'] = true;
        $result['database']['connection_time'] = $time . ' ms';
        
        // Obtenir des informations sur la version MySQL
        $query = $pdo->query("SELECT VERSION() as version, DATABASE() as db");
        $db_info = $query->fetch();
        $result['database']['version'] = $db_info['version'];
        $result['database']['current_db'] = $db_info['db'];
        
        // Compter les tables
        $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_ASSOC);
        $result['database']['tables_count'] = count($tables);
        
        // Vérifier la table utilisateurs
        $stmt = $pdo->query("SHOW TABLES LIKE 'utilisateurs'");
        $table_exists = $stmt->rowCount() > 0;
        $result['database']['utilisateurs_table_exists'] = $table_exists;
        
        if ($table_exists) {
            // Compter les utilisateurs
            $count = $pdo->query("SELECT COUNT(*) FROM utilisateurs")->fetchColumn();
            $result['database']['utilisateurs_count'] = $count;
            
            // Récupérer quelques exemples
            if ($count > 0) {
                $users = $pdo->query("SELECT id, email, role FROM utilisateurs LIMIT 3")->fetchAll();
                $result['database']['utilisateurs_examples'] = $users;
            }
        }
        
        $result['status'] = 'success';
        $result['message'] = 'Connexion à la base de données réussie';
    } else {
        throw new Exception("Fichier de configuration non trouvé: " . $config_file);
    }
} catch (Exception $e) {
    $result['status'] = 'error';
    $result['message'] = $e->getMessage();
    $result['error_type'] = get_class($e);
    
    // Ajouter des informations de débogage
    if (isset($config) && !empty($config)) {
        // Masquer le mot de passe
        if (isset($config['password'])) {
            $config['password'] = '******';
        }
        $result['debug_config'] = $config;
    }
    
    error_log("Erreur dans direct-db-test.php: " . $e->getMessage());
}

// Inclure l'IP pour le débogage
$result['client_ip'] = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';

// Renvoyer le résultat au format JSON
echo json_encode($result, JSON_PRETTY_PRINT);
?>
