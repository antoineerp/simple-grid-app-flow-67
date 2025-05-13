
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DÉBUT CHARGEMENT DE DONNÉES TEST ===");

// Gestion des requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success']);
    exit;
}

try {
    // Vérifier si l'ID utilisateur est présent
    if (!isset($_GET['userId'])) {
        throw new Exception("L'ID utilisateur est requis");
    }
    
    $userId = $_GET['userId'];
    
    // Configuration de la base de données
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_system";
    $password = "Trottinette43!";
    
    // Connexion à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    // Nom de la table spécifique à l'utilisateur
    $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    $tableName = "test_table_{$safeUserId}";
    
    // Vérifier si la table existe
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = ? AND table_name = ?
    ");
    $stmt->execute([$dbname, $tableName]);
    $tableExists = (bool)$stmt->fetchColumn();
    
    $data = [];
    
    if ($tableExists) {
        // Récupérer les données
        $stmt = $pdo->query("SELECT id, name, value FROM `{$tableName}`");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        // Créer la table pour la prochaine fois
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$tableName}` (
            `id` VARCHAR(36) PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `value` TEXT,
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");
    }
    
    // Renvoyer les données
    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
    
} catch (PDOException $e) {
    error_log("Erreur PDO: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Erreur: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

error_log("=== FIN CHARGEMENT DE DONNÉES TEST ===");
?>
