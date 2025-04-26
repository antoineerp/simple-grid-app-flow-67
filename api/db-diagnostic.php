
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

error_log("=== EXÉCUTION DE db-diagnostic.php ===");

// Vérifier si le fichier de configuration de base de données existe
if (!file_exists(__DIR__ . '/config/database.php')) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Fichier de configuration de base de données introuvable',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/DatabaseDiagnostics/ConfigTester.php';
require_once __DIR__ . '/utils/DatabaseDiagnostics/PdoTester.php';
require_once __DIR__ . '/utils/DatabaseDiagnostics/ConsistencyChecker.php';

try {
    // Informations serveur
    $server_info = [
        'php_version' => phpversion(),
        'server_name' => $_SERVER['SERVER_NAME'] ?? 'Non défini',
        'script' => $_SERVER['SCRIPT_NAME'] ?? 'Non défini',
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Non défini'
    ];

    // Test de configuration
    $configTester = new ConfigTester();
    $config_file = $configTester->testConfiguration();
    
    // Test PDO si la configuration est valide
    $pdo_direct = [];
    if ($config_file['status'] === 'success') {
        $pdoTester = new PdoTester($config_file['config']);
        $pdo_direct = $pdoTester->testPdoConnection();
    }

    // Test avec la classe Database
    $database_class = [];
    try {
        $database = new Database();
        $conn = $database->getConnection();
        
        if ($database->is_connected) {
            $database_class = [
                'status' => 'success',
                'message' => 'Connexion avec la classe Database réussie',
                'config' => [
                    'host' => $database->host,
                    'db_name' => $database->db_name,
                    'username' => $database->username,
                    'source' => $database->connection_source
                ]
            ];
        } else {
            $database_class = [
                'status' => 'error',
                'message' => 'Échec de connexion avec la classe Database',
                'error' => $database->connection_error
            ];
        }
    } catch (Exception $e) {
        $database_class = [
            'status' => 'error',
            'message' => 'Erreur lors de l\'utilisation de la classe Database',
            'error' => $e->getMessage()
        ];
    }

    // Vérifier la cohérence des configurations
    $consistencyChecker = new ConsistencyChecker();
    $config_consistency = $consistencyChecker->checkConfigConsistency($pdo_direct, $database_class, $config_file);

    // Préparer la réponse complète
    $response = [
        'status' => ($pdo_direct['status'] === 'success' && $database_class['status'] === 'success') ? 'success' : 'error',
        'message' => ($pdo_direct['status'] === 'success' && $database_class['status'] === 'success') 
            ? 'Diagnostic de base de données réussi' 
            : 'Diagnostic de base de données avec erreurs',
        'timestamp' => date('Y-m-d H:i:s'),
        'server_info' => $server_info,
        'pdo_direct' => $pdo_direct,
        'database_class' => $database_class,
        'config_file' => $config_file,
        'config_consistency' => $config_consistency
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du diagnostic de base de données',
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}
?>
