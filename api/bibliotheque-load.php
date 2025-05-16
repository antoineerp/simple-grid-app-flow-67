
<?php
// Force output buffering to prevent output before headers
ob_start();

// Initialiser la gestion de synchronisation
require_once 'services/RequestHandler.php';

// Définir les en-têtes standard
RequestHandler::setStandardHeaders("GET, OPTIONS");
RequestHandler::handleOptionsRequest();

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE bibliotheque-load.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Vérifier l'authentification
require_once 'auth-verify.php';
if (!isTokenValid()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non authentifié']);
    exit;
}

// Récupérer l'ID utilisateur
$userId = $_GET['userId'] ?? null;
$deviceId = $_GET['deviceId'] ?? 'unknown';
$forceRefresh = isset($_GET['force_refresh']) && $_GET['force_refresh'] == '1';

if (!$userId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Identifiant utilisateur requis']);
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
    
    error_log("Chargement des données de bibliothèque pour l'utilisateur: $userId");
    
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
    
    // Charger les données pour cet utilisateur
    $query = "SELECT * FROM bibliotheque WHERE userId = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$userId]);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($records) === 0) {
        error_log("Aucune donnée pour l'utilisateur $userId, vérification des données d'exemple");
        
        // Vérifier si des données modèles existent
        $adminQuery = "SELECT * FROM bibliotheque WHERE type = 'template' OR userId = 'admin'";
        $adminStmt = $db->prepare($adminQuery);
        $adminStmt->execute();
        $templateRecords = $adminStmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($templateRecords) > 0) {
            error_log("Données modèles trouvées, importation pour l'utilisateur $userId");
            
            // Importer les données modèles pour cet utilisateur
            foreach ($templateRecords as $template) {
                $insertQuery = "INSERT INTO bibliotheque (id, name, description, link, type, groupId, expanded, userId)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                $insertStmt = $db->prepare($insertQuery);
                $newId = uniqid();
                $insertStmt->execute([
                    $newId, 
                    $template['name'], 
                    $template['description'] ?? null, 
                    $template['link'] ?? null, 
                    $template['type'] ?? 'document', 
                    $template['groupId'] ?? null, 
                    $template['expanded'] ?? 0, 
                    $userId
                ]);
            }
            
            // Recharger les données après importation
            $stmt->execute([$userId]);
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            error_log("Aucune donnée modèle trouvée, création de données par défaut");
            
            // Créer des données par défaut
            $defaultData = [
                ['id' => uniqid(), 'name' => 'Documents organisationnels', 'type' => 'group', 'expanded' => 0, 'userId' => $userId],
                ['id' => uniqid(), 'name' => 'Documents administratifs', 'type' => 'group', 'expanded' => 0, 'userId' => $userId],
                ['id' => uniqid(), 'name' => 'Organigramme', 'link' => 'Voir le document', 'type' => 'document', 'userId' => $userId],
                ['id' => uniqid(), 'name' => 'Administration', 'link' => 'Voir le document', 'type' => 'document', 'userId' => $userId]
            ];
            
            // Insérer les données par défaut
            foreach ($defaultData as $item) {
                $insertQuery = "INSERT INTO bibliotheque (id, name, description, link, type, groupId, expanded, userId)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                $insertStmt = $db->prepare($insertQuery);
                $insertStmt->execute([
                    $item['id'],
                    $item['name'],
                    $item['description'] ?? null,
                    $item['link'] ?? null,
                    $item['type'] ?? 'document',
                    $item['groupId'] ?? null,
                    $item['expanded'] ?? 0,
                    $item['userId']
                ]);
            }
            
            // Recharger les données après création
            $stmt->execute([$userId]);
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    // Journal des données chargées
    error_log("Données chargées pour l'utilisateur $userId: " . count($records) . " éléments");
    
    // Renvoyer les données
    echo json_encode([
        'success' => true,
        'records' => $records
    ]);
    
} catch (Exception $e) {
    error_log("Erreur lors du chargement des données de bibliothèque: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => "Erreur lors du chargement des données: " . $e->getMessage()
    ]);
} finally {
    ob_end_flush();
}
?>
