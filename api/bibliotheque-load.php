
<?php
// Force output buffering to prevent output before headers
ob_start();

// Fichier pour charger les données de la bibliothèque depuis le serveur
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE bibliotheque-load.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();

    // Vérifier si l'userId est présent
    if (!isset($_GET['userId']) || empty($_GET['userId'])) {
        throw new Exception("Paramètre 'userId' manquant");
    }
    
    $userId = $_GET['userId'];
    error_log("Chargement des données pour l'utilisateur: {$userId}");
    
    // Pour le moment, renvoyons des données simulées pour éviter les erreurs
    // Vous pourrez implémenter la logique réelle ultérieurement
    echo json_encode([
        'success' => true,
        'documents' => [],
        'groups' => [],
        'count' => [
            'documents' => 0,
            'groups' => 0
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Erreur dans bibliotheque-load.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE bibliotheque-load.php ===");
    if (ob_get_level()) ob_end_flush();
}
?>
