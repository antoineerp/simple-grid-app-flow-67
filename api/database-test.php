
<?php
// Fichier de test pour la connexion à la base de données
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
error_log("=== EXÉCUTION DE database-test.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Inclure la configuration de la base de données
require_once 'config/database.php';

try {
    $database = new Database();
    
    // Obtenir la connexion à la base de données
    $db = $database->getConnection(false);
    
    // Préparer la réponse
    $response = [
        'status' => $database->is_connected ? 'success' : 'error',
        'message' => $database->is_connected ? 'Connexion à la base de données réussie' : 'Échec de la connexion à la base de données'
    ];
    
    // Si la connexion a échoué, ajouter l'erreur à la réponse
    if (!$database->is_connected) {
        $response['error'] = $database->connection_error;
        error_log("Échec de la connexion à la base de données: " . $database->connection_error);
    } else {
        // Ajouter des informations sur la base de données
        $info = [];
        
        try {
            // Obtenir des informations sur la base de données
            $stmt = $db->query("SELECT DATABASE() AS db_name");
            $dbName = $stmt->fetch(PDO::FETCH_ASSOC)['db_name'];
            $info['database_name'] = $dbName;
            
            // Obtenir la liste des tables
            $stmt = $db->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $info['tables'] = $tables;
            $info['table_count'] = count($tables);
            
            // Obtenir la taille de la base de données
            $stmt = $db->query("SELECT 
                SUM(data_length + index_length) AS size
                FROM information_schema.TABLES
                WHERE table_schema = DATABASE()");
            $size = $stmt->fetch(PDO::FETCH_ASSOC)['size'];
            $info['size'] = $size ? round($size / (1024 * 1024), 2) . ' MB' : 'inconnu';
            
            // Obtenir des informations sur l'encodage
            $stmt = $db->query("SELECT @@character_set_database AS encoding, @@collation_database AS collation");
            $encodingInfo = $stmt->fetch(PDO::FETCH_ASSOC);
            $info['encoding'] = $encodingInfo['encoding'];
            $info['collation'] = $encodingInfo['collation'];
            
            $response['info'] = $info;
            error_log("Informations de base de données récupérées avec succès");
        } catch (PDOException $e) {
            $response['info'] = [
                'database_name' => $database->db_name,
                'error' => 'Impossible d\'obtenir des informations détaillées: ' . $e->getMessage()
            ];
            error_log("Erreur lors de la récupération des informations de base de données: " . $e->getMessage());
        }
    }
    
    // Envoyer la réponse
    http_response_code($database->is_connected ? 200 : 500);
    echo json_encode($response);
} catch (Exception $e) {
    error_log("Exception dans database-test.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du test de connexion',
        'error' => $e->getMessage()
    ]);
}
?>
