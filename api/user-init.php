
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Fichier pour initialiser les données d'un utilisateur
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] != 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Méthode non autorisée']);
    exit;
}

// Inclure les fichiers nécessaires
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/models/User.php';
require_once __DIR__ . '/services/TableManager.php';

// Récupérer les données JSON
$data = json_decode(file_get_contents("php://input"), true);
if (!$data || !isset($data['userId'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Identifiant utilisateur manquant']);
    exit;
}

$userId = $data['userId'];

// Vérifier le format de l'identifiant utilisateur
if (empty($userId) || strpos($userId, 'p71x6d_') !== 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Format d\'identifiant utilisateur invalide']);
    exit;
}

try {
    // Initialiser la connexion à la base de données
    $database = new Database();
    $db = $database->getConnection(true);
    
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }
    
    // Initialiser l'objet utilisateur
    $user = new User($db);
    
    // Initialiser les données de l'utilisateur
    $result = $user->initializeUserDataFromManager($userId);
    
    if ($result) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Données utilisateur initialisées avec succès',
            'success' => true
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Échec de l\'initialisation des données utilisateur',
            'success' => false
        ]);
    }
    
} catch (Exception $e) {
    error_log("Erreur lors de l'initialisation des données utilisateur: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Erreur serveur: ' . $e->getMessage(),
        'success' => false
    ]);
}
?>
