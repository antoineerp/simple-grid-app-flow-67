
<?php
// Fichier de diagnostic pour la connexion à la base de données avec des tests étape par étape
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Activer la journalisation des erreurs
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Fonctions utilitaires
function runTest($name, $callback) {
    try {
        $result = $callback();
        return [
            'name' => $name,
            'status' => 'success',
            'result' => $result
        ];
    } catch (Exception $e) {
        return [
            'name' => $name,
            'status' => 'error',
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ];
    }
}

// Exécuter tous les tests
$tests = [];

// Test 1: Vérifier l'environnement PHP
$tests[] = runTest('Environnement PHP', function() {
    return [
        'php_version' => phpversion(),
        'php_modules' => get_loaded_extensions(),
        'php_sapi' => php_sapi_name(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu',
        'pdo_drivers' => PDO::getAvailableDrivers()
    ];
});

// Test 2: Vérifier les fichiers de configuration
$tests[] = runTest('Fichiers de configuration', function() {
    $files = [
        'config/database.php' => file_exists('config/database.php'),
        'config/db_config.json' => file_exists('config/db_config.json'),
        'config/env.php' => file_exists('config/env.php')
    ];
    
    $errors = [];
    foreach ($files as $file => $exists) {
        if (!$exists) {
            $errors[] = "Le fichier $file n'existe pas";
        }
    }
    
    if (!empty($errors)) {
        throw new Exception(implode(', ', $errors));
    }
    
    return $files;
});

// Test 3: Vérifier le fichier db_config.json
$tests[] = runTest('Configuration de la base de données', function() {
    if (!file_exists('config/db_config.json')) {
        throw new Exception("Le fichier config/db_config.json n'existe pas");
    }
    
    $content = file_get_contents('config/db_config.json');
    if (!$content) {
        throw new Exception("Impossible de lire le fichier config/db_config.json");
    }
    
    $config = json_decode($content, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("JSON invalide dans config/db_config.json: " . json_last_error_msg());
    }
    
    $required = ['host', 'db_name', 'username', 'password'];
    $missing = [];
    foreach ($required as $field) {
        if (!isset($config[$field]) || empty($config[$field])) {
            $missing[] = $field;
        }
    }
    
    if (!empty($missing)) {
        throw new Exception("Champs manquants dans config/db_config.json: " . implode(', ', $missing));
    }
    
    return [
        'host' => $config['host'],
        'db_name' => $config['db_name'],
        'username' => $config['username'],
        'password_present' => !empty($config['password'])
    ];
});

// Test 4: Vérifier la connexion directe à MySQL
$tests[] = runTest('Connexion MySQL directe', function() {
    if (!file_exists('config/db_config.json')) {
        throw new Exception("Le fichier config/db_config.json n'existe pas");
    }
    
    $content = file_get_contents('config/db_config.json');
    $config = json_decode($content, true);
    
    $dsn = "mysql:host=" . $config['host'] . ";dbname=" . $config['db_name'] . ";charset=utf8mb4";
    
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    try {
        $pdo = new PDO($dsn, $config['username'], $config['password'], $options);
        
        // Tester une requête simple
        $stmt = $pdo->query("SELECT 1 as test");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return [
            'connection' => 'success',
            'test_query' => $result
        ];
    } catch (PDOException $e) {
        throw new Exception("Erreur de connexion PDO: " . $e->getMessage());
    }
});

// Test 5: Vérifier la classe Database
$tests[] = runTest('Classe Database', function() {
    if (!file_exists('config/database.php')) {
        throw new Exception("Le fichier config/database.php n'existe pas");
    }
    
    require_once 'config/database.php';
    
    if (!class_exists('Database')) {
        throw new Exception("La classe Database n'existe pas dans config/database.php");
    }
    
    $database = new Database();
    
    $config = $database->getConfig();
    
    $conn = $database->getConnection(false);
    
    if (!$database->is_connected) {
        throw new Exception("Échec de la connexion via Database: " . ($database->connection_error ?? "Raison inconnue"));
    }
    
    // Tester une requête simple
    $stmt = $conn->query("SELECT 1 as test");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return [
        'connection' => 'success',
        'config' => $config,
        'test_query' => $result
    ];
});

// Test 6: Vérifier les tables
$tests[] = runTest('Tables de la base de données', function() {
    require_once 'config/database.php';
    
    $database = new Database();
    $conn = $database->getConnection(false);
    
    if (!$database->is_connected) {
        throw new Exception("Échec de la connexion: " . ($database->connection_error ?? "Raison inconnue"));
    }
    
    // Obtenir la liste des tables
    $stmt = $conn->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Vérifier si la table 'utilisateurs' existe
    $utilisateurs_exists = in_array('utilisateurs', $tables);
    
    $result = [
        'tables' => $tables,
        'count' => count($tables),
        'utilisateurs_exists' => $utilisateurs_exists
    ];
    
    // Si la table 'utilisateurs' existe, compter le nombre d'utilisateurs
    if ($utilisateurs_exists) {
        $stmt = $conn->query("SELECT COUNT(*) as count FROM utilisateurs");
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        $result['utilisateurs_count'] = $count;
        
        // Si des utilisateurs existent, récupérer le premier à titre d'exemple
        if ($count > 0) {
            $stmt = $conn->query("SELECT id, identifiant_technique, email, role FROM utilisateurs LIMIT 1");
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            $result['sample_user'] = $user;
        }
    }
    
    return $result;
});

// Préparer la réponse
$response = [
    'timestamp' => date('Y-m-d H:i:s'),
    'tests' => $tests,
    'overall_status' => 'success'
];

// Vérifier si certains tests ont échoué
foreach ($tests as $test) {
    if ($test['status'] === 'error') {
        $response['overall_status'] = 'error';
        break;
    }
}

// Envoyer la réponse
http_response_code(200);
echo json_encode($response, JSON_PRETTY_PRINT);
?>
