
<?php
// Script direct de test de connexion à la base de données MySQL Infomaniak
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journaliser l'exécution
error_log("=== EXÉCUTION DE direct-db-test.php ===");

// Paramètres de connexion à la base de données Infomaniak
$host = "p71x6d.myd.infomaniak.com";
$db_name = "p71x6d_system";
$username = "p71x6d_system";
$password = "Trottinette43!";

try {
    // Tentative de connexion directe sans utiliser la classe Database
    $dsn = "mysql:host=$host;dbname=$db_name;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    // Afficher les informations de connexion
    echo "Tentative de connexion à $host, base $db_name avec l'utilisateur $username<br>";
    
    // Créer la connexion
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Vérifier la version MySQL
    $version = $pdo->query('SELECT VERSION() as version')->fetch();
    
    // Lister les tables
    $tables = [];
    $stmt = $pdo->query('SHOW TABLES');
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }
    
    // Préparation de la réponse JSON
    $response = [
        'status' => 'success',
        'message' => 'Connexion directe à la base de données réussie',
        'version' => $version['version'],
        'tables' => $tables,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Tester la table utilisateurs spécifiquement
    if (in_array('utilisateurs', $tables)) {
        $userCount = $pdo->query('SELECT COUNT(*) as count FROM utilisateurs')->fetch();
        $response['utilisateurs_count'] = $userCount['count'];
        
        // Récupérer les 5 premiers utilisateurs
        $users = [];
        $stmt = $pdo->query('SELECT id, identifiant_technique, email, role FROM utilisateurs LIMIT 5');
        while ($row = $stmt->fetch()) {
            $users[] = $row;
        }
        $response['utilisateurs_sample'] = $users;
    } else {
        $response['utilisateurs'] = 'Table non trouvée';
    }
    
    // Afficher la réponse JSON
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    // En cas d'erreur de connexion
    $errorResponse = [
        'status' => 'error',
        'message' => 'Erreur de connexion à la base de données',
        'error' => $e->getMessage(),
        'code' => $e->getCode(),
        'trace' => $e->getTraceAsString(),
        'connection_info' => [
            'host' => $host,
            'database' => $db_name,
            'username' => $username,
            'php_version' => PHP_VERSION,
            'pdo_drivers' => implode(', ', PDO::getAvailableDrivers())
        ]
    ];
    
    // Journaliser l'erreur
    error_log("Erreur de connexion PDO: " . $e->getMessage());
    
    // Afficher l'erreur en JSON
    http_response_code(500);
    echo json_encode($errorResponse, JSON_PRETTY_PRINT);
}
?>
