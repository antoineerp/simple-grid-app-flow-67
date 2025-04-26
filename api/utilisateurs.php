
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Configuration des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0); // Ne pas afficher les erreurs dans la réponse
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// En-têtes CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Journaliser la redirection
error_log("Redirection de utilisateurs.php vers users.php");

// Définir la constante d'accès direct
define('DIRECT_ACCESS_CHECK', true);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Rediriger vers users.php avec les mêmes paramètres et méthode
require_once __DIR__ . '/users.php';
exit;
?>
