
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Configuration stricte des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// Headers CORS et Content-Type explicites et stricts
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation détaillée des requêtes
error_log("API Request - Method: " . ($_SERVER['REQUEST_METHOD'] ?? 'UNDEFINED'));
error_log("API Request - URI: " . ($_SERVER['REQUEST_URI'] ?? 'UNDEFINED'));
error_log("API Request - Full Query: " . json_encode($_SERVER));

// Fonction de diagnostic améliorée
function diagnoseRequest() {
    return [
        'status' => 'success',
        'message' => 'Point de terminaison API principal',
        'server_details' => [
            'php_version' => phpversion(),
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'Non défini',
            'uri' => $_SERVER['REQUEST_URI'] ?? 'Non défini',
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ];
}

try {
    // Route par défaut si aucun contrôleur spécifique n'est trouvé
    $response = diagnoseRequest();
    
    echo json_encode($response);
} catch (Exception $e) {
    error_log("Erreur API : " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur interne du serveur',
        'error_details' => $e->getMessage()
    ]);
} finally {
    ob_end_flush();
}
?>
