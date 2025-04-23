
<?php
// Point d'entrée simplifié pour tester la connexion à la base de données
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
error_log("Exécution de db-connection-test.php - " . date('Y-m-d H:i:s'));

// Inclure la configuration de la base de données
require_once 'config/database.php';

try {
    // Créer une instance de la base de données
    $database = new Database();
    $connected = $database->testConnection();
    
    if ($connected) {
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'Connexion à la base de données établie',
            'timestamp' => time(),
            'db_info' => [
                'host' => $database->host,
                'database' => $database->db_name
            ]
        ]);
    } else {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Impossible de se connecter à la base de données',
            'error' => $database->connection_error
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Une erreur est survenue',
        'error' => $e->getMessage()
    ]);
}
?>
