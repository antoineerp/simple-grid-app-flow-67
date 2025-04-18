
<?php
// Définir explicitement le type de contenu JSON et les en-têtes CORS
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Journaliser l'accès à auth.php
error_log("auth.php appelé - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Bloc try-catch pour capturer toutes les erreurs possibles
try {
    // Redirection vers le contrôleur d'authentification
    if (file_exists(__DIR__ . '/controllers/AuthController.php')) {
        require_once __DIR__ . '/controllers/AuthController.php';
    } else {
        throw new Exception("Le fichier AuthController.php n'existe pas");
    }
} catch (Exception $e) {
    // Log l'erreur
    error_log("Erreur critique dans auth.php: " . $e->getMessage());
    
    // Toujours renvoyer une réponse JSON valide, même en cas d'erreur
    http_response_code(500);
    echo json_encode([
        'status' => 500,
        'message' => 'Erreur serveur interne',
        'error' => $e->getMessage()
    ]);
}
?>
