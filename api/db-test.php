
<?php
// Fichier de test de connexion à la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Inclure la configuration de la base de données
if (file_exists('config/database.php')) {
    require_once 'config/database.php';
} else {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Fichier de configuration introuvable'
    ]);
    exit;
}

try {
    // Créer une instance de Database
    $database = new Database();
    
    // Obtenir la configuration actuelle (sans mot de passe)
    $config = $database->getConfig();
    
    // Tester la connexion sans exiger qu'elle réussisse
    $is_connected = $database->testConnection();
    
    // Préparer la réponse
    $response = [
        'status' => $is_connected ? 'success' : 'error',
        'message' => $is_connected ? 'Connexion à la base de données réussie' : 'Échec de la connexion à la base de données',
        'config' => [
            'host' => $config['host'],
            'db_name' => $config['db_name'],
            'username' => $config['username'],
            'is_connected' => $is_connected
        ]
    ];
    
    // Ajouter l'erreur si la connexion a échoué
    if (!$is_connected && isset($config['error'])) {
        $response['error'] = $config['error'];
    }
    
    // Envoyer la réponse
    http_response_code($is_connected ? 200 : 500);
    echo json_encode($response);
    
} catch (Exception $e) {
    // En cas d'erreur
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du test de connexion',
        'error' => $e->getMessage()
    ]);
}
?>
