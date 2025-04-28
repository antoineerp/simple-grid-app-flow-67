
<?php
// Redirection vers auth.php pour la compatibilité
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journaliser la redirection
error_log("=== REDIRECTION de login.php vers auth.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Vérifier si la méthode est POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['message' => 'Méthode non autorisée. Utilisez POST pour l\'authentification.', 'status' => 405]);
    exit;
}

// Récupérer le contenu de la requête
$json_input = file_get_contents("php://input");
$data = json_decode($json_input, true);

// Journaliser les données reçues (masquer les infos sensibles)
$log_data = $data;
if (isset($log_data['password'])) {
    $log_data['password'] = '********';
}
error_log("Données reçues par login.php: " . json_encode($log_data));

// Inclure le contrôleur d'authentification
require_once __DIR__ . '/auth.php';
?>
