
<?php
// Redirection vers le fichier diagnostic-complet.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journaliser la redirection
error_log("Redirection de diagnostic-complete.php vers diagnostic-complet.php");

// Définir la constante d'accès direct
define('DIRECT_ACCESS_CHECK', true);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Rediriger vers diagnostic-complet.php
require_once __DIR__ . '/diagnose.php';
exit;
?>
