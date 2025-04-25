
<?php
// Fichier de test pour la connexion à la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Désactiver la mise en cache
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

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
if (file_exists('config/database.php')) {
    require_once 'config/database.php';
} else {
    error_log("ERREUR: Fichier database.php non trouvé");
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Fichier de configuration de base de données non trouvé'
    ]);
    exit;
}

try {
    // Créer une instance de Database
    $database = new Database();
    error_log("Instance de Database créée avec succès");
    
    // Obtenir la connexion à la base de données
    $db = $database->getConnection(false);
    error_log("Connexion à la base de données " . ($database->is_connected ? "réussie" : "échouée"));
    
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
            error_log("Tentative de récupération des informations de la base de données");
            
            // Obtenir des informations sur la base de données
            $stmt = $db->query("SELECT DATABASE() AS db_name");
            $dbName = $stmt->fetch(PDO::FETCH_ASSOC)['db_name'];
            $info['database_name'] = $dbName;
            error_log("Nom de la base de données: " . $dbName);
            
            // Obtenir des informations sur l'hôte
            $info['host'] = $database->host;
            
            // Obtenir la liste des tables
            $stmt = $db->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $info['tables'] = $tables;
            $info['table_count'] = count($tables);
            error_log("Nombre de tables: " . count($tables));
            
            // Obtenir la taille de la base de données
            $stmt = $db->query("SELECT 
                SUM(data_length + index_length) AS size
                FROM information_schema.TABLES
                WHERE table_schema = DATABASE()");
            $size = $stmt->fetch(PDO::FETCH_ASSOC)['size'];
            $info['size'] = $size ? round($size / (1024 * 1024), 2) . ' MB' : 'inconnu';
            error_log("Taille de la base de données: " . $info['size']);
            
            // Obtenir des informations sur l'encodage
            $stmt = $db->query("SELECT @@character_set_database AS encoding, @@collation_database AS collation");
            $encodingInfo = $stmt->fetch(PDO::FETCH_ASSOC);
            $info['encoding'] = $encodingInfo['encoding'];
            $info['collation'] = $encodingInfo['collation'];
            error_log("Encodage: " . $info['encoding'] . ", Collation: " . $info['collation']);
            
            // Ajouter une information sur la dernière sauvegarde (simulée)
            $info['last_backup'] = date('Y-m-d H:i:s', strtotime('-1 day'));
            
            $response['info'] = $info;
            error_log("Informations de base de données récupérées avec succès");
        } catch (PDOException $e) {
            error_log("Erreur PDO lors de la récupération des informations de base de données: " . $e->getMessage());
            $response['info'] = [
                'database_name' => $database->db_name,
                'host' => $database->host,
                'error' => 'Impossible d\'obtenir des informations détaillées: ' . $e->getMessage()
            ];
        }
    }
    
    // Journaliser et envoyer la réponse
    error_log("Envoi de la réponse avec le statut: " . ($database->is_connected ? "200 (OK)" : "500 (Error)"));
    http_response_code($database->is_connected ? 200 : 500);
    
    // S'assurer que la réponse est en UTF-8
    $json_response = json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($json_response === false) {
        error_log("Erreur d'encodage JSON: " . json_last_error_msg());
        // Essayer d'encoder sans les caractères Unicode problématiques
        $json_response = json_encode($response, JSON_PARTIAL_OUTPUT_ON_ERROR);
    }
    
    echo $json_response;
    exit;
} catch (Exception $e) {
    error_log("Exception dans database-test.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du test de connexion',
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
?>
