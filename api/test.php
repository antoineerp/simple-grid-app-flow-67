
<?php
// Simple test API endpoint
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'exécution
error_log("=== EXÉCUTION DE test.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

try {
    // Renvoyer un résultat simple
    echo json_encode([
        'status' => 'success',
        'message' => 'API PHP fonctionnelle',
        'timestamp' => date('Y-m-d H:i:s'),
        'php_version' => phpversion(),
        'server_info' => [
            'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu',
            'method' => $_SERVER['REQUEST_METHOD'],
            'uri' => $_SERVER['REQUEST_URI'],
            'remote_addr' => $_SERVER['REMOTE_ADDR']
        ]
    ]);
} catch (Exception $e) {
    error_log("Erreur dans test.php: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
