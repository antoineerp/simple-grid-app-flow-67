
<?php
// Fichier de test de login simplifié
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Include required files
require_once 'config/database.php';
require_once 'services/LoginService.php';

// Journaliser l'accès pour le diagnostic
error_log("=== EXÉCUTION DE login-test.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Handler pour les requêtes GET (documentation de l'API)
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    try {
        $database = new Database();
        $loginService = new LoginService();
        
        // Récupérer les utilisateurs disponibles
        $test_users = ['admin', 'p71x6d_system', 'antcirier@gmail.com', 'p71x6d_dupont', 'p71x6d_martin'];
        
        // Ajouter les utilisateurs de la base s'il y en a
        if ($database->is_connected) {
            $query = "SELECT identifiant_technique, email FROM utilisateurs";
            $stmt = $database->getConnection()->prepare($query);
            $stmt->execute();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $username = $row['email'] ?: $row['identifiant_technique'];
                if (!in_array($username, $test_users)) {
                    $test_users[] = $username;
                }
            }
        }
        
        http_response_code(200);
        echo json_encode([
            'message' => 'Service de test de connexion FormaCert',
            'status' => 200,
            'available_users' => $test_users,
            'usage' => [
                'method' => 'POST',
                'content_type' => 'application/json',
                'body_format' => ['username' => 'string', 'password' => 'string']
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Erreur serveur', 'error' => $e->getMessage()]);
    }
    exit;
}

// Vérifier si c'est une requête POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Méthode non autorisée', 'status' => 405]);
    exit;
}

// Récupérer et valider les données POST
$json_input = file_get_contents("php://input");
$data = json_decode($json_input);

if (!$data || empty($data->username) || empty($data->password)) {
    http_response_code(400);
    echo json_encode(['message' => 'Données incomplètes', 'status' => 400]);
    exit;
}

try {
    // Créer les instances nécessaires
    $database = new Database();
    $loginService = new LoginService();
    
    // Tenter l'authentification
    $result = $loginService->authenticateUser($data->username, $data->password, $database);
    
    // Envoyer la réponse
    http_response_code($result['success'] ? 200 : 401);
    echo json_encode($result);
    
} catch (Exception $e) {
    error_log("Erreur dans login-test.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'message' => 'Erreur serveur',
        'error' => $e->getMessage()
    ]);
}
?>
