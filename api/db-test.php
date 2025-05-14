
<?php
// Test simple de connexion à la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");

// Activer la journalisation des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/db_errors.log');

// Fonction pour nettoyer les sorties
function clean_output() {
    while (ob_get_level()) {
        ob_end_clean();
    }
}

// Démarrer un buffer de sortie
ob_start();

try {
    // Charger la configuration de la BD
    $config_file = __DIR__ . '/config/db_config.json';
    if (!file_exists($config_file)) {
        throw new Exception("Le fichier de configuration de la base de données n'existe pas");
    }
    
    $config = json_decode(file_get_contents($config_file), true);
    if ($config === null) {
        throw new Exception("Erreur de parsing du fichier de configuration: " . json_last_error_msg());
    }
    
    // Informations de connexion
    $host = $config['host'];
    $db_name = $config['db_name'];
    $username = $config['username'];
    $password = $config['password'];
    
    // Tenter une connexion PDO
    $dsn = "mysql:host=$host;dbname=$db_name;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5
    ];
    
    // Se connecter à la base de données
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Vérifier la version MySQL
    $stmt = $pdo->query('SELECT VERSION() as version');
    $version = $stmt->fetch()['version'];
    
    // Vérifier les tables disponibles
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Nettoyer la sortie
    clean_output();
    
    // Renvoyer le résultat
    echo json_encode([
        'status' => 'success',
        'message' => 'Connexion à la base de données réussie',
        'mysql_version' => $version,
        'database' => $db_name,
        'tables_count' => count($tables),
        'tables' => $tables
    ]);
    
} catch (PDOException $e) {
    // Nettoyer la sortie
    clean_output();
    
    // Renvoyer l'erreur
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur de connexion à la base de données',
        'error' => $e->getMessage()
    ]);
}
?>
