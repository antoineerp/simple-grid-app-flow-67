
<?php
// Fichier de configuration de la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'accès
error_log("=== EXÉCUTION DE database-config.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Inclure la configuration de la base de données
require_once 'config/database.php';

try {
    $database = new Database();
    
    // Si c'est une requête POST, mettre à jour la configuration
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Récupérer les données POST JSON
        $json_input = file_get_contents("php://input");
        $data = json_decode($json_input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Données JSON invalides: " . json_last_error_msg());
        }
        
        // Journaliser les données reçues (sans le mot de passe)
        $log_data = $data;
        if (isset($log_data['password'])) {
            $log_data['password'] = '********';
        }
        error_log("Données reçues: " . json_encode($log_data));
        
        // Vérifier si les champs requis sont présents
        if (empty($data['host']) || empty($data['db_name']) || empty($data['username'])) {
            throw new Exception("Champs obligatoires manquants (host, db_name, username)");
        }
        
        // Mettre à jour la configuration (le mot de passe peut être vide)
        $host = filter_var($data['host'], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        $db_name = filter_var($data['db_name'], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        $username = filter_var($data['username'], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        $password = isset($data['password']) ? $data['password'] : '';
        
        // Mettre à jour la configuration
        $database->updateConfig($host, $db_name, $username, $password);
        
        // Tester la nouvelle connexion
        $is_connected = $database->testConnection();
        
        // Envoyer la réponse
        http_response_code(200);
        echo json_encode([
            'status' => $is_connected ? 'success' : 'error',
            'message' => $is_connected ? 'Configuration mise à jour avec succès' : 'La configuration a été mise à jour mais la connexion a échoué',
            'database_changed' => true,
            'new_database' => $db_name,
            'is_connected' => $is_connected,
            'error' => $is_connected ? null : $database->connection_error
        ]);
    } 
    // Si c'est une requête GET, retourner la configuration actuelle
    else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $config = $database->getConfig();
        
        // Lister les bases de données disponibles pour Infomaniak
        $available_databases = [
            'p71x6d_system',
            'p71x6d_test',
            'p71x6d_prod',
            'p71x6d_dev'
        ];
        
        // Envoyer la réponse
        http_response_code(200);
        echo json_encode([
            'host' => $config['host'],
            'db_name' => $config['db_name'],
            'username' => $config['username'],
            'available_databases' => $available_databases,
            'is_connected' => $config['is_connected'],
            'error' => $config['error']
        ]);
    }
} catch (Exception $e) {
    error_log("Erreur dans database-config.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
