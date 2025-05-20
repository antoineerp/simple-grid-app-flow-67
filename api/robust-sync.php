
<?php
// En-têtes pour garantir le bon format de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation pour le débogage
error_log("=== DÉBUT DE L'EXÉCUTION DE robust-sync.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Vérification de la requête pour s'assurer que c'est du POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée. Utilisez POST.'
    ]);
    exit;
}

// Récupération des données JSON
$input = file_get_contents('php://input');

if (empty($input)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Aucune donnée reçue'
    ]);
    exit;
}

// Tentative de décodage du JSON
try {
    $data = json_decode($input, true, 512, JSON_THROW_ON_ERROR);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Format JSON invalide: ' . $e->getMessage(),
        'input' => substr($input, 0, 100) . '...'
    ]);
    exit;
}

// Vérification des champs requis
if (!isset($data['userId']) || !isset($data['tableName'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Données incomplètes. userId et tableName sont requis.'
    ]);
    exit;
}

$userId = $data['userId'];
$tableName = $data['tableName'];
$records = isset($data['records']) ? $data['records'] : [];

error_log("Synchronisation pour l'utilisateur: {$userId}");
error_log("Table à synchroniser: {$tableName}");
error_log("Nombre d'enregistrements: " . count($records));

// Configuration de la base de données
$host = "p71x6d.myd.infomaniak.com";
$dbname = "p71x6d_system";
$username = "p71x6d_system";
$password = "Trottinette43!";

try {
    // Connexion à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    error_log("Connexion à la base de données réussie");
    
    // Sanitization du nom de table et de l'utilisateur pour éviter les injections SQL
    $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    $safeTableName = preg_replace('/[^a-zA-Z0-9_]/', '_', $tableName);
    
    // Nom complet de la table spécifique à l'utilisateur
    $fullTableName = "{$safeTableName}_{$safeUserId}";
    
    // Vérifier si la table existe, sinon la créer avec une structure flexible
    $pdo->exec("CREATE TABLE IF NOT EXISTS `{$fullTableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `data` JSON NOT NULL,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    
    error_log("Table {$fullTableName} vérifiée/créée");
    
    // Option de synchronisation: tronquer et recréer ou mise à jour intelligente
    $syncMode = isset($data['syncMode']) ? $data['syncMode'] : 'full';
    
    if ($syncMode === 'full') {
        // Synchronisation complète: tronquer la table et réinsérer toutes les données
        $pdo->exec("TRUNCATE TABLE `{$fullTableName}`");
        error_log("Table {$fullTableName} vidée pour synchronisation complète");
        
        if (!empty($records)) {
            // Préparation de la requête d'insertion
            $stmt = $pdo->prepare("INSERT INTO `{$fullTableName}` (id, data) VALUES (?, ?)");
            
            // Compteur de succès pour le reporting
            $successCount = 0;
            
            foreach ($records as $record) {
                if (!isset($record['id'])) {
                    error_log("Enregistrement sans ID ignoré");
                    continue;
                }
                
                try {
                    $recordId = $record['id'];
                    $recordJson = json_encode($record);
                    $stmt->execute([$recordId, $recordJson]);
                    $successCount++;
                } catch (Exception $e) {
                    error_log("Erreur lors de l'insertion de l'enregistrement {$recordId}: " . $e->getMessage());
                }
            }
            
            error_log("{$successCount} enregistrements insérés avec succès");
        }
    } else {
        // Synchronisation incrémentale: mettre à jour ou insérer les enregistrements
        if (!empty($records)) {
            // Requêtes préparées pour insertion et mise à jour
            $insertStmt = $pdo->prepare("INSERT INTO `{$fullTableName}` (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = ?");
            $selectStmt = $pdo->prepare("SELECT 1 FROM `{$fullTableName}` WHERE id = ?");
            
            // Compteurs pour le reporting
            $insertedCount = 0;
            $updatedCount = 0;
            
            foreach ($records as $record) {
                if (!isset($record['id'])) {
                    error_log("Enregistrement sans ID ignoré");
                    continue;
                }
                
                try {
                    $recordId = $record['id'];
                    $recordJson = json_encode($record);
                    
                    // Vérifier si l'enregistrement existe
                    $selectStmt->execute([$recordId]);
                    $exists = $selectStmt->fetch();
                    
                    // Insérer ou mettre à jour
                    $insertStmt->execute([$recordId, $recordJson, $recordJson]);
                    
                    if ($exists) {
                        $updatedCount++;
                    } else {
                        $insertedCount++;
                    }
                } catch (Exception $e) {
                    error_log("Erreur lors du traitement de l'enregistrement {$recordId}: " . $e->getMessage());
                }
            }
            
            error_log("{$insertedCount} enregistrements insérés, {$updatedCount} mis à jour");
        }
    }
    
    // Réponse de succès
    echo json_encode([
        'success' => true,
        'message' => "Synchronisation de {$tableName} réussie pour l'utilisateur {$userId}",
        'count' => count($records),
        'timestamp' => date('c'),
        'tableName' => $tableName,
        'userId' => $userId
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

error_log("=== FIN DE L'EXÉCUTION DE robust-sync.php ===");
?>
