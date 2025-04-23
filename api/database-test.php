
<?php
// Point d'entrée stable pour tester la connexion à la base de données
header('Content-Type: application/json; charset=utf-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit(json_encode(['status' => 200, 'message' => 'Preflight OK']));
}

// Journaliser l'exécution
error_log("=== EXÉCUTION DE database-test.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Inclure la configuration de la base de données
require_once 'config/database.php';

try {
    // Créer une instance de la base de données
    $database = new Database();
    $db = $database->getConnection(false);
    
    // Journaliser la tentative de connexion
    error_log("Tentative de connexion à la base de données: " . $database->host . " / " . $database->db_name);
    
    // Vérifier si nous sommes connectés
    if ($database->is_connected) {
        // Réussie - collecter des informations sur la base de données
        try {
            // Liste des tables
            $tablesQuery = "SHOW TABLES";
            $tablesStmt = $db->query($tablesQuery);
            $tables = [];
            
            while ($row = $tablesStmt->fetch(PDO::FETCH_NUM)) {
                $tables[] = $row[0];
            }
            
            // Informations sur la base de données
            $infoQuery = "SELECT 
                VERSION() as version,
                DATABASE() as db_name,
                @@character_set_database as encoding,
                @@collation_database as collation";
            $infoStmt = $db->query($infoQuery);
            $dbInfo = $infoStmt->fetch(PDO::FETCH_ASSOC);
            
            // Taille approximative des données (si disponible)
            try {
                $sizeQuery = "SELECT 
                    SUM(data_length + index_length) / 1024 / 1024 AS size_mb 
                    FROM information_schema.TABLES 
                    WHERE table_schema = DATABASE()";
                $sizeStmt = $db->query($sizeQuery);
                $sizeInfo = $sizeStmt->fetch(PDO::FETCH_ASSOC);
                $dbSize = $sizeInfo['size_mb'] ?? 'Inconnu';
            } catch (Exception $e) {
                $dbSize = 'Non disponible';
            }
            
            // Construire la réponse
            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'message' => 'Connexion à la base de données établie avec succès',
                'info' => [
                    'host' => $database->host,
                    'database_name' => $database->db_name,
                    'username' => $database->username,
                    'size' => number_format($dbSize, 2) . ' Mo',
                    'last_backup' => 'Non disponible',
                    'encoding' => $dbInfo['encoding'] ?? 'utf8mb4',
                    'collation' => $dbInfo['collation'] ?? 'utf8mb4_general_ci',
                    'version' => $dbInfo['version'] ?? 'Inconnue',
                    'tables' => $tables,
                    'table_count' => count($tables)
                ]
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            
        } catch (PDOException $e) {
            // La connexion est établie mais la requête d'information a échoué
            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'message' => 'Connexion à la base de données établie, mais impossible de récupérer les informations complètes',
                'error_details' => $e->getMessage(),
                'info' => [
                    'host' => $database->host,
                    'database_name' => $database->db_name,
                    'username' => $database->username
                ]
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }
    } else {
        // Échec de la connexion
        error_log("Échec de la connexion: " . $database->connection_error);
        
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Impossible de se connecter à la base de données',
            'error' => $database->connection_error,
            'info' => [
                'host' => $database->host,
                'database_name' => $database->db_name,
                'username' => $database->username
            ]
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
} catch (Exception $e) {
    // Erreur inattendue
    error_log("Erreur dans database-test.php: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Une erreur inattendue est survenue',
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>
