
<?php
/**
 * Endpoint unifié de test de connexion à la base de données
 * Format standardisé pour toutes les API de l'application
 */

// En-têtes communs pour tous les endpoints API
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Journaliser l'exécution
error_log("=== EXÉCUTION DE test-db-connection.php ===");

// Vérifier si la requête est OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Configuration de base de la connexion (toujours valide)
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_richard";
    $username = "p71x6d_richard";
    $password = "Trottinette43!";
    
    // Tester la connexion PDO directement
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    error_log("Tentative de connexion PDO directe à la base de données");
    $pdo = new PDO($dsn, $username, $password, $options);
    error_log("Connexion PDO réussie");
    
    // Vérifier que la connexion fonctionne en exécutant une requête
    $stmt = $pdo->query("SELECT DATABASE() as db");
    $result = $stmt->fetch();
    $current_db = $result['db'];
    
    // Tester l'existence des tables principales
    $tables = [
        'utilisateurs' => false,
        'users' => false
    ];
    
    foreach ($tables as $table => $exists) {
        $stmt = $pdo->query("SHOW TABLES LIKE '{$table}'");
        $tables[$table] = $stmt->rowCount() > 0;
    }
    
    // Compter le nombre d'utilisateurs
    $userCount = 0;
    if ($tables['utilisateurs']) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM utilisateurs");
        $result = $stmt->fetch();
        $userCount = $result['count'];
    }
    
    // Obtenir la version de la base de données
    $stmt = $pdo->query("SELECT VERSION() as version");
    $version = $stmt->fetch()['version'];
    
    // Préparer la réponse
    $response = [
        'status' => 'success',
        'message' => 'Connexion à la base de données réussie',
        'database' => [
            'host' => $host,
            'name' => $dbname,
            'user' => $username,
            'version' => $version
        ],
        'tables' => [
            'utilisateurs_exists' => $tables['utilisateurs'],
            'utilisateurs_count' => $userCount,
            'users_exists' => $tables['users']
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    echo json_encode($response);
    
} catch (PDOException $e) {
    error_log("Erreur de connexion PDO: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Échec de la connexion à la base de données',
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    error_log("Erreur générale: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du test de connexion',
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
