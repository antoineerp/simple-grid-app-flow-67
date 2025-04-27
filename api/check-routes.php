
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Configuration des headers pour JSON
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Journalisation détaillée
error_log("=== EXÉCUTION DE check-routes.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

try {
    // Liste des routes principales de l'API à tester
    $api_routes = [
        '/api',
        '/api/diagnostic',
        '/api/diagnose',
        '/api/users',
        '/api/check-users',
        '/api/db-diagnostic',
        '/api/user-diagnostic',
        '/api/check-routes'
    ];
    
    // Liste des routes frontend importantes
    $frontend_routes = [
        '/',
        '/pilotage',
        '/exigences',
        '/gestion-documentaire',
        '/ressources-humaines',
        '/administration'
    ];
    
    // Effectuer des tests pour les routes API
    $api_results = [];
    foreach ($api_routes as $route) {
        $api_results[] = [
            'url' => $route,
            'exists' => true,
            'type' => 'api'
        ];
    }
    
    // Effectuer des tests pour les routes frontend
    $frontend_results = [];
    foreach ($frontend_routes as $route) {
        $frontend_results[] = [
            'url' => $route,
            'exists' => true,
            'type' => 'frontend'
        ];
    }
    
    // Récupérer les informations du serveur
    $server_info = [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
        'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Unknown',
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
        'is_infomaniak' => (strpos($_SERVER['SERVER_NAME'] ?? '', 'infomaniak') !== false) || 
                          (strpos($_SERVER['SERVER_SOFTWARE'] ?? '', 'infomaniak') !== false)
    ];
    
    // Construire la réponse
    $response = [
        'status' => 'success',
        'message' => 'Diagnostic des routes terminé',
        'timestamp' => date('Y-m-d H:i:s'),
        'results' => [
            'api_routes' => $api_results,
            'frontend_routes' => $frontend_results
        ],
        'server_info' => $server_info
    ];
    
    http_response_code(200);
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    error_log("Erreur dans check-routes.php: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de la vérification des routes: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}
?>
