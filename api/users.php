
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
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'appel
error_log("API users.php - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - Requête: " . $_SERVER['REQUEST_URI']);

// Nettoyer tout buffer de sortie existant
if (ob_get_level()) ob_clean();

try {
    // Définir la constante pour le contrôle d'accès direct
    if (!defined('DIRECT_ACCESS_CHECK')) {
        define('DIRECT_ACCESS_CHECK', true);
    }

    // Inclure les fichiers de base nécessaires
    require_once __DIR__ . '/config/database.php';
    require_once __DIR__ . '/models/User.php';
    
    // Inclure les opérations en fonction de la méthode HTTP
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            require_once __DIR__ . '/operations/users/GetOperations.php';
            $operations = new UserGetOperations(new User(Database::getConnection()));
            $operations->handleGetRequest();
            break;
        
        case 'POST':
            require_once __DIR__ . '/operations/users/PostOperations.php';
            $operations = new UserPostOperations(new User(Database::getConnection()));
            $operations->handlePostRequest();
            break;
            
        case 'PUT':
            require_once __DIR__ . '/operations/users/PutOperations.php';
            $operations = new UserPutOperations(new User(Database::getConnection()));
            $operations->handlePutRequest();
            break;
            
        case 'DELETE':
            require_once __DIR__ . '/operations/users/DeleteOperations.php';
            $operations = new UserDeleteOperations(new User(Database::getConnection()));
            $operations->handleDeleteRequest();
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['status' => 'error', 'message' => 'Méthode non autorisée']);
    }
} catch (Exception $e) {
    // Nettoyer le buffer en cas d'erreur
    if (ob_get_level()) ob_clean();
    
    // En cas d'erreur, envoyer une réponse JSON propre
    error_log("Erreur dans users.php: " . $e->getMessage());
    
    // S'assurer que les en-têtes sont correctement définis
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code(500);
    }
    
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}

// S'assurer que tout buffer est vidé
if (ob_get_level()) ob_end_flush();
?>
