
<?php
// Activer la journalisation d'erreurs plus détaillée
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Enregistrer le début de l'exécution
error_log("=== DÉBUT DE L'EXÉCUTION DE verify-session.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Définir explicitement le type de contenu JSON et les en-têtes CORS
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Preflight OK']);
    exit;
}

// Vérifier si la méthode est POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. Utilisez POST pour la vérification.']);
    exit;
}

try {
    // Récupérer le token depuis l'en-tête Authorization
    $headers = getallheaders();
    $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (empty($auth_header) || strpos($auth_header, 'Bearer ') !== 0) {
        throw new Exception("Token d'authentification manquant ou invalide");
    }
    
    $token = substr($auth_header, 7); // Retirer "Bearer " du début
    error_log("Token reçu: " . substr($token, 0, 20) . "...");
    
    // Vérifier la validité du token
    if (!validateJWT($token)) {
        throw new Exception("Token JWT invalide");
    }
    
    // Si tout va bien, renvoyer une réponse positive
    echo json_encode([
        'success' => true,
        'valid' => true,
        'message' => 'Session valide'
    ]);
    
} catch (Exception $e) {
    error_log("Erreur dans verify-session.php: " . $e->getMessage());
    
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'valid' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE verify-session.php ===");
}

// Fonction pour valider un JWT
function validateJWT($token) {
    // Diviser le token en 3 parties
    $parts = explode('.', $token);
    
    if (count($parts) !== 3) {
        return false;
    }
    
    list($header, $payload, $signature) = $parts;
    
    // Décoder le payload
    $payload_data = json_decode(base64UrlDecode($payload), true);
    
    if (!$payload_data) {
        return false;
    }
    
    // Vérifier si le token a expiré
    if (isset($payload_data['exp']) && $payload_data['exp'] < time()) {
        return false;
    }
    
    // Vérifier que les données utilisateur sont présentes
    if (!isset($payload_data['user']) || !isset($payload_data['user']['id'])) {
        return false;
    }
    
    return true;
}

// Fonction pour décoder base64url
function base64UrlDecode($input) {
    $remainder = strlen($input) % 4;
    if ($remainder) {
        $input .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($input, '-_', '+/'));
}
?>
