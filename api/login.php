
<?php
// Redirection vers auth.php pour la compatibilité
// Cette redirection permet d'assurer que les anciennes URL fonctionnent toujours

// Journaliser la redirection
error_log("=== REDIRECTION de login.php vers auth.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Garder les mêmes en-têtes CORS et content-type
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

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

// Adapter le format si nécessaire (convertir email en username)
if (isset($data['email']) && !isset($data['username'])) {
    $data['username'] = $data['email'];
}

// Réécrire le corps de la requête
$_POST = $data;

// Inclure le contrôleur d'authentification
try {
    // Option 1: Inclure directement auth.php
    if (file_exists(__DIR__ . '/auth.php')) {
        error_log("Redirection vers auth.php");
        require_once __DIR__ . '/auth.php';
        exit;
    }
    
    // Option 2: Inclure le contrôleur d'authentification directement
    if (file_exists(__DIR__ . '/controllers/AuthController.php')) {
        error_log("Inclusion directe de AuthController.php");
        require_once __DIR__ . '/controllers/AuthController.php';
        exit;
    }
    
    // Option 3: Essayer login-test.php comme fallback
    if (file_exists(__DIR__ . '/login-test.php')) {
        error_log("Redirection vers login-test.php");
        require_once __DIR__ . '/login-test.php';
        exit;
    }
    
    // Si aucune option ne fonctionne, renvoyer une erreur
    throw new Exception("Aucun contrôleur d'authentification trouvé");
} catch (Exception $e) {
    error_log("Erreur lors de la redirection d'authentification: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur serveur lors de l\'authentification',
        'error' => $e->getMessage()
    ]);
    exit;
} finally {
    error_log("=== FIN DE LA REDIRECTION DE login.php ===");
}
?>
