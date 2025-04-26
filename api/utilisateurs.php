
<?php
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
error_log("Redirection vers UsersController depuis utilisateurs.php | Méthode: " . $_SERVER['REQUEST_METHOD']);

// Vider le buffer de sortie pour éviter les problèmes
if (ob_get_level()) ob_clean();

// Définir les headers corrects avant d'inclure le contrôleur
header('Content-Type: application/json; charset=UTF-8');

// Inclure le contrôleur d'utilisateurs
$userController = __DIR__ . '/controllers/UsersController.php';
if (file_exists($userController)) {
    require_once $userController;
} else {
    http_response_code(500);
    echo json_encode([
        'message' => 'Contrôleur d\'utilisateurs non trouvé',
        'status' => 500,
        'path' => $userController
    ]);
}
?>
