
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Request-ID, X-Client-Source");

// Vérifier que PHP s'exécute correctement
$php_check = ['php_executing' => true, 'timestamp' => time()];

// Extraire l'ID de requête des en-têtes ou du corps de la requête
$requestBody = file_get_contents('php://input');
$requestData = json_decode($requestBody, true);
$requestId = $requestData['requestId'] ?? $_SERVER['HTTP_X_REQUEST_ID'] ?? 'no-id';
$clientSource = $_SERVER['HTTP_X_CLIENT_SOURCE'] ?? 'unknown';
$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown-ip';

// Log des requêtes
error_log("📝 API [{$requestId}] - Requête user-profile-sync reçue - " . date('Y-m-d H:i:s') . " - Source: {$clientSource} - IP: {$clientIp}");
error_log("📝 API [{$requestId}] - Headers: " . json_encode(getallheaders()));

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK', 'php_check' => $php_check]);
    exit;
}

// Gérer uniquement les requêtes POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("❌ API [{$requestId}] - Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée', 'php_check' => $php_check]);
    exit;
}

// Récupérer les données POST
$input = $requestBody;
$data = $requestData;

// Vérifier que les données sont valides
if (!$data || !isset($data['userId']) || !isset($data['userData'])) {
    error_log("❌ API [{$requestId}] - Données invalides pour user-profile-sync");
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Données invalides', 'php_check' => $php_check]);
    exit;
}

// Normaliser l'ID utilisateur en minuscules
$userId = strtolower($data['userId']);

// Journaliser la requête avec détails
error_log("👤 API [{$requestId}] - Synchronisation du profil pour l'utilisateur: " . $userId);
error_log("🕒 API [{$requestId}] - Timestamp de la requête: " . ($data['timestamp'] ?? 'Non spécifié'));
error_log("📊 API [{$requestId}] - Nombre de clés à synchroniser: " . count($data['userData']));

try {
    // Inclure la configuration de la base de données
    require_once 'config/database.php';
    $database = new Database();
    $conn = $database->getConnection();

    // Vérifier si la connexion est établie
    if (!$database->is_connected) {
        $errorDetails = ($database->connection_error ?? "Erreur inconnue");
        error_log("❌ API [{$requestId}] - Erreur de connexion à la base de données: " . $errorDetails);
        throw new Exception("Erreur de connexion à la base de données: " . $errorDetails);
    }

    // Créer la table des profils utilisateurs si elle n'existe pas
    $tableName = "user_profiles_" . preg_replace('/[^a-z0-9_]/i', '_', $userId);
    error_log("🗄️ API [{$requestId}] - Table cible: {$tableName}");
    
    $createTableSQL = "CREATE TABLE IF NOT EXISTS `$tableName` (
        `key` varchar(50) NOT NULL,
        `value` text NOT NULL,
        `updated_at` datetime NOT NULL,
        PRIMARY KEY (`key`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $stmt = $conn->prepare($createTableSQL);
    $stmt->execute();

    // Exécuter une transaction pour assurer l'intégrité des données
    $conn->beginTransaction();

    // Pour chaque clé dans userData, insérer ou mettre à jour la valeur
    foreach ($data['userData'] as $key => $value) {
        $sql = "INSERT INTO `$tableName` (`key`, `value`, `updated_at`) 
                VALUES (:key, :value, NOW())
                ON DUPLICATE KEY UPDATE
                `value` = VALUES(`value`),
                `updated_at` = VALUES(`updated_at`)";
        
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':key', $key);
        
        // Si la valeur est un objet ou un tableau, la convertir en JSON
        if (is_array($value) || is_object($value)) {
            $value = json_encode($value);
        }
        
        $stmt->bindParam(':value', $value);
        $stmt->execute();
        
        error_log("✅ API [{$requestId}] - Clé '{$key}' synchronisée pour l'utilisateur: {$userId}");
    }

    // Valider la transaction
    $conn->commit();

    // Vérifier que les données ont bien été enregistrées
    $verificationSQL = "SELECT COUNT(*) FROM `$tableName`";
    $stmt = $conn->prepare($verificationSQL);
    $stmt->execute();
    $count = $stmt->fetchColumn();
    
    error_log("✅ API [{$requestId}] - Profil utilisateur synchronisé avec succès pour: " . $userId . " - Entrées totales: " . $count);
    http_response_code(200);
    echo json_encode([
        'success' => true, 
        'message' => 'Profil utilisateur synchronisé avec succès',
        'timestamp' => date('Y-m-d H:i:s'),
        'requestId' => $requestId,
        'entriesCount' => $count,
        'php_check' => $php_check
    ]);
    
} catch (Exception $e) {
    // En cas d'erreur, annuler toute modification en cours
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    
    error_log("❌ API [{$requestId}] - Erreur lors de la synchronisation du profil: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Erreur serveur: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s'),
        'requestId' => $requestId,
        'php_check' => $php_check
    ]);
}
?>
