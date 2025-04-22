
<?php
// Script de test simple pour vérifier la connexion sans passer par les contrôleurs complexes
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Activer la journalisation
ini_set('display_errors', 1);
error_reporting(E_ALL);
error_log("=== EXÉCUTION DE login-test.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);
error_log("Chemin complet du script: " . __FILE__);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Récupérer les données POST
    $json_input = file_get_contents("php://input");
    $data = json_decode($json_input);
    
    error_log("Données reçues: " . $json_input);
    
    // Vérifier des identifiants simples
    if (isset($data->username) && isset($data->password)) {
        // Authentifications hardcodées pour test
        $valid_users = [
            'p71x6d_system' => ['password' => 'admin123', 'role' => 'admin'],
            'p71x6d_dupont' => ['password' => 'manager456', 'role' => 'gestionnaire'],
            'p71x6d_martin' => ['password' => 'user789', 'role' => 'utilisateur'],
            'admin' => ['password' => 'admin123', 'role' => 'admin'],
            'antcirier@gmail.com' => ['password' => 'password123', 'role' => 'admin']
        ];
        
        if (isset($valid_users[$data->username]) && $valid_users[$data->username]['password'] === $data->password) {
            // Générer un token simple pour le test
            $token = md5($data->username . time());
            
            error_log("Authentification réussie pour: " . $data->username);
            
            http_response_code(200);
            echo json_encode([
                'message' => 'Connexion réussie (mode test)',
                'token' => $token,
                'user' => [
                    'id' => 1,
                    'nom' => 'Test',
                    'prenom' => 'User',
                    'email' => $data->username . '@test.com',
                    'identifiant_technique' => $data->username,
                    'role' => $valid_users[$data->username]['role']
                ]
            ]);
        } else {
            error_log("Identifiants invalides pour: " . $data->username);
            
            http_response_code(401);
            echo json_encode(['message' => 'Identifiants invalides']);
        }
    } else {
        error_log("Données incomplètes");
        
        http_response_code(400);
        echo json_encode(['message' => 'Données incomplètes']);
    }
} else {
    error_log("Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
    
    http_response_code(405);
    echo json_encode(['message' => 'Méthode non autorisée']);
}
?>
