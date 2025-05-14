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

// Cette fonction vérifie si la demande est authentifiée (basique, pour tests)
function is_authenticated_request() {
    // En production, on devrait vérifier un token JWT
    // Pour le diagnostic, on accepte toutes les requêtes
    return true;
}

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
        $dsn = "mysql:host=p71x6d.myd.infomaniak.com;dbname=p71x6d_system;charset=utf8";
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

        // Collecter des informations sur la base de données
        try {
            // Obtenir la liste des tables
            $tablesQuery = $pdo->query('SHOW TABLES');
            $tables = $tablesQuery->fetchAll(PDO::FETCH_COLUMN);
            
            // Obtenir les statistiques de la base de données
            $sizeQuery = $pdo->query("
                SELECT 
                    SUM(data_length + index_length) as total_size
                FROM 
                    information_schema.TABLES 
                WHERE 
                    table_schema = 'p71x6d_system'
            ");
            $sizeData = $sizeQuery->fetch(PDO::FETCH_ASSOC);
            $totalSizeMB = round(($sizeData['total_size'] ?? 0) / (1024 * 1024), 2);
            
            $result['database_info'] = [
                'tables_count' => count($tables),
                'tables_list' => $tables,
                'size_mb' => $totalSizeMB . ' MB',
                'encoding' => 'utf8',
                'collation' => 'utf8_unicode_ci',
                'last_backup' => 'Inconnu'
            ];
        } catch (PDOException $e) {
            $result['database_info'] = [
                'error' => 'Erreur lors de la collecte des informations: ' . $e->getMessage()
            ];
        }
    } catch (PDOException $e) {
        $result['pdo_direct'] = [
            'status' => 'error',
            'message' => 'Échec de la connexion PDO directe',
            'error' => $e->getMessage()
        ];
    }

    // Vérification des fichiers de configuration
    $result['config_files'] = [
        'database_php' => file_exists(__DIR__ . '/config/database.php'),
        'db_config_json' => file_exists(__DIR__ . '/config/db_config.json'),
        'env_php' => file_exists(__DIR__ . '/config/env.php')
    ];

    return $result;
}

// Vérifier l'authentification et répondre
if (is_authenticated_request()) {
    try {
        $diagnostic = performDatabaseDiagnostic();
        echo json_encode($diagnostic, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Erreur lors du diagnostic de la base de données',
            'error' => $e->getMessage()
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
} else {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'Accès non autorisé'
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>
