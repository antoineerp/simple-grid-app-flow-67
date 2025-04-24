
<?php
// Activer la journalisation d'erreurs plus détaillée
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Enregistrer le début de l'exécution
error_log("=== DÉBUT DE L'EXÉCUTION DE auth.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Définir explicitement le type de contenu JSON et les en-têtes CORS
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Vérifier si la méthode est OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Vérifier si la méthode est POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['message' => 'Méthode non autorisée. Utilisez POST pour l\'authentification.', 'status' => 405]);
    exit;
}

// Récupérer les données POST
$json_input = file_get_contents("php://input");
error_log("Contenu brut reçu: " . substr($json_input, 0, 200));

// Vérifier si les données sont vides
if (empty($json_input)) {
    error_log("Aucune donnée reçue");
    http_response_code(400);
    echo json_encode(['message' => 'Aucune donnée reçue', 'status' => 400]);
    exit;
}

try {
    // Décoder le JSON
    $data = json_decode($json_input);
    
    // Vérifier si le décodage a réussi
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Erreur de décodage JSON: " . json_last_error_msg());
        http_response_code(400);
        echo json_encode(['message' => 'Format JSON invalide', 'status' => 400, 'error' => json_last_error_msg()]);
        exit;
    }
    
    // Vérifier si les données nécessaires sont présentes
    if (!isset($data->username) || !isset($data->password)) {
        error_log("Données incomplètes pour l'authentification");
        http_response_code(400);
        echo json_encode(['message' => 'Données incomplètes', 'status' => 400]);
        exit;
    }
    
    error_log("Tentative de connexion pour l'utilisateur: " . $data->username);
    
    // Authentification simplifiée pour test
    if ($data->username === 'antcirier@gmail.com' && 
        ($data->password === 'password123' || $data->password === 'Password123!')) {
        
        error_log("Connexion réussie pour: " . $data->username);
        
        // Générer un token JWT simple (pour démonstration)
        $token = base64_encode(json_encode([
            'user' => $data->username,
            'exp' => time() + 3600,
            'role' => 'admin'
        ]));
        
        http_response_code(200);
        echo json_encode([
            'message' => 'Connexion réussie',
            'token' => $token,
            'user' => [
                'id' => 1,
                'nom' => 'Cirier',
                'prenom' => 'Antoine',
                'email' => $data->username,
                'identifiant_technique' => 'p71x6d_cirier',
                'role' => 'admin'
            ]
        ]);
        exit;
    }
    
    // Essai de transmission à AuthController.php
    error_log("Tentative de délégation à AuthController.php");
    require_once 'controllers/AuthController.php';
    
} catch (Exception $e) {
    error_log("Exception dans auth.php: " . $e->getMessage());
    error_log("Trace: " . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        'message' => 'Erreur du serveur', 
        'status' => 500,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE auth.php ===");
}
?>
