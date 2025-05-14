
<?php
header('Content-Type: application/json');

// Traitement des requêtes OPTIONS pour CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    exit(0);
}

// En-têtes CORS pour toutes les autres requêtes
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Vérifier si le fichier de configuration existe
$config_file = __DIR__ . '/config/db_config.json';
if (!file_exists($config_file)) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Configuration de la base de données manquante',
        'action_required' => 'Veuillez configurer la base de données'
    ]);
    exit;
}

// Initialisation de l'API
try {
    // Charger les contrôleurs et modèles nécessaires
    require_once __DIR__ . '/config/database.php';
    
    // Traiter la requête
    $route = $_SERVER['PATH_INFO'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];
    
    // Réponse temporaire pour le test
    echo json_encode([
        'status' => 'success',
        'message' => 'API fonctionnelle',
        'route' => $route,
        'method' => $method,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de l\'initialisation de l\'API',
        'error' => $e->getMessage()
    ]);
}
?>
