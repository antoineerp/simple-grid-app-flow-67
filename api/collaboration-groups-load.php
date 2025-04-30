
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
error_log("=== DEBUT DE L'EXÉCUTION DE collaboration-groups-load.php ===");
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
    
    error_log("Chargement des données de groupes de collaboration");
    
    // Vérifier si l'userId est présent
    if (!isset($_GET['userId'])) {
        throw new Exception("ID utilisateur manquant");
    }
    
    $userId = $_GET['userId'];
    error_log("UserId reçu: " . $userId);
    
    // Simuler une réponse avec des données pour les tests
    // Dans votre système de production, vous récupéreriez ici les données réelles
    $responseData = [
        'success' => true,
        'message' => 'Données des groupes de collaboration chargées avec succès',
        'timestamp' => date('c'),
        'groups' => []  // Un tableau vide pour les tests
    ];
    
    http_response_code(200);
    echo json_encode($responseData);
    error_log("Réponse de collaboration-groups-load.php : " . json_encode($responseData));
    
} catch (Exception $e) {
    error_log("Exception dans collaboration-groups-load.php: " . $e->getMessage());
    http_response_code(400);
    $errorResponse = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    echo json_encode($errorResponse);
    error_log("Réponse d'erreur: " . json_encode($errorResponse));
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE collaboration-groups-load.php ===");
    if (ob_get_level()) ob_end_flush();
}
