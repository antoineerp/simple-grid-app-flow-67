
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

// Fonction de nettoyage UTF-8
if (!function_exists('cleanUTF8')) {
    function cleanUTF8($input) {
        if (is_string($input)) {
            return mb_convert_encoding($input, 'UTF-8', 'UTF-8');
        } elseif (is_array($input)) {
            foreach ($input as $key => $value) {
                $input[$key] = cleanUTF8($value);
            }
        }
        return $input;
    }
}

try {
    // Récupérer les données envoyées par le client
    $raw_data = file_get_contents("php://input");
    error_log("Données brutes reçues: " . $raw_data);
    
    if (empty($raw_data)) {
        throw new Exception("Aucune donnée reçue");
    }
    
    $data = json_decode($raw_data, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("JSON invalide: " . json_last_error_msg());
    }
    
    // Vérifier la présence des champs requis
    if (!isset($data['username']) || !isset($data['password'])) {
        throw new Exception("Identifiants incomplets");
    }
    
    // Nettoyer les entrées
    $username = cleanUTF8($data['username']);
    $password = $data['password']; // Ne pas nettoyer le mot de passe pour ne pas le modifier
    
    error_log("Tentative d'authentification pour l'utilisateur: " . $username);
    
    // Vérifier pour le compte test spécial antcirier@gmail.com
    if ($username === 'antcirier@gmail.com' && ($password === 'password123' || $password === 'Password123!')) {
        // Génération d'un token simple encodé en base64
        $token = base64_encode(json_encode([
            'user' => 'p71x6d_system',
            'role' => 'admin',
            'exp' => time() + 3600, // Expiration dans 1 heure
        ]));
        
        error_log("Authentification réussie pour antcirier@gmail.com");
        
        // Renvoyer une réponse de succès
        http_response_code(200);
        echo json_encode([
            'message' => 'Connexion réussie',
            'token' => $token,
            'user' => [
                'id' => '1',
                'nom' => 'Cirier',
                'prenom' => 'Antoine',
                'email' => 'antcirier@gmail.com',
                'identifiant_technique' => 'p71x6d_system',
                'role' => 'admin'
            ]
        ]);
        exit;
    }
    
    // Fallback pour simuler une authentification réussie pour les tests
    // Normalement, on vérifierait dans la base de données
    error_log("Tentative de connexion avec le mode de secours pour: " . $username);
    
    // Générer un token simple (encodé en base64)
    $token = base64_encode(json_encode([
        'user' => $username,
        'role' => 'admin',
        'exp' => time() + 3600, // Expiration dans 1 heure
    ]));
    
    // Renvoyer une réponse de succès
    http_response_code(200);
    echo json_encode([
        'message' => 'Connexion réussie',
        'token' => $token,
        'user' => [
            'id' => '99',
            'nom' => 'Utilisateur',
            'prenom' => 'Test',
            'email' => $username,
            'identifiant_technique' => $username,
            'role' => 'admin'
        ]
    ]);

} catch (Exception $e) {
    error_log("Erreur dans auth.php: " . $e->getMessage());
    
    // Envoyer une réponse d'erreur
    http_response_code(401);
    echo json_encode([
        'message' => $e->getMessage(),
        'status' => 'error'
    ]);
}

error_log("=== FIN DE L'EXÉCUTION DE auth.php ===");
?>
