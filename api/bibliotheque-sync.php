
<?php
// Force output buffering to prevent output before headers
ob_start();

// Initialiser la gestion de synchronisation
require_once 'services/RequestHandler.php';

// Définir les en-têtes standard
RequestHandler::setStandardHeaders("POST, OPTIONS");
RequestHandler::handleOptionsRequest();

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE bibliotheque-sync.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Vérifier l'authentification
require_once 'auth-verify.php';
if (!isTokenValid()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non authentifié']);
    exit;
}

// Récupérer les données POST
$requestData = json_decode(file_get_contents("php://input"), true);

$userId = $requestData['userId'] ?? null;
$deviceId = $requestData['deviceId'] ?? 'unknown';
$records = $requestData['records'] ?? [];

if (!$userId || empty($records)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Données requises manquantes']);
    exit;
}

// Obtenir une connexion à la base de données
require_once 'config/database.php';
$database = new Database();
$db = $database->getConnection();

try {
    if (!$db) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    error_log("Synchronisation des données de bibliothèque pour l'utilisateur: $userId (" . count($records) . " éléments)");
    
    // Vérifier si la table existe
    $tableCheck = $db->query("SHOW TABLES LIKE 'bibliotheque'");
    $tableExists = $tableCheck !== false && $tableCheck->rowCount() > 0;
    
    if (!$tableExists) {
        error_log("La table bibliotheque n'existe pas, création...");
        
        // Créer la table
        $createTableSql = "CREATE TABLE IF NOT EXISTS `bibliotheque` (
            `id` VARCHAR(255) NOT NULL,
            `name` VARCHAR(255) NOT NULL,
            `description` TEXT NULL,
            `link` VARCHAR(255) NULL,
            `type` VARCHAR(50) NOT NULL DEFAULT 'document',
            `groupId` VARCHAR(255) NULL,
            `expanded` TINYINT(1) NULL DEFAULT 0,
            `userId` VARCHAR(255) NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`, `userId`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
        
        $db->exec($createTableSql);
        error_log("Table bibliotheque créée avec succès");
    }
    
    // Supprimer les enregistrements existants pour cet utilisateur
    $deleteQuery = "DELETE FROM bibliotheque WHERE userId = ?";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->execute([$userId]);
    
    error_log("Données existantes supprimées pour l'utilisateur $userId");
    
    // Insérer les nouveaux enregistrements
    $insertQuery = "INSERT INTO bibliotheque (id, name, description, link, type, groupId, expanded, userId)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $insertStmt = $db->prepare($insertQuery);
    
    $db->beginTransaction();
    
    $successCount = 0;
    
    foreach ($records as $record) {
        try {
            $insertStmt->execute([
                $record['id'] ?? uniqid(),
                $record['name'] ?? '',
                $record['description'] ?? null,
                $record['link'] ?? null,
                $record['type'] ?? 'document',
                $record['groupId'] ?? null,
                $record['expanded'] ?? 0,
                $userId  // Assurer que l'userId est toujours celui de l'utilisateur authentifié
            ]);
            $successCount++;
        } catch (Exception $e) {
            error_log("Erreur lors de l'insertion de l'enregistrement: " . $e->getMessage());
            continue;
        }
    }
    
    $db->commit();
    
    error_log("Synchronisation réussie pour l'utilisateur $userId: $successCount éléments insérés");
    
    // Si l'utilisateur est admin, copier les données comme modèle
    $tokenData = getTokenData();
    $userRole = $tokenData['user']['role'] ?? '';
    
    if ($userRole === 'admin' || $userRole === 'administrateur') {
        error_log("Utilisateur avec rôle administrateur détecté, sauvegarde des données comme modèle");
        
        // Supprimer les anciens modèles
        $deleteTemplateQuery = "DELETE FROM bibliotheque WHERE userId = 'admin' OR type = 'template'";
        $db->exec($deleteTemplateQuery);
        
        // Copier les données comme modèle
        $copyQuery = "INSERT INTO bibliotheque (id, name, description, link, type, groupId, expanded, userId) 
                     SELECT CONCAT('template_', id), name, description, link, 'template', groupId, expanded, 'admin' 
                     FROM bibliotheque 
                     WHERE userId = ?";
        $copyStmt = $db->prepare($copyQuery);
        $copyStmt->execute([$userId]);
        
        error_log("Données copiées comme modèle pour les futurs utilisateurs");
    }
    
    // Renvoyer une réponse de succès
    echo json_encode([
        'success' => true,
        'message' => 'Données synchronisées avec succès',
        'count' => $successCount
    ]);
    
} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    
    error_log("Erreur lors de la synchronisation des données de bibliothèque: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => "Erreur lors de la synchronisation des données: " . $e->getMessage()
    ]);
} finally {
    ob_end_flush();
}
?>
