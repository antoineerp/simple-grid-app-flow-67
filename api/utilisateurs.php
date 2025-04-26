
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Fichier de redirection vers le contrôleur d'utilisateurs
// Ce fichier est nécessaire pour gérer les requêtes API liées aux utilisateurs

// En-têtes CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'appel
error_log("API utilisateurs.php - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - Requête: " . $_SERVER['REQUEST_URI']);

// Nettoyer tout buffer de sortie existant
if (ob_get_level()) ob_clean();

try {
    // Inclure directement le contrôleur d'utilisateurs
    $userController = __DIR__ . '/controllers/UsersController.php';
    if (file_exists($userController)) {
        require_once $userController;
    } else {
        throw new Exception("Contrôleur d'utilisateurs non trouvé: $userController");
    }
} catch (Exception $e) {
    // En cas d'erreur, envoyer une réponse JSON propre
    error_log("Erreur dans utilisateurs.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'path' => $userController ?? 'undefined',
        'current_dir' => __DIR__
    ]);
}
?>
