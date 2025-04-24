
<?php
// Fichier de redirection vers le contrôleur d'utilisateurs
// Ce fichier simplifier l'accès à l'API via /api/utilisateurs directement

// Activer la journalisation détaillée
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_log("====== DÉBUT DE LA REQUÊTE UTILISATEURS.PHP ======");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " | URI: " . $_SERVER['REQUEST_URI']);

// En-têtes CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    error_log("Réponse préliminaire OPTIONS envoyée");
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'appel avec les données
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $raw_data = file_get_contents('php://input');
    error_log("Données POST reçues: " . $raw_data);
    
    // Analyser les données JSON pour journalisation (sans mot de passe)
    $data = json_decode($raw_data, true);
    if ($data) {
        if (isset($data['mot_de_passe'])) $data['mot_de_passe'] = '******';
        error_log("Données décodées: " . json_encode($data));
    }
}

// Journaliser l'appel
error_log("Redirection vers UserController depuis utilisateurs.php | Méthode: " . $_SERVER['REQUEST_METHOD']);

// Inclure le contrôleur d'utilisateurs
$userController = __DIR__ . '/controllers/UserController.php';
if (file_exists($userController)) {
    error_log("Contrôleur d'utilisateurs trouvé: " . $userController);
    require_once $userController;
} else {
    error_log("ERREUR: Contrôleur d'utilisateurs NON trouvé: " . $userController);
    http_response_code(500);
    echo json_encode([
        'message' => 'Contrôleur d\'utilisateurs non trouvé',
        'status' => 500,
        'path' => $userController
    ]);
}
error_log("====== FIN DE LA REQUÊTE UTILISATEURS.PHP ======");
?>
