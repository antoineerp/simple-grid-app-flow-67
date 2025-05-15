
<?php
// Inclure notre fichier de configuration d'environnement
if (!function_exists('env')) {
    require_once '../config/env.php';
}

// Configuration des en-têtes CORS
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Activer la journalisation des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/database_test_errors.log');

// Fonction pour tester la connexion à la base de données
function testDatabaseConnection() {
    try {
        // Configuration de connexion standard
        $host = "p71x6d.myd.infomaniak.com";
        $dbname = "p71x6d_system";
        $username = "p71x6d_system";
        $password = "Trottinette43!";
        
        // Créer une connexion PDO directe
        $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $pdo = new PDO($dsn, $username, $password, $options);
        
        // Exécuter une requête simple pour vérifier la connexion
        $stmt = $pdo->query("SELECT VERSION() as version");
        $result = $stmt->fetch();
        
        // Récupérer des informations supplémentaires sur la base de données
        $tableQuery = $pdo->query("SHOW TABLES");
        $tables = $tableQuery->fetchAll(PDO::FETCH_COLUMN);
        
        return [
            'success' => true,
            'message' => 'Connexion à la base de données réussie',
            'version' => $result['version'],
            'tables_count' => count($tables),
            'tables' => $tables
        ];
    } catch (PDOException $e) {
        error_log("Erreur de connexion PDO: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'Erreur de connexion à la base de données',
            'error' => $e->getMessage()
        ];
    }
}

// Exécuter le test de connexion et retourner le résultat
$result = testDatabaseConnection();
echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
