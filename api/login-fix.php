
<?php
// Script de login simplifié, sans dépendances complexes

// Forcer l'encodage et désactiver la mise en cache
header('Content-Type: application/json; charset=UTF-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Autoriser CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Journaliser l'accès pour diagnostic
error_log("=== Exécution de login-fix.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " | URI: " . $_SERVER['REQUEST_URI']);

// Gérer les requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'CORS preflight OK'
    ]);
    exit;
}

// Uniquement pour les requêtes POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Méthode non autorisée'
    ]);
    exit;
}

try {
    // Récupérer les données
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    // Vérifier les données
    if (!$data || !isset($data['username']) || !isset($data['password'])) {
        throw new Exception('Données incomplètes');
    }
    
    $username = $data['username'];
    $password = $data['password'];
    
    error_log("Tentative de connexion pour: " . $username);
    
    // Liste des utilisateurs de test
    $users = [
        'admin' => ['password' => 'admin123', 'role' => 'admin'],
        'p71x6d_system' => ['password' => 'Trottinette43!', 'role' => 'admin'],
        'antcirier@gmail.com' => ['password' => 'password123', 'role' => 'admin'],
        'p71x6d_dupont' => ['password' => 'manager456', 'role' => 'gestionnaire'],
        'p71x6d_martin' => ['password' => 'user789', 'role' => 'utilisateur']
    ];
    
    // Vérifier les identifiants
    if (array_key_exists($username, $users) && $users[$username]['password'] === $password) {
        // Token simplifié
        $token = base64_encode(json_encode([
            'user' => $username,
            'role' => $users[$username]['role'],
            'exp' => time() + 3600
        ]));
        
        error_log("Connexion réussie pour: " . $username);
        
        // Réponse réussie
        echo json_encode([
            'status' => 'success',
            'message' => 'Connexion réussie',
            'token' => $token,
            'user' => [
                'id' => mt_rand(1, 1000),
                'nom' => explode('@', $username)[0],
                'prenom' => '',
                'email' => $username . '@example.com',
                'identifiant_technique' => $username,
                'role' => $users[$username]['role']
            ]
        ]);
    } else {
        error_log("Échec de connexion pour: " . $username);
        
        // Échec d'authentification
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Identifiants invalides'
        ]);
    }
} catch (Exception $e) {
    error_log("Erreur: " . $e->getMessage());
    
    // Erreur serveur
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
