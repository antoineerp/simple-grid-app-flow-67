
<?php
// Inclusion du fichier de configuration
require_once __DIR__ . '/config/index.php';

// Configuration des headers
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

// Activer la journalisation d'erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0); // Désactiver l'affichage HTML des erreurs
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/db_diagnostic_errors.log');

// Fonction pour nettoyer la sortie
function clean_output() {
    if (ob_get_level()) ob_clean();
}

// Initialiser le tableau de résultats
$result = [
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => [
        'php_version' => phpversion(),
        'server_name' => $_SERVER['SERVER_NAME'] ?? 'unknown',
        'script' => $_SERVER['SCRIPT_NAME'] ?? 'unknown',
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ]
];

try {
    // Configuration directe pour le PDO Test
    $pdo_config = [
        'host' => 'p71x6d.myd.infomaniak.com',
        'db_name' => 'p71x6d_system',
        'username' => 'p71x6d_system',
        'password' => 'Trottinette43!'
    ];
    
    // 1. Test direct PDO
    try {
        require_once __DIR__ . '/utils/DatabaseDiagnostics/PdoTester.php';
        $pdoTester = new PdoTester($pdo_config);
        $result['pdo_direct'] = $pdoTester->testPdoConnection();
    } catch (Exception $e) {
        $result['pdo_direct'] = [
            'status' => 'error',
            'message' => 'Erreur lors du test PDO',
            'error' => $e->getMessage()
        ];
    }
    
    // 2. Test avec la classe Database
    try {
        require_once __DIR__ . '/config/database.php';
        $database = new Database('db-diagnostic');
        $db_connected = $database->testConnection();
        
        $result['database_class'] = [
            'status' => $db_connected ? 'success' : 'error',
            'message' => $db_connected ? 'Connexion réussie via la classe Database' : 'Échec de la connexion via Database',
            'config' => $database->getConfig(),
            'error' => $database->connection_error
        ];
    } catch (Exception $e) {
        $result['database_class'] = [
            'status' => 'error',
            'message' => 'Erreur lors du chargement de la classe Database',
            'error' => $e->getMessage()
        ];
    }
    
    // 3. Test du fichier de configuration
    try {
        $config_file = __DIR__ . '/config/db_config.json';
        if (file_exists($config_file)) {
            $config_content = file_get_contents($config_file);
            $config = json_decode($config_content, true);
            
            if ($config && is_array($config)) {
                $result['config_file'] = [
                    'status' => 'success',
                    'message' => 'Fichier de configuration trouvé et valide',
                    'config' => [
                        'host' => $config['host'] ?? 'non défini',
                        'db_name' => $config['db_name'] ?? 'non défini',
                        'username' => $config['username'] ?? 'non défini'
                        // Mot de passe masqué pour des raisons de sécurité
                    ]
                ];
            } else {
                $result['config_file'] = [
                    'status' => 'error',
                    'message' => 'Fichier de configuration trouvé mais invalide',
                    'error' => json_last_error_msg()
                ];
            }
        } else {
            $result['config_file'] = [
                'status' => 'error',
                'message' => 'Fichier de configuration non trouvé',
                'error' => 'Le fichier ' . $config_file . ' n\'existe pas'
            ];
        }
    } catch (Exception $e) {
        $result['config_file'] = [
            'status' => 'error',
            'message' => 'Erreur lors de la lecture du fichier de configuration',
            'error' => $e->getMessage()
        ];
    }
    
    // 4. Vérifier la cohérence entre la config directe et la config chargée
    try {
        require_once __DIR__ . '/utils/DatabaseDiagnostics/ConsistencyChecker.php';
        if (isset($result['pdo_direct']) && isset($result['database_class'])) {
            $checker = new ConsistencyChecker();
            $result['config_consistency'] = $checker->checkConsistency(
                $pdo_config,
                [
                    'host' => $database->host ?? '',
                    'db_name' => $database->db_name ?? '',
                    'username' => $database->username ?? ''
                ]
            );
        } else {
            $result['config_consistency'] = [
                'status' => 'error',
                'is_consistent' => false,
                'message' => 'Impossible de vérifier la cohérence car certaines configurations n\'ont pas été chargées'
            ];
        }
    } catch (Exception $e) {
        $result['config_consistency'] = [
            'status' => 'error',
            'is_consistent' => false,
            'message' => 'Erreur lors de la vérification de la cohérence',
            'error' => $e->getMessage()
        ];
    }
    
    // Nettoyer toute sortie précédente
    clean_output();
    
    // Renvoyer les résultats du diagnostic
    http_response_code(200);
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    // Nettoyer toute sortie précédente
    clean_output();
    
    // Log et renvoie l'erreur
    error_log("Erreur dans le diagnostic DB: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => "Erreur lors du diagnostic de la base de données: " . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>
