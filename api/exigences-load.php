
<?php
// Inclure la configuration de base
require_once __DIR__ . '/config/index.php';

// Configuration des headers
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

try {
    // Inclure la base de données si elle existe
    if (file_exists(__DIR__ . '/config/database.php')) {
        require_once __DIR__ . '/config/database.php';
    }

    // Vérifier l'authentification si le middleware Auth existe
    if (file_exists(__DIR__ . '/middleware/Auth.php')) {
        include_once __DIR__ . '/middleware/Auth.php';
        
        $allHeaders = getallheaders();
        
        if (class_exists('Auth')) {
            $auth = new Auth($allHeaders);
            $userData = $auth->isAuth();
            
            if (!$userData) {
                http_response_code(401);
                echo json_encode(["status" => "error", "message" => "Non autorisé"]);
                exit;
            }
        }
    }

    // Récupérer l'identifiant de l'utilisateur depuis les paramètres GET
    $userId = isset($_GET['userId']) ? $_GET['userId'] : null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "L'identifiant utilisateur est requis"]);
        exit;
    }

    // Simuler un chargement réussi (à remplacer par la vraie logique)
    $result = [
        "success" => true,
        "exigences" => [],
        "groups" => []
    ];

    // Envoyer la réponse
    http_response_code(200);
    echo json_encode($result);
    
} catch (Exception $e) {
    // Gérer les erreurs
    error_log("Erreur dans exigences-load.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur serveur: " . $e->getMessage()]);
}
?>
