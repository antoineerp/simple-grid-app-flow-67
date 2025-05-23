
<?php
// Définir un accès direct pour les fichiers inclus
define('DIRECT_ACCESS_CHECK', true);

// Configuration pour afficher les erreurs
ini_set('display_errors', 0); // Désactiver l'affichage des erreurs directement
ini_set('log_errors', 1); // Activer la journalisation des erreurs
error_reporting(E_ALL);

// Journalisation de la requête
error_log("users.php - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// En-têtes pour CORS et JSON
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Forced-DB-User, X-User-Prefix");
header("Access-Control-Max-Age: 3600");

// Traiter les requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Inclure les fichiers nécessaires
    require_once 'controllers/UsersController.php';
    require_once 'utils/ResponseHandler.php';
    
    // Créer une instance du contrôleur et traiter la requête
    $users = new UsersController();
    $users->processRequest();
    
} catch (Exception $e) {
    error_log("Exception dans users.php: " . $e->getMessage());
    
    // S'assurer que tout buffer d'output est nettoyé
    if (ob_get_level()) ob_clean();
    
    // S'assurer que les en-têtes sont correctement définis
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=UTF-8');
    }
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => "Erreur serveur: " . $e->getMessage(),
        'debug_info' => get_class($e) . " à la ligne " . $e->getLine() . " dans " . $e->getFile()
    ]);
}
?>
