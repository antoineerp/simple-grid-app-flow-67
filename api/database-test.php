
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Configuration stricte des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// En-têtes CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Définir DIRECT_ACCESS_CHECK comme true pour permettre l'accès direct
define('DIRECT_ACCESS_CHECK', true);

// Journaliser l'exécution
error_log("Exécution de database-test.php - Méthode: " . $_SERVER['REQUEST_METHOD']);

try {
    // Inclure le fichier de configuration de base de données
    if (file_exists(__DIR__ . '/config/database.php')) {
        require_once __DIR__ . '/config/database.php';
    } else {
        throw new Exception("Le fichier de configuration de la base de données est introuvable");
    }
    
    // Créer une instance de la classe Database
    $database = new Database();
    
    // Tester la connexion à la base de données
    $db = $database->getConnection(true); // true pour forcer un nouveau test de connexion
    
    if (!$database->is_connected) {
        throw new Exception("La connexion à la base de données a échoué: " . ($database->connection_error ?? "Erreur inconnue"));
    }
    
    // Récupérer la configuration
    $config = $database->getConfig();
    
    // Ne pas montrer le mot de passe dans la réponse
    $config['password'] = '********';
    
    // Tester une requête simple
    $test_query = "SELECT version() as db_version";
    $stmt = $db->prepare($test_query);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Préparer la réponse
    $response = [
        'status' => 'success',
        'message' => 'Connexion à la base de données réussie',
        'connection_info' => [
            'host' => $config['host'],
            'database' => $config['db_name'],
            'user' => $config['username'],
            'connected' => true,
            'db_version' => $result['db_version'] ?? 'Inconnu'
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Renvoyer une réponse positive
    http_response_code(200);
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    // Journaliser l'erreur
    error_log("Erreur dans database-test.php: " . $e->getMessage());
    
    // Nettoyer tout output buffer
    if (ob_get_level()) ob_clean();
    
    // Renvoyer une réponse d'erreur formatée en JSON
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => "Erreur de connexion à la base de données: " . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

// Libérer le output buffer
if (ob_get_level()) ob_end_flush();
?>
