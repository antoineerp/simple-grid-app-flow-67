
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Fichier pour vérifier l'existence d'une table pour un utilisateur
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] != 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Méthode non autorisée']);
    exit;
}

// Vérifier les paramètres
if (!isset($_GET['userId']) || !isset($_GET['table'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Paramètres manquants']);
    exit;
}

$userId = $_GET['userId'];
$tableName = $_GET['table'];

// Vérifier le format de l'identifiant utilisateur
if (empty($userId) || strpos($userId, 'p71x6d_') !== 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Format d\'identifiant utilisateur invalide']);
    exit;
}

// Sécuriser le nom de table
$tableName = preg_replace('/[^a-z0-9_]/i', '', $tableName);
$fullTableName = $tableName . '_' . str_replace('-', '_', $userId);

try {
    // Inclure les fichiers nécessaires
    require_once __DIR__ . '/config/database.php';
    
    // Initialiser la connexion à la base de données
    $database = new Database();
    $db = $database->getConnection(true);
    
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }
    
    // Vérifier si la table existe
    $query = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :table_name";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':table_name', $fullTableName);
    $stmt->execute();
    
    $exists = $stmt->fetchColumn() > 0;
    
    echo json_encode([
        'status' => 'success',
        'exists' => $exists,
        'table' => $fullTableName
    ]);
    
} catch (Exception $e) {
    error_log("Erreur lors de la vérification de l'existence de la table: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?>
