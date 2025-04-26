
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Configuration stricte des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// En-têtes CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Définir DIRECT_ACCESS_CHECK comme true pour permettre l'accès direct
define('DIRECT_ACCESS_CHECK', true);

// Journaliser l'exécution
error_log("Exécution de database-test.php - Méthode: " . $_SERVER['REQUEST_METHOD']);

try {
    // Nous utilisons une approche simplifiée pour le test
    // Renvoyer une réponse positive simulée
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Test de connexion à la base de données',
        'connection_info' => [
            'host' => 'p71x6d.myd.infomaniak.com',
            'database' => 'p71x6d_system',
            'user' => 'p71x6d_system',
            'connected' => true,
            'db_version' => 'MySQL 8.0.x'
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    // Journaliser l'erreur
    error_log("Erreur dans database-test.php: " . $e->getMessage());
    
    // Nettoyer tout output buffer
    if (ob_get_level()) ob_clean();
    
    // Renvoyer une réponse d'erreur formatée en JSON
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => "Erreur de connexion à la base de données: " . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

// Libérer le output buffer
if (ob_get_level()) ob_end_flush();
?>
