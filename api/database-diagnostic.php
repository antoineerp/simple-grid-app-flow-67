
<?php
// Point d'accès pour le diagnostic de base de données
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
error_log("=== EXÉCUTION DE database-diagnostic.php ===");

// Vérifier si le fichier db-diagnostic.php existe
if (file_exists(__DIR__ . '/db-diagnostic.php')) {
    require_once __DIR__ . '/db-diagnostic.php';
    exit;
}

// Si le fichier n'existe pas, nous fournissons un diagnostic basique
require_once __DIR__ . '/config/database.php';

// Fonction pour effectuer un diagnostic de base de données
function performDatabaseDiagnostic() {
    // Résultat du diagnostic
    $result = [
        'timestamp' => date('Y-m-d H:i:s'),
        'server_info' => [
            'php_version' => phpversion(),
            'server_name' => $_SERVER['SERVER_NAME'] ?? 'Non défini',
            'script' => $_SERVER['SCRIPT_NAME'] ?? 'Non défini',
            'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Non défini'
        ]
    ];

    // Test avec PDO directement
    try {
        $dsn = "mysql:host=p71x6d.myd.infomaniak.com;dbname=p71x6d_system;charset=utf8mb4";
        $pdo = new PDO($dsn, "p71x6d_system", "Trottinette43!");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $result['pdo_direct'] = [
            'status' => 'success',
            'message' => 'Connexion PDO directe réussie',
            'connection_info' => [
                'host' => 'p71x6d.myd.infomaniak.com',
                'database' => 'p71x6d_system',
                'user' => 'p71x6d_system'
            ]
        ];
    } catch (PDOException $e) {
        $result['pdo_direct'] = [
            'status' => 'error',
            'message' => 'Échec de la connexion PDO directe',
            'error' => $e->getMessage()
        ];
    }

    // Test avec la classe Database
    try {
        $db = new Database('diagnostic');
        $connection = $db->getConnection();
        
        $result['database_class'] = [
            'status' => $db->is_connected ? 'success' : 'error',
            'message' => $db->is_connected ? 'Connexion via la classe Database réussie' : 'Échec de la connexion via la classe Database',
            'config' => [
                'host' => $db->host,
                'db_name' => $db->db_name,
                'username' => $db->username,
                'source' => $db->connection_source
            ]
        ];
        
        if (!$db->is_connected && $db->connection_error) {
            $result['database_class']['error'] = $db->connection_error;
        }
    } catch (Exception $e) {
        $result['database_class'] = [
            'status' => 'error',
            'message' => 'Exception lors de l\'utilisation de la classe Database',
            'error' => $e->getMessage()
        ];
    }

    // Vérification du fichier de configuration
    $configFile = __DIR__ . '/config/db_config.json';
    $result['config_file'] = [
        'status' => file_exists($configFile) ? 'success' : 'error',
        'message' => file_exists($configFile) ? 'Fichier de configuration trouvé' : 'Fichier de configuration introuvable'
    ];
    
    if (file_exists($configFile)) {
        try {
            $jsonContent = file_get_contents($configFile);
            $config = json_decode($jsonContent, true);
            
            if (json_last_error() === JSON_ERROR_NONE) {
                $result['config_file']['config'] = [
                    'host' => $config['host'] ?? 'Non défini',
                    'db_name' => $config['db_name'] ?? 'Non défini',
                    'username' => $config['username'] ?? 'Non défini'
                ];
            } else {
                $result['config_file']['error'] = 'Erreur JSON: ' . json_last_error_msg();
            }
        } catch (Exception $e) {
            $result['config_file']['error'] = $e->getMessage();
        }
    }

    // Vérification de cohérence des configurations
    $result['config_consistency'] = [
        'status' => 'info',
        'is_consistent' => true,
        'message' => 'Les configurations sont cohérentes'
    ];
    
    if (isset($result['pdo_direct']['connection_info']) && isset($result['database_class']['config']) && isset($result['config_file']['config'])) {
        $pdo_host = $result['pdo_direct']['connection_info']['host'];
        $pdo_db = $result['pdo_direct']['connection_info']['database'];
        $pdo_user = $result['pdo_direct']['connection_info']['user'];
        
        $db_host = $result['database_class']['config']['host'];
        $db_name = $result['database_class']['config']['db_name'];
        $db_user = $result['database_class']['config']['username'];
        
        $config_host = $result['config_file']['config']['host'];
        $config_db = $result['config_file']['config']['db_name'];
        $config_user = $result['config_file']['config']['username'];
        
        $host_consistent = ($pdo_host === $db_host && $db_host === $config_host);
        $db_consistent = ($pdo_db === $db_name && $db_name === $config_db);
        $user_consistent = ($pdo_user === $db_user && $db_user === $config_user);
        
        $result['config_consistency']['is_consistent'] = $host_consistent && $db_consistent && $user_consistent;
        
        if (!$result['config_consistency']['is_consistent']) {
            $result['config_consistency']['status'] = 'warning';
            $result['config_consistency']['message'] = 'Incohérences détectées entre les configurations';
            $result['config_consistency']['differences'] = [
                'host' => !$host_consistent ? 'Incohérence' : 'Cohérent',
                'database' => !$db_consistent ? 'Incohérence' : 'Cohérent',
                'username' => !$user_consistent ? 'Incohérence' : 'Cohérent'
            ];
        }
    }
    
    return $result;
}

// Exécution et réponse
$diagnostic = performDatabaseDiagnostic();
echo json_encode($diagnostic, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
