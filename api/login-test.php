
<?php
// Clear any previous output buffering and start fresh
if (ob_get_level()) ob_end_clean();
ob_start();

// Force content type and CORS headers
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Log access for debugging
error_log("=== EXÉCUTION DE login-test.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Handle OPTIONS requests (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    ob_end_flush();
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Méthode non autorisée', 'status' => 405]);
    ob_end_flush();
    exit;
}

try {
    // Get POST data
    $json_input = file_get_contents("php://input");
    $data = json_decode($json_input);

    // Log received data (mask password)
    $log_data = $data;
    if (isset($log_data->password)) {
        $log_data->password = '********';
    }
    error_log("Données reçues: " . json_encode($log_data));

    // Check if data is present
    if (!empty($data->username) && !empty($data->password)) {
        // List of authorized test users
        $test_users = [
            'admin' => ['password' => 'admin123', 'role' => 'admin'],
            'p71x6d_system' => ['password' => 'Trottinette43!', 'role' => 'admin'],
            'antcirier@gmail.com' => ['password' => 'password123', 'role' => 'admin'],
            'p71x6d_dupont' => ['password' => 'manager456', 'role' => 'gestionnaire'],
            'p71x6d_martin' => ['password' => 'user789', 'role' => 'utilisateur']
        ];
        
        $username = $data->username;
        $password = $data->password;
        
        error_log("Tentative de connexion pour: " . $username . " avec mot de passe fourni");
        
        // Debug: check available users
        error_log("Utilisateurs disponibles: " . implode(", ", array_keys($test_users)));
        
        // Check if user exists and password matches
        if (isset($test_users[$username]) && $test_users[$username]['password'] === $password) {
            // Generate a mock token
            $token = base64_encode(json_encode([
                'user' => $username,
                'role' => $test_users[$username]['role'],
                'exp' => time() + 3600
            ]));
            
            error_log("Connexion réussie pour: " . $username);
            
            http_response_code(200);
            echo json_encode([
                'message' => 'Connexion réussie',
                'token' => $token,
                'user' => [
                    'id' => 0,
                    'nom' => explode('_', $username)[1] ?? $username,
                    'prenom' => '',
                    'email' => $username . '@example.com',
                    'identifiant_technique' => $username,
                    'role' => $test_users[$username]['role']
                ]
            ]);
        } else {
            error_log("Identifiants invalides pour: " . $username);
            
            if (isset($test_users[$username])) {
                error_log("Utilisateur trouvé, mais mot de passe incorrect");
            } else {
                error_log("Utilisateur non trouvé dans la liste");
            }
            
            http_response_code(401);
            echo json_encode([
                'message' => 'Identifiants invalides', 
                'status' => 401,
                'debug' => [
                    'username_exists' => isset($test_users[$username]),
                    'submitted_username' => $username
                ]
            ]);
        }
    } else {
        error_log("Données incomplètes reçues");
        http_response_code(400);
        echo json_encode([
            'message' => 'Données incomplètes', 
            'status' => 400,
            'debug' => [
                'received_data' => $json_input,
                'expected' => ['username' => 'string', 'password' => 'string']
            ]
        ]);
    }
} catch (Exception $e) {
    error_log("Exception dans login-test.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'message' => 'Erreur serveur', 
        'status' => 500,
        'error' => $e->getMessage()
    ]);
} finally {
    // Flush and end output buffer
    ob_end_flush();
}
?>
