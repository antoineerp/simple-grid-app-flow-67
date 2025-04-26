
<?php
// Diagnostic de base de données - renvoie des informations détaillées sur la configuration et la connexion

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
error_log("=== EXÉCUTION DE db-diagnostic.php ===");

// Vérifier si le fichier de configuration de base de données existe
if (file_exists(__DIR__ . '/config/database.php')) {
    require_once __DIR__ . '/config/database.php';
} else {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Fichier de configuration de base de données introuvable',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
}

try {
    // Informations serveur
    $server_info = [
        'php_version' => phpversion(),
        'server_name' => $_SERVER['SERVER_NAME'] ?? 'Non défini',
        'script' => $_SERVER['SCRIPT_NAME'] ?? 'Non défini',
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Non défini'
    ];

    // Test de connexion PDO directe
    $pdo_direct = [];
    try {
        // Essayer de récupérer la configuration d'abord
        $db_config_path = __DIR__ . '/config/db_config.json';
        if (file_exists($db_config_path)) {
            $config_content = file_get_contents($db_config_path);
            error_log("Contenu du fichier config: " . substr($config_content, 0, 50) . "...");
            
            $db_config = json_decode($config_content, true);
            
            if ($db_config && isset($db_config['host']) && isset($db_config['db_name']) && isset($db_config['username']) && isset($db_config['password'])) {
                $host = $db_config['host'];
                $db_name = $db_config['db_name'];
                $username = $db_config['username'];
                $password = $db_config['password'];
                
                // Tester la connexion PDO directe
                $dsn = "mysql:host=$host;dbname=$db_name;charset=utf8mb4";
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];
                
                $pdo = new PDO($dsn, $username, $password, $options);
                
                // Récupérer des informations sur la connexion
                $stmt = $pdo->query("SELECT DATABASE() AS current_db, version() AS mysql_version, @@character_set_database AS encoding, @@collation_database AS collation");
                $db_info = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Compter le nombre de tables
                $stmt = $pdo->query("SHOW TABLES");
                $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                $tableCount = count($tables);
                
                // Calculer la taille de la base de données
                $stmt = $pdo->query("SELECT SUM(data_length + index_length) AS size FROM information_schema.TABLES WHERE table_schema = DATABASE()");
                $size_result = $stmt->fetch(PDO::FETCH_ASSOC);
                $size = $size_result['size'] ? round($size_result['size'] / (1024 * 1024), 2) . ' MB' : '0 MB';
                
                $pdo_direct = [
                    'status' => 'success',
                    'message' => 'Connexion PDO directe réussie',
                    'connection_info' => [
                        'host' => $host,
                        'database' => $db_name,
                        'user' => $username,
                        'current_db' => $db_info['current_db'],
                        'mysql_version' => $db_info['mysql_version'],
                        'encoding' => $db_info['encoding'],
                        'collation' => $db_info['collation'],
                        'tables' => $tableCount,
                        'size' => $size,
                        'table_list' => $tables
                    ]
                ];
            } else {
                $pdo_direct = [
                    'status' => 'error',
                    'message' => 'Configuration invalide dans db_config.json'
                ];
            }
        } else {
            $pdo_direct = [
                'status' => 'error',
                'message' => 'Fichier db_config.json introuvable'
            ];
        }
    } catch (PDOException $e) {
        $pdo_direct = [
            'status' => 'error',
            'message' => 'Échec de la connexion PDO directe',
            'error' => $e->getMessage()
        ];
    }

    // Test avec la classe Database
    $database_class = [];
    try {
        // Instancier Database et tester la connexion
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

    // Vérifier la configuration
    $config_file = [];
    try {
        $db_config_path = __DIR__ . '/config/db_config.json';
        if (file_exists($db_config_path)) {
            $config_content = file_get_contents($db_config_path);
            $db_config = json_decode($config_content, true);
            
            if ($db_config && isset($db_config['host']) && isset($db_config['db_name']) && isset($db_config['username'])) {
                $config_file = [
                    'status' => 'success',
                    'message' => 'Fichier de configuration trouvé et valide',
                    'config' => [
                        'host' => $db_config['host'],
                        'db_name' => $db_config['db_name'],
                        'username' => $db_config['username']
                    ]
                ];
            } else {
                $config_file = [
                    'status' => 'error',
                    'message' => 'Configuration invalide dans db_config.json'
                ];
            }
        } else {
            $config_file = [
                'status' => 'error',
                'message' => 'Fichier db_config.json introuvable'
            ];
        }
    } catch (Exception $e) {
        $config_file = [
            'status' => 'error',
            'message' => 'Erreur lors de la lecture du fichier de configuration',
            'error' => $e->getMessage()
        ];
    }

    // Vérifier la cohérence des configurations
    $config_consistency = [
        'status' => 'success',
        'is_consistent' => true,
        'message' => 'Les configurations sont cohérentes'
    ];

    if ($pdo_direct['status'] === 'success' && $database_class['status'] === 'success' && $config_file['status'] === 'success') {
        $pdo_config = $pdo_direct['connection_info'];
        $db_class_config = $database_class['config'];
        $file_config = $config_file['config'];
        
        // Comparer les configurations
        $differences = [];
        if ($pdo_config['host'] !== $db_class_config['host']) {
            $differences['host'] = "PDO: {$pdo_config['host']} vs DB Class: {$db_class_config['host']}";
        }
        if ($pdo_config['database'] !== $db_class_config['db_name']) {
            $differences['database'] = "PDO: {$pdo_config['database']} vs DB Class: {$db_class_config['db_name']}";
        }
        if ($pdo_config['user'] !== $db_class_config['username']) {
            $differences['username'] = "PDO: {$pdo_config['user']} vs DB Class: {$db_class_config['username']}";
        }
        
        if (!empty($differences)) {
            $config_consistency = [
                'status' => 'warning',
                'is_consistent' => false,
                'message' => 'Incohérences détectées entre les configurations',
                'differences' => $differences
            ];
        }
    } else {
        $config_consistency = [
            'status' => 'error',
            'is_consistent' => false,
            'message' => 'Impossible de vérifier la cohérence (une ou plusieurs connexions ont échoué)'
        ];
    }

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

    // Envoyer la réponse
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    // En cas d'erreur générale
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du diagnostic de base de données',
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}
?>
