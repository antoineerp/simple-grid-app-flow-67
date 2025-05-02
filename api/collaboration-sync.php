
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
error_log("=== DEBUT DE L'EXÉCUTION DE collaboration-sync.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Capturer les données brutes pour le débogage
$rawInput = file_get_contents("php://input");
error_log("Données brutes reçues par collaboration-sync.php: " . $rawInput);

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Récupérer les données POST JSON
    $data = json_decode($rawInput, true);
    
    if (!$rawInput || !$data) {
        throw new Exception("Aucune donnée reçue ou format JSON invalide");
    }
    
    error_log("Données JSON décodées pour collaboration-sync.php");
    
    // Vérifier si les données nécessaires sont présentes
    if (!isset($data['userId'])) {
        throw new Exception("Données incomplètes. 'userId' est requis");
    }
    
    $userId = $data['userId'];
    error_log("Synchronisation pour l'utilisateur: {$userId}");
    
    // Simuler une réponse réussie pour les tests
    // Dans votre système de production, vous implémenteriez ici l'enregistrement des données
    $responseData = [
        'success' => true,
        'message' => 'Données de collaboration synchronisées avec succès',
        'timestamp' => date('c'),
        'count' => isset($data['collaboration']) ? count($data['collaboration']) : 0
    ];
    
    http_response_code(200);
    echo json_encode($responseData);
    error_log("Réponse de collaboration-sync.php : " . json_encode($responseData));
    
} catch (Exception $e) {
    error_log("Exception dans collaboration-sync.php: " . $e->getMessage());
    http_response_code(400);
    $errorResponse = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    echo json_encode($errorResponse);
    error_log("Réponse d'erreur: " . json_encode($errorResponse));
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE collaboration-sync.php ===");
    if (ob_get_level()) ob_end_flush();
}
