
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

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
    // Vérifier si le contrôleur existe avant de l'inclure
    $userController = __DIR__ . '/controllers/UsersController.php';
    if (!file_exists($userController)) {
        throw new Exception("Contrôleur d'utilisateurs non trouvé: $userController");
    }
    
    // Définir la constante pour le contrôle d'accès direct
    if (!defined('DIRECT_ACCESS_CHECK')) {
        define('DIRECT_ACCESS_CHECK', true);
    }
    
    // Inclure le contrôleur d'utilisateurs
    require_once $userController;
    
    // Si nous arrivons ici sans avoir envoyé de réponse, c'est une erreur
    if (!headers_sent()) {
        error_log("API utilisateurs.php - Aucune réponse envoyée par le contrôleur");
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Le contrôleur n\'a pas généré de réponse'
        ]);
    }
} catch (Exception $e) {
    // Nettoyer le buffer en cas d'erreur
    if (ob_get_level()) ob_clean();
    
    // En cas d'erreur, envoyer une réponse JSON propre
    error_log("Erreur dans utilisateurs.php: " . $e->getMessage());
    
    // S'assurer que les en-têtes sont correctement définis
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code(500);
    }
    
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'path' => $userController ?? 'undefined',
        'current_dir' => __DIR__
    ]);
}

// S'assurer que tout buffer est vidé
if (ob_get_level()) ob_end_flush();
?>
