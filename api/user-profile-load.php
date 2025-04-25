
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Request-ID, X-Client-Source");

// Log des requêtes
$requestId = $_GET['requestId'] ?? $_SERVER['HTTP_X_REQUEST_ID'] ?? 'no-id';
$clientSource = $_SERVER['HTTP_X_CLIENT_SOURCE'] ?? 'unknown';
$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown-ip';
error_log("📝 API [{$requestId}] - Requête user-profile-load reçue - " . date('Y-m-d H:i:s') . " - Source: {$clientSource} - IP: {$clientIp}");
error_log("📝 API [{$requestId}] - Headers: " . json_encode(getallheaders()));
error_log("📝 API [{$requestId}] - GET params: " . json_encode($_GET));

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Gérer uniquement les requêtes GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_log("❌ API [{$requestId}] - Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

// Récupérer l'ID utilisateur
$userId = isset($_GET['userId']) ? $_GET['userId'] : null;

if (!$userId) {
    error_log("❌ API [{$requestId}] - ID utilisateur manquant pour user-profile-load");
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID utilisateur requis']);
    exit;
}

// Journaliser la requête
error_log("👤 API [{$requestId}] - Chargement du profil pour l'utilisateur: " . $userId);

try {
    // Inclure la configuration de la base de données
    require_once 'config/database.php';
    $database = new Database();
    $conn = $database->getConnection();

    // Vérifier si la connexion est établie
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }

    // Nom de la table des profils pour cet utilisateur - Normaliser pour éviter les problèmes de nommage
    $tableName = "user_profiles_" . preg_replace('/[^a-z0-9_]/i', '_', strtolower($userId));
    error_log("🗄️ API [{$requestId}] - Recherche dans la table: {$tableName}");
    
    // Vérifier si la table existe
    $stmt = $conn->prepare("SHOW TABLES LIKE :tableName");
    $stmt->bindParam(':tableName', $tableName);
    $stmt->execute();
    
    $userData = [];
    
    if ($stmt->rowCount() > 0) {
        // La table existe, récupérer toutes les données du profil
        error_log("✅ API [{$requestId}] - Table {$tableName} trouvée");
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
                error_log("📄 API [{$requestId}] - Clé chargée (JSON): {$key}");
            } else {
                $userData[$key] = $value;
                error_log("📄 API [{$requestId}] - Clé chargée (texte): {$key}");
            }
        }
        
        error_log("✅ API [{$requestId}] - Profil utilisateur chargé avec succès pour: " . $userId . " - Entrées: " . count($userData));
    } else {
        // La table n'existe pas encore, aucune donnée à charger
        error_log("ℹ️ API [{$requestId}] - Aucune table de profil trouvée pour: " . $userId);
    }

    // Répondre avec les données chargées ou un objet vide
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'userData' => $userData,
        'timestamp' => date('Y-m-d H:i:s'),
        'requestId' => $requestId
    ]);
    
} catch (Exception $e) {
    error_log("❌ API [{$requestId}] - Erreur lors du chargement du profil: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Erreur serveur: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s'),
        'requestId' => $requestId
    ]);
}
?>
