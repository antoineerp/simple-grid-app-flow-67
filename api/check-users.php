
<?php
// Script pour vérifier les utilisateurs et la connexion à la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'exécution
error_log("=== EXÉCUTION DE check-users.php ===");

try {
    // Charger la configuration depuis le fichier JSON
    $config_file = __DIR__ . '/config/db_config.json';
    
    if (file_exists($config_file)) {
        $config = json_decode(file_get_contents($config_file), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Erreur de décodage JSON: " . json_last_error_msg());
        }
        
        // Connexion à la base de données
        $dsn = "mysql:host=" . $config['host'] . ";dbname=" . $config['db_name'] . ";charset=utf8";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $pdo = new PDO($dsn, $config['username'], $config['password'], $options);
        
        // Récupérer la version MySQL et les informations de base
        $query = $pdo->query("SELECT VERSION() as version, DATABASE() as db_name, 
                             @@character_set_database as charset, @@collation_database as collation");
        $db_info = $query->fetch();
        
        // Vérifier si la table utilisateurs existe
        $stmt = $pdo->query("SHOW TABLES LIKE 'utilisateurs'");
        $table_exists = $stmt->rowCount() > 0;
        
        $records = [];
        
        if ($table_exists) {
            // Sélectionner tous les utilisateurs (limité pour la sécurité)
            $users = $pdo->query("SELECT id, nom, prenom, email, identifiant_technique, role, 
                                 date_creation FROM utilisateurs LIMIT 10")->fetchAll();
            $records = $users;
        }
        
        // Récupérer les statistiques sur les utilisateurs
        $stats = [
            'total_users' => 0,
            'roles' => []
        ];
        
        if ($table_exists) {
            $stats['total_users'] = $pdo->query("SELECT COUNT(*) FROM utilisateurs")->fetchColumn();
            
            // Compter par rôle
            $roles = $pdo->query("SELECT role, COUNT(*) as count FROM utilisateurs GROUP BY role")->fetchAll();
            foreach ($roles as $role) {
                $stats['roles'][$role['role']] = $role['count'];
            }
        }
        
        // Renvoyer les résultats
        echo json_encode([
            'status' => 'success',
            'message' => 'Connexion réussie et données récupérées',
            'timestamp' => date('Y-m-d H:i:s'),
            'database_info' => [
                'host' => $config['host'],
                'database' => $config['db_name'],
                'version' => $db_info['version'],
                'charset' => $db_info['charset'],
                'collation' => $db_info['collation']
            ],
            'table_utilisateurs_exists' => $table_exists,
            'statistics' => $stats,
            'records' => $records
        ]);
    } else {
        throw new Exception("Fichier de configuration non trouvé: " . $config_file);
    }
} catch (Exception $e) {
    error_log("Erreur dans check-users.php: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'error_type' => get_class($e)
    ]);
}
?>
