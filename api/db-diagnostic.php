
<?php
// Fichier de diagnostic complet pour la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'exécution
error_log("=== EXÉCUTION DE db-diagnostic.php ===");

// Capturer toute sortie pour éviter la contamination du JSON
ob_start();

try {
    // Fonction pour nettoyer les données UTF-8
    function cleanUTF8($input) {
        if (is_string($input)) {
            return mb_convert_encoding($input, 'UTF-8', 'UTF-8');
        } elseif (is_array($input)) {
            foreach ($input as $key => $value) {
                $input[$key] = cleanUTF8($value);
            }
        }
        return $input;
    }

    // 1. Test de connexion directe à PDO
    function testDirectPDO() {
        error_log("Test PDO direct");
        try {
            $host = "p71x6d.myd.infomaniak.com";
            $dbname = "p71x6d_system";
            $username = "p71x6d_system";
            $password = "Trottinette43!";
            
            $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            // Tenter une connexion directe
            $pdo = new PDO($dsn, $username, $password, $options);
            error_log("Connexion PDO directe réussie");
            
            // Vérifier si la table 'utilisateurs' existe
            $tableExistsQuery = "SHOW TABLES LIKE 'utilisateurs'";
            $stmt = $pdo->prepare($tableExistsQuery);
            $stmt->execute();
            $tableExists = $stmt->rowCount() > 0;
            
            // Compter les utilisateurs si la table existe
            $userCount = 0;
            if ($tableExists) {
                $stmt = $pdo->query("SELECT COUNT(*) FROM utilisateurs");
                $userCount = $stmt->fetchColumn();
            }
            
            // Récupérer la liste des tables
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            return [
                'status' => 'success',
                'message' => 'Connexion PDO directe réussie',
                'connection_info' => [
                    'host' => $host,
                    'database' => $dbname,
                    'user' => $username,
                    'php_version' => phpversion(),
                    'pdo_drivers' => PDO::getAvailableDrivers()
                ],
                'tables' => [
                    'utilisateurs' => $tableExists ? 'existe' : 'n\'existe pas',
                    'liste' => $tables
                ],
                'user_count' => $userCount
            ];
        } catch (PDOException $e) {
            error_log("Échec de la connexion PDO directe: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Échec de la connexion PDO directe',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ];
        }
    }
    
    // 2. Test avec la classe Database
    function testDatabaseClass() {
        error_log("Test avec la classe Database");
        try {
            require_once 'config/database.php';
            
            // Créer une instance de Database avec une source identifiée
            $database = new Database('db-diagnostic.php');
            $isConnected = $database->testConnection();
            
            // Diagnostiquer la connexion
            $diagnostics = $database->diagnoseConnection();
            
            return [
                'status' => $isConnected ? 'success' : 'error',
                'message' => $isConnected ? 'Connexion réussie via la classe Database' : 'Échec de la connexion via la classe Database',
                'config' => [
                    'host' => $database->host,
                    'db_name' => $database->db_name,
                    'username' => $database->username,
                    'source' => $database->connection_source
                ],
                'diagnostics' => $diagnostics,
                'error' => $database->connection_error
            ];
        } catch (Exception $e) {
            error_log("Échec du test de la classe Database: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Échec du test de la classe Database',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ];
        }
    }
    
    // 3. Test de la configuration dans db_config.json
    function testConfigFile() {
        error_log("Test du fichier de configuration");
        try {
            $configFile = __DIR__ . '/config/db_config.json';
            
            if (!file_exists($configFile)) {
                return [
                    'status' => 'warning',
                    'message' => 'Fichier de configuration non trouvé',
                    'path' => $configFile
                ];
            }
            
            $jsonContent = file_get_contents($configFile);
            $config = json_decode($jsonContent, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                return [
                    'status' => 'error',
                    'message' => 'Erreur dans le fichier de configuration JSON',
                    'error' => json_last_error_msg(),
                    'raw_content' => substr($jsonContent, 0, 100) . '...'
                ];
            }
            
            return [
                'status' => 'success',
                'message' => 'Configuration JSON valide',
                'config' => [
                    'host' => $config['host'] ?? 'Non défini',
                    'db_name' => $config['db_name'] ?? 'Non défini',
                    'username' => $config['username'] ?? 'Non défini',
                    'password_set' => isset($config['password']) && !empty($config['password'])
                ]
            ];
        } catch (Exception $e) {
            error_log("Erreur lors du test de configuration: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Erreur lors du test de configuration',
                'error' => $e->getMessage()
            ];
        }
    }
    
    // Exécuter tous les tests
    $results = [
        'timestamp' => date('Y-m-d H:i:s'),
        'server_info' => [
            'php_version' => phpversion(),
            'server_name' => $_SERVER['SERVER_NAME'] ?? 'Inconnu',
            'script' => $_SERVER['SCRIPT_NAME'] ?? 'Inconnu',
            'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Inconnu'
        ],
        'pdo_direct' => testDirectPDO(),
        'database_class' => testDatabaseClass(),
        'config_file' => testConfigFile()
    ];
    
    // Ajouter la cohérence des configurations
    $results['config_consistency'] = [
        'status' => 'success',
        'is_consistent' => true,
        'message' => 'Toutes les configurations utilisent les mêmes paramètres'
    ];
    
    // Vérifier la cohérence entre connexion directe et classe Database
    if ($results['pdo_direct']['status'] === 'success' && $results['database_class']['status'] === 'success') {
        $pdoHost = $results['pdo_direct']['connection_info']['host'];
        $pdoDb = $results['pdo_direct']['connection_info']['database'];
        $pdoUser = $results['pdo_direct']['connection_info']['user'];
        
        $dbClassHost = $results['database_class']['config']['host'];
        $dbClassDb = $results['database_class']['config']['db_name'];
        $dbClassUser = $results['database_class']['config']['username'];
        
        if ($pdoHost !== $dbClassHost || $pdoDb !== $dbClassDb || $pdoUser !== $dbClassUser) {
            $results['config_consistency'] = [
                'status' => 'warning',
                'is_consistent' => false,
                'message' => 'Les configurations de connexion ne sont pas cohérentes',
                'differences' => [
                    'host' => "PDO: {$pdoHost}, Database: {$dbClassHost}",
                    'database' => "PDO: {$pdoDb}, Database: {$dbClassDb}",
                    'username' => "PDO: {$pdoUser}, Database: {$dbClassUser}"
                ]
            ];
        }
    }
    
    // Nettoyer le buffer de sortie
    ob_clean();
    
    // Envoyer la réponse
    http_response_code(200);
    echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    error_log("Erreur lors du diagnostic de base de données: " . $e->getMessage());
    
    // Nettoyer le buffer de sortie
    ob_clean();
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du diagnostic de base de données',
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>
