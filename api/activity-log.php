
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Fichier pour journaliser l'activité utilisateur
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

// Récupérer les données JSON
$data = json_decode(file_get_contents("php://input"), true);
if (!$data || !isset($data['userId']) || !isset($data['action']) || !isset($data['resourceType']) || !isset($data['resourceId'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Données incomplètes']);
    exit;
}

// Inclure les fichiers nécessaires
require_once __DIR__ . '/config/database.php';

try {
    // Initialiser la connexion à la base de données
    $database = new Database();
    $db = $database->getConnection(true);
    
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }
    
    // Vérifier si la table activity_logs existe, sinon la créer
    $query = "CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        action ENUM('create', 'update', 'delete') NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id VARCHAR(100) NOT NULL,
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $db->exec($query);
    
    // Insérer le journal d'activité
    $query = "INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details) 
              VALUES (:user_id, :action, :resource_type, :resource_id, :details)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $data['userId']);
    $stmt->bindParam(':action', $data['action']);
    $stmt->bindParam(':resource_type', $data['resourceType']);
    $stmt->bindParam(':resource_id', $data['resourceId']);
    
    // Convertir les détails en JSON
    $details = isset($data['details']) ? json_encode($data['details']) : null;
    $stmt->bindParam(':details', $details);
    
    $stmt->execute();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Activité journalisée avec succès',
        'success' => true
    ]);
    
} catch (Exception $e) {
    error_log("Erreur lors de la journalisation de l'activité: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Erreur serveur: ' . $e->getMessage(),
        'success' => false
    ]);
}
?>
