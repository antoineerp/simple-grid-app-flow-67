
<?php
// Force output buffering to prevent output before headers
ob_start();

// Initialiser la gestion de synchronisation
require_once 'services/DataSyncService.php';

// Créer le service de synchronisation
$service = new DataSyncService('exigences');
$service->setStandardHeaders("GET, OPTIONS");
$service->handleOptionsRequest();

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. Utilisez GET.']);
    exit;
}

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Vérifier si l'userId est présent
    $userId = "";
    
    if (isset($_GET['userId']) && !empty($_GET['userId'])) {
        $userId = $service->sanitizeUserId($_GET['userId']);
    } else {
        error_log("UserId manquant dans la requête");
        throw new Exception("UserId manquant");
    }
    
    // Récupérer l'ID de l'appareil s'il est fourni
    $deviceId = isset($_GET['deviceId']) ? $_GET['deviceId'] : 'unknown';
    
    error_log("Chargement des exigences pour l'utilisateur: {$userId} depuis l'appareil: {$deviceId}");
    
    // Connexion à la base de données
    if (!$service->connectToDatabase()) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    // Nom des tables spécifiques à l'utilisateur
    $exigencesTableName = "exigences_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    $groupsTableName = "exigence_groups_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    error_log("Tables à consulter: {$exigencesTableName}, {$groupsTableName}");
    
    // Obtenir une référence PDO
    $pdo = $service->getPdo();
    
    // Vérifier si les tables existent
    $exigencesTableExists = false;
    $groupsTableExists = false;
    
    // Utiliser information_schema pour vérifier l'existence des tables
    $dbName = $pdo->query("SELECT DATABASE()")->fetchColumn();
    $tableExistsQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?";
    $stmt = $pdo->prepare($tableExistsQuery);
    
    // Vérifier la table des exigences
    $stmt->execute([$dbName, $exigencesTableName]);
    $exigencesTableExists = (int)$stmt->fetchColumn() > 0;
    
    // Vérifier la table des groupes
    $stmt->execute([$dbName, $groupsTableName]);
    $groupsTableExists = (int)$stmt->fetchColumn() > 0;
    
    // Enregistrer cette requête de chargement
    try {
        // Créer la table d'historique si elle n'existe pas
        $pdo->exec("CREATE TABLE IF NOT EXISTS `sync_history` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `table_name` VARCHAR(100) NOT NULL,
            `user_id` VARCHAR(50) NOT NULL,
            `device_id` VARCHAR(100) NOT NULL,
            `record_count` INT NOT NULL,
            `operation` VARCHAR(50) DEFAULT 'sync',
            `sync_timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_user_device` (`user_id`, `device_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        
        // Insérer l'enregistrement de chargement
        $stmt = $pdo->prepare("INSERT INTO `sync_history` 
                              (table_name, user_id, device_id, record_count, operation, sync_timestamp) 
                              VALUES (?, ?, ?, 0, 'load', NOW())");
        $stmt->execute(['exigences', $userId, $deviceId]);
    } catch (Exception $e) {
        // Continuer même si l'enregistrement échoue
        error_log("Erreur lors de l'enregistrement de l'historique de chargement: " . $e->getMessage());
    }
    
    // Initialiser les résultats
    $exigences = [];
    $groups = [];
    
    // Récupérer les exigences si la table existe
    if ($exigencesTableExists) {
        $query = "SELECT * FROM `{$exigencesTableName}` WHERE userId = ? ORDER BY id";
        error_log("Exécution de la requête: {$query}");
        $stmt = $pdo->prepare($query);
        $stmt->execute([$userId]);
        $exigences = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Formater les données pour le client
        foreach ($exigences as &$exigence) {
            // Convertir les dates
            if (isset($exigence['date_creation']) && $exigence['date_creation']) {
                $exigence['date_creation'] = date('Y-m-d\TH:i:s', strtotime($exigence['date_creation']));
            }
            if (isset($exigence['date_modification']) && $exigence['date_modification']) {
                $exigence['date_modification'] = date('Y-m-d\TH:i:s', strtotime($exigence['date_modification']));
            }
            
            // Convertir les responsabilités stockées en JSON
            if (isset($exigence['responsabilites']) && $exigence['responsabilites']) {
                $exigence['responsabilites'] = json_decode($exigence['responsabilites'], true);
            } else {
                $exigence['responsabilites'] = [
                    'r' => [],
                    'a' => [],
                    'c' => [],
                    'i' => []
                ];
            }
            
            // Convertir les booléens
            if (isset($exigence['exclusion'])) {
                $exigence['exclusion'] = (bool)$exigence['exclusion'];
            }
            
            // S'assurer que chaque exigence a un userId
            if (!isset($exigence['userId'])) {
                $exigence['userId'] = $userId;
            }
        }
    } else {
        // Créer la table si elle n'existe pas
        $createExigencesTable = "CREATE TABLE IF NOT EXISTS `{$exigencesTableName}` (
            `id` VARCHAR(36) NOT NULL PRIMARY KEY,
            `nom` VARCHAR(255) NOT NULL,
            `responsabilites` TEXT,
            `exclusion` TINYINT(1) DEFAULT 0,
            `atteinte` ENUM('NC', 'PC', 'C') NULL,
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            `groupId` VARCHAR(36) NULL,
            `userId` VARCHAR(50) NOT NULL,
            `last_sync_device` VARCHAR(100) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($createExigencesTable);
        error_log("Table {$exigencesTableName} créée");
    }
    
    // Récupérer les groupes si la table existe
    if ($groupsTableExists) {
        $query = "SELECT * FROM `{$groupsTableName}` WHERE userId = ? ORDER BY id";
        error_log("Exécution de la requête: {$query}");
        $stmt = $pdo->prepare($query);
        $stmt->execute([$userId]);
        $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Formater les données pour le client
        foreach ($groups as &$group) {
            // Convertir les booléens
            if (isset($group['expanded'])) {
                $group['expanded'] = (bool)$group['expanded'];
            }
            
            // S'assurer que chaque groupe a un userId
            if (!isset($group['userId'])) {
                $group['userId'] = $userId;
            }
        }
    } else {
        // Créer la table si elle n'existe pas
        $createGroupsTable = "CREATE TABLE IF NOT EXISTS `{$groupsTableName}` (
            `id` VARCHAR(36) NOT NULL PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `expanded` TINYINT(1) DEFAULT 1,
            `userId` VARCHAR(50) NOT NULL,
            `last_sync_device` VARCHAR(100) NULL,
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($createGroupsTable);
        error_log("Table {$groupsTableName} créée");
    }
    
    error_log("Exigences récupérées: " . count($exigences) . ", Groupes récupérés: " . count($groups));
    echo json_encode([
        'success' => true,
        'exigences' => $exigences,
        'groups' => $groups,
        'count' => [
            'exigences' => count($exigences),
            'groups' => count($groups)
        ],
        'timestamp' => date('c'),
        'deviceId' => $deviceId
    ]);
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans exigences-load.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Exception dans exigences-load.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($service)) {
        $service->finalize();
    }
    
    error_log("=== FIN DE L'EXÉCUTION DE exigences-load.php ===");
    if (ob_get_level()) ob_end_flush();
}
