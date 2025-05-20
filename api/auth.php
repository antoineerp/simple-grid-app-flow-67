
<?php
// En-têtes et configuration initiale
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation des requêtes
error_log("=== EXÉCUTION DE auth.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Gestion du preflight CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Vérification de la méthode POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Méthode non autorisée. Utilisez POST.', 'status' => 405]);
    exit;
}

// Récupération des données JSON
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Journalisation sécurisée (masquer le mot de passe)
$log_data = $data;
if (isset($log_data['password'])) {
    $log_data['password'] = '******';
}
error_log("Données reçues: " . json_encode($log_data));

// Inclure le fichier check-users.php qui contient la logique d'authentification
require_once __DIR__ . '/check-users.php';
?>
