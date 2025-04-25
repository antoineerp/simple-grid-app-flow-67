
<?php
/**
 * Script unifié et simplifié pour tester la connexion à la base de données Infomaniak
 * Un seul point d'entrée, un résultat clair et cohérent
 */

// En-têtes nécessaires
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'exécution
error_log("=== EXÉCUTION DE db-connection-simple.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

try {
    // Paramètres de connexion directs (pour le test uniquement)
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_system";
    $password = "Trottinette43!";
    
    // Configuration DSN pour PDO
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_TIMEOUT => 5 // Timeout court
    ];
    
    // Tenter la connexion PDO
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Tester que la connexion est fonctionnelle avec une requête simple
    $stmt = $pdo->query("SELECT 1 AS connected");
    $result = $stmt->fetch();
    
    if ($result && isset($result['connected'])) {
        // Récupérer des infos complémentaires sur la base de données
        $versionStmt = $pdo->query("SELECT VERSION() AS version");
        $versionResult = $versionStmt->fetch();
        
        // Compter les tables
        $tablesStmt = $pdo->query("SHOW TABLES");
        $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Générer la réponse de succès
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'Connexion à la base de données établie avec succès',
            'database' => [
                'host' => $host,
                'name' => $dbname,
                'tables_count' => count($tables),
                'tables_sample' => array_slice($tables, 0, 10),
                'mysql_version' => $versionResult['version'] ?? 'Inconnue'
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_PRETTY_PRINT);
    } else {
        throw new Exception("La requête de test n'a pas retourné le résultat attendu");
    }
} catch (PDOException $e) {
    // En cas d'erreur de connexion PDO
    error_log("Erreur PDO: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Échec de la connexion à la base de données',
        'error' => $e->getMessage(),
        'code' => $e->getCode(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    // En cas d'erreur générique
    error_log("Exception: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du test de connexion',
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}
?>
