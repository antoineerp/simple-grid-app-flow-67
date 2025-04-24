
<?php
// Début de la journalisation
error_log("=== DÉBUT DE L'EXÉCUTION DE AuthController.php ===");

// Configuration des en-têtes
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Inclure les dépendances nécessaires
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/JwtHandler.php';
require_once __DIR__ . '/../services/AuthenticationService.php';
require_once __DIR__ . '/../services/RequestValidator.php';

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

try {
    // Valider la requête
    $validation = RequestValidator::validateAuthRequest();
    if (!$validation['isValid']) {
        http_response_code($validation['status']);
        echo json_encode(['message' => $validation['message'], 'status' => $validation['status']]);
        exit;
    }

    // Traiter l'authentification
    $authService = new AuthenticationService();
    $result = $authService->authenticate($validation['data']->username, $validation['data']->password);

    if ($result) {
        http_response_code(200);
        echo json_encode($result);
    } else {
        http_response_code(401);
        echo json_encode([
            'message' => 'Identifiants invalides',
            'status' => 401
        ]);
    }

} catch (Exception $e) {
    error_log("Erreur dans AuthController: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'message' => 'Erreur serveur',
        'error' => $e->getMessage()
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE AuthController.php ===");
}
?>
