
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
error_log("=== DEBUT DE L'EXÉCUTION DE membres-load.php ===");
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
        'records' => [
            [
                'id' => '1',
                'nom' => 'Dupont',
                'prenom' => 'Jean',
                'fonction' => 'Directeur',
                'initiales' => 'JD',
                'date_creation' => date('Y-m-d H:i:s')
            ],
            [
                'id' => '2',
                'nom' => 'Martin',
                'prenom' => 'Sophie',
                'fonction' => 'Responsable RH',
                'initiales' => 'SM',
                'date_creation' => date('Y-m-d H:i:s', strtotime('-2 days'))
            ]
        ],
        'timestamp' => date('c')
    ];
    
    http_response_code(200);
    echo json_encode($responseData);
    error_log("Réponse de membres-load.php : " . json_encode($responseData));
    
} catch (Exception $e) {
    error_log("Exception dans membres-load.php: " . $e->getMessage());
    http_response_code(400);
    $errorResponse = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    echo json_encode($errorResponse);
    error_log("Réponse d'erreur: " . json_encode($errorResponse));
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE membres-load.php ===");
    if (ob_get_level()) ob_end_flush();
}

?>
