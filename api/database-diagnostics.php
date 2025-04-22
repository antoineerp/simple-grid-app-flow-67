
<?php
// Fichier de diagnostic pour la connexion à la base de données
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

// Journaliser l'exécution
error_log("=== EXÉCUTION DE database-diagnostics.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

try {
    // Vérifier que le fichier database.php existe
    if (!file_exists('config/database.php')) {
        throw new Exception("Le fichier config/database.php n'existe pas");
    }
    
    // Vérifier que le fichier db_config.json existe
    if (!file_exists('config/db_config.json')) {
        throw new Exception("Le fichier config/db_config.json n'existe pas");
    }
    
    // Lire et valider le contenu du fichier db_config.json
    $db_config_content = file_get_contents('config/db_config.json');
    if (!$db_config_content) {
        throw new Exception("Impossible de lire le fichier config/db_config.json");
    }
    
    $db_config = json_decode($db_config_content, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Le fichier config/db_config.json contient un JSON invalide: " . json_last_error_msg());
    }
    
    // Vérifier les champs obligatoires
    $required_fields = ['host', 'db_name', 'username', 'password'];
    foreach ($required_fields as $field) {
        if (!isset($db_config[$field]) || empty($db_config[$field])) {
            throw new Exception("Le champ '$field' est manquant ou vide dans config/db_config.json");
        }
    }
    
    // Tester la connexion PDO directe
    try {
        $dsn = "mysql:host=" . $db_config['host'] . ";dbname=" . $db_config['db_name'] . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $pdo = new PDO($dsn, $db_config['username'], $db_config['password'], $options);
        $pdo_status = "success";
        $pdo_message = "Connexion PDO directe réussie";
        
        // Tester une requête simple
        $stmt = $pdo->query("SELECT 1");
        $stmt_result = $stmt->fetch(PDO::FETCH_ASSOC);
        
    } catch (PDOException $e) {
        $pdo_status = "error";
        $pdo_message = "Erreur de connexion PDO directe: " . $e->getMessage();
    }
    
    // Inclure la classe Database
    require_once 'config/database.php';
    
    // Instancier et tester la classe Database
    try {
        $database = new Database();
        $conn = $database->getConnection(false);
        
        if ($database->is_connected) {
            $db_class_status = "success";
            $db_class_message = "Connexion réussie via la classe Database";
            
            // Tester une requête simple
            $stmt = $conn->query("SELECT 1");
            $stmt_result = $stmt->fetch(PDO::FETCH_ASSOC);
            
        } else {
            $db_class_status = "error";
            $db_class_message = "Échec de la connexion via la classe Database: " . $database->connection_error;
        }
    } catch (Exception $e) {
        $db_class_status = "error";
        $db_class_message = "Exception lors de l'utilisation de la classe Database: " . $e->getMessage();
    }
    
    // Préparer la réponse
    $response = [
        'status' => ($pdo_status === 'success' && $db_class_status === 'success') ? 'success' : 'error',
        'message' => ($pdo_status === 'success') ? $pdo_message : $db_class_message,
        'connection_info' => [
            'host' => $db_config['host'],
            'database' => $db_config['db_name'],
            'user' => $db_config['username'],
            'php_version' => phpversion(),
            'pdo_drivers' => PDO::getAvailableDrivers()
        ],
        'pdo_test' => [
            'status' => $pdo_status,
            'message' => $pdo_message
        ],
        'database_class' => [
            'status' => $db_class_status,
            'message' => $db_class_message,
            'config' => [
                'host' => $database->host ?? 'inconnu',
                'db_name' => $database->db_name ?? 'inconnu',
                'username' => $database->username ?? 'inconnu'
            ]
        ]
    ];
    
    // Si les connexions sont réussies, ajouter des informations supplémentaires
    if ($pdo_status === 'success') {
        try {
            // Vérifier si la table utilisateurs existe
            $tables_check = [];
            $table_stmt = $pdo->query("SHOW TABLES LIKE 'utilisateurs'");
            $tables_check['utilisateurs'] = $table_stmt->rowCount() > 0 ? "existe" : "n'existe pas";
            
            // Compter les utilisateurs si la table existe
            $user_count = 0;
            if ($tables_check['utilisateurs'] === "existe") {
                $count_stmt = $pdo->query("SELECT COUNT(*) as total FROM utilisateurs");
                $user_count = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
            }
            
            $response['tables'] = $tables_check;
            $response['user_count'] = $user_count;
        } catch (PDOException $e) {
            $response['additional_info_error'] = "Erreur lors de la récupération d'informations supplémentaires: " . $e->getMessage();
        }
    }
    
    // Envoyer la réponse
    http_response_code(200);
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    error_log("Exception dans database-diagnostics.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du diagnostic de la base de données',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_PRETTY_PRINT);
}
?>
