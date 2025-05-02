
<?php
// Configuration initiale
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journaliser l'appel
error_log("=== APPEL À user_data.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Récupérer l'ID utilisateur depuis les paramètres
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

error_log("ID utilisateur demandé: " . ($id ?? 'non défini'));

// Vérifier que l'ID est bien défini
if (!$id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'ID utilisateur manquant']);
    exit;
}

try {
    // Données fictives pour le test
    $userData = [
        'id' => $id,
        'username' => 'utilisateur_test',
        'email' => 'test@example.com',
        'role' => 'admin',
        'nom' => 'Utilisateur',
        'prenom' => 'Test',
        'identifiant_technique' => 'p71x6d_test',
        'status' => 'active'
    ];

    // Envoyer la réponse
    echo json_encode([
        'status' => 'success',
        'message' => 'Données utilisateur récupérées',
        'data' => $userData
    ]);
} catch (Exception $e) {
    error_log("Erreur dans user_data.php: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?>
