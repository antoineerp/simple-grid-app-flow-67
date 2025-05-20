
<?php
// Force output buffering to prevent output before headers
ob_start();

// Headers pour CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DÉBUT DE L'EXÉCUTION DE verify-json-endpoint.php ===");

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

try {
    // Nettoyer tout output buffer potentiel
    if (ob_get_level()) ob_clean();
    
    // Cette API est simple et ne renvoie qu'un objet JSON valide pour vérifier
    // que l'endpoint fonctionne correctement et ne renvoie pas de HTML ou autre
    $response = [
        'success' => true,
        'message' => 'Endpoint JSON valide',
        'timestamp' => date('c'),
        'endpoint' => 'verify-json-endpoint'
    ];
    
    echo json_encode($response);
    error_log("API verify-json-endpoint a répondu avec succès");
    
} catch (Exception $e) {
    error_log("Exception dans verify-json-endpoint.php: " . $e->getMessage());
    http_response_code(500);
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (ob_get_level()) ob_end_flush();
    error_log("=== FIN DE L'EXÉCUTION DE verify-json-endpoint.php ===");
}
?>
