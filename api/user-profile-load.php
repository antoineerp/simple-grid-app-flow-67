
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Log des requêtes
error_log("📝 API - Requête user-profile-load reçue - " . date('Y-m-d H:i:s'));

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Gérer uniquement les requêtes GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_log("❌ API - Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

// Récupérer l'ID utilisateur
$userId = isset($_GET['userId']) ? $_GET['userId'] : null;

if (!$userId) {
    error_log("❌ API - ID utilisateur manquant pour user-profile-load");
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID utilisateur requis']);
    exit;
}

// Journaliser la requête
error_log("👤 API - Chargement du profil pour l'utilisateur: " . $userId);

try {
    // Inclure la configuration de la base de données
    require_once 'config/database.php';
    $database = new Database();
    $conn = $database->getConnection();

    // Vérifier si la connexion est établie
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }

    // Nom de la table des profils pour cet utilisateur
    $tableName = "user_profiles_" . preg_replace('/[^a-z0-9_]/i', '_', $userId);
    
    // Vérifier si la table existe
    $stmt = $conn->prepare("SHOW TABLES LIKE :tableName");
    $stmt->bindParam(':tableName', $tableName);
    $stmt->execute();
    
    $userData = [];
    
    if ($stmt->rowCount() > 0) {
        // Récupérer toutes les données du profil
        $sql = "SELECT `key`, `value`, `updated_at` FROM `$tableName`";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $key = $row['key'];
            $value = $row['value'];
            
            // Essayer de convertir en JSON si possible
            $jsonValue = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $userData[$key] = $jsonValue;
            } else {
                $userData[$key] = $value;
            }
        }
        
        error_log("✅ API - Profil utilisateur chargé avec succès pour: " . $userId);
    } else {
        error_log("ℹ️ API - Aucune table de profil trouvée pour: " . $userId);
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'userData' => $userData,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    error_log("❌ API - Erreur lors du chargement du profil: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Erreur serveur: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
