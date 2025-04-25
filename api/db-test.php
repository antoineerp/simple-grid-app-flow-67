
<?php
// Ce fichier est un alias vers db-connection-test.php pour éviter les conflits de routage
// Nous assurons d'avoir les bons en-têtes pour garantir une réponse JSON

// Définir explicitement l'encodage UTF-8
header("Content-Type: application/json; charset=UTF-8");

// En-têtes CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Désactiver la mise en cache
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'accès pour le débogage
error_log("=== EXÉCUTION DE db-test.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Inclure le fichier principal de test de connexion
require_once 'db-connection-test.php';
?>
