
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DÉBUT TEST DE SYNCHRONISATION ===");

// Gestion des requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success']);
    exit;
}

try {
    // Récupérer les données JSON
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$json || !$data) {
        throw new Exception("Aucune donnée reçue ou format JSON invalide");
    }
    
    // Vérifier les champs requis
    if (!isset($data['userId'])) {
        throw new Exception("L'ID utilisateur est requis");
    }
    
    $userId = $data['userId'];
    $test_table = isset($data['test_table']) ? $data['test_table'] : [];
    
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
    
    // Créer la table si elle n'existe pas
    $pdo->exec("CREATE TABLE IF NOT EXISTS `{$tableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `name` VARCHAR(255) NOT NULL,
        `value` TEXT,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    
    // Tronquer la table pour une synchronisation complète
    $pdo->exec("TRUNCATE TABLE `{$tableName}`");
    
    // Insérer les nouvelles données
    if (!empty($test_table)) {
        $stmt = $pdo->prepare("INSERT INTO `{$tableName}` (id, name, value) VALUES (?, ?, ?)");
        
        foreach ($test_table as $item) {
            $stmt->execute([
                $item['id'],
                $item['name'],
                $item['value']
            ]);
        }
    }
    
    // Réponse réussie
    echo json_encode([
        'success' => true,
        'message' => 'Données synchronisées avec succès',
        'count' => count($test_table)
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

error_log("=== FIN TEST DE SYNCHRONISATION ===");
?>
