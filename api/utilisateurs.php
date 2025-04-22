
<?php
// Fichier de redirection vers le contrôleur d'utilisateurs
// Ce fichier simplifier l'accès à l'API via /api/utilisateurs directement

// En-têtes CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'appel
error_log("Redirection vers UsersController depuis utilisateurs.php | Méthode: " . $_SERVER['REQUEST_METHOD']);

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
