
<?php
// Script de test pour diagnostiquer les problèmes de connexion à la base de données
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

// Journaliser l'exécution
error_log("=== EXÉCUTION DE db-connection-test.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Configurer l'affichage des erreurs
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Paramètres de connexion directe (sans passer par la classe Database)
$host = "p71x6d.myd.infomaniak.com";
$db_name = "p71x6d_system";
$username = "p71x6d_system";
$password = "Trottinette43!";

// Tentative de connexion directe avec PDO
try {
    $dsn = "mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    error_log("Tentative de connexion directe PDO: $host, $db_name, $username");
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Vérifier si la connexion est établie
    $stmt = $pdo->query('SELECT 1');
    
    // Vérifier la version MySQL
    $version = $pdo->query('SELECT VERSION() as version')->fetch();
    
    // Si nous sommes ici, c'est que la connexion fonctionne
    $response = [
        "status" => "success",
        "message" => "Connexion PDO directe réussie",
        "connection_info" => [
            "host" => $host,
            "database" => $db_name,
            "database_name" => $db_name,
            "user" => $username,
            "php_version" => PHP_VERSION,
            "mysql_version" => $version['version'] ?? 'Inconnue',
            "pdo_drivers" => PDO::getAvailableDrivers()
        ]
    ];
    
    // Tester la table utilisateurs
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'utilisateurs'");
        $tableExists = $stmt->rowCount() > 0;
        $response["tables"] = ["utilisateurs" => $tableExists ? "existe" : "n'existe pas"];
        
        if ($tableExists) {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM utilisateurs");
            $userCount = $stmt->fetch()['count'];
            $response["user_count"] = $userCount;
            
            // Récupérer la liste des tables
            $tables = [];
            $stmt = $pdo->query('SHOW TABLES');
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                $tables[] = $row[0];
            }
            $response["table_list"] = $tables;
        }
    } catch (PDOException $e) {
        $response["table_check_error"] = $e->getMessage();
    }
    
    http_response_code(200);
    echo json_encode($response);
} catch (PDOException $e) {
    // Échec de la connexion directe
    error_log("Échec de la connexion directe PDO: " . $e->getMessage());
    $response = [
        "status" => "error",
        "message" => "Échec de la connexion PDO directe",
        "error" => $e->getMessage(),
        "connection_params" => [
            "host" => $host,
            "database" => $db_name,
            "user" => $username,
            "php_version" => PHP_VERSION,
            "pdo_drivers" => PDO::getAvailableDrivers()
        ]
    ];
    http_response_code(500);
    echo json_encode($response);
    exit;
}

// Si nous sommes arrivés jusqu'ici, testons maintenant avec la classe Database
try {
    // Inclure la configuration de la base de données
    $database_path = __DIR__ . '/config/database.php';
    if (file_exists($database_path)) {
        require_once $database_path;
        
        $database = new Database();
        $db = $database->getConnection(false);
        
        $response["database_class"] = [
            "status" => $database->is_connected ? "success" : "error",
            "message" => $database->is_connected ? "Connexion via la classe Database réussie" : "Échec de connexion via la classe Database",
            "error" => $database->connection_error
        ];
    } else {
        $response["database_class"] = [
            "status" => "error",
            "message" => "Fichier de classe Database introuvable",
            "path_checked" => $database_path
        ];
    }
    
    http_response_code(200);
    echo json_encode($response);
} catch (Exception $e) {
    $response["database_class"] = [
        "status" => "error",
        "message" => "Exception lors du test de la classe Database",
        "error" => $e->getMessage()
    ];
    
    http_response_code(200); // On garde 200 car la première partie du test a réussi
    echo json_encode($response);
}
?>
