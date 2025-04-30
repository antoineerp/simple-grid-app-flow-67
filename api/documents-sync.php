
<?php
// Force output buffering to prevent output before headers
ob_start();

// Headers pour CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE documents-sync.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Récupérer les données POST JSON
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$json || !$data) {
        throw new Exception("Aucune donnée reçue ou format JSON invalide");
    }
    
    error_log("Données reçues pour synchronisation des documents");
    
    // Vérifier si les données nécessaires sont présentes
    if (!isset($data['userId']) || !isset($data['documents'])) {
        throw new Exception("Données incomplètes. 'userId' et 'documents' sont requis");
    }
    
    $userId = $data['userId'];
    $documents = $data['documents'];
    
    error_log("Synchronisation pour l'utilisateur: {$userId}");
    error_log("Nombre de documents: " . count($documents));
    
    // Simuler une réponse réussie (pour tester)
    echo json_encode([
        'success' => true,
        'message' => 'Synchronisation réussie',
        'count' => count($documents)
    ]);
    
} catch (Exception $e) {
    error_log("Exception dans documents-sync.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE documents-sync.php ===");
    if (ob_get_level()) ob_end_flush();
}
?>
