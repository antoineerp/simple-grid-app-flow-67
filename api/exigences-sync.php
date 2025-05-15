
<?php
// Force output buffering to prevent output before headers
ob_start();

// Initialiser la gestion de synchronisation
require_once 'services/DataSyncService.php';

// Créer le service de synchronisation
$service = new DataSyncService('exigences');
$service->setStandardHeaders("POST, OPTIONS");
$service->handleOptionsRequest();

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. Utilisez POST.']);
    exit;
}

try {
    // Récupérer les données POST JSON
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$json || !$data) {
        throw new Exception("Aucune donnée reçue ou format JSON invalide");
    }
    
    error_log("Données reçues pour synchronisation des exigences");
    
    // Vérifier si les données nécessaires sont présentes
    if (!isset($data['userId'])) {
        throw new Exception("Données incomplètes. 'userId' est requis");
    }
    
    // Récupérer les données de base
    $userId = $service->sanitizeUserId($data['userId']);
    $deviceId = isset($data['deviceId']) ? $data['deviceId'] : 'unknown';
    $exigences = isset($data['exigences']) && is_array($data['exigences']) ? $data['exigences'] : [];
    $groups = isset($data['groups']) && is_array($data['groups']) ? $data['groups'] : [];
    
    error_log("Synchronisation des exigences pour l'utilisateur: {$userId} depuis l'appareil: {$deviceId}");
    error_log("Nombre d'exigences: " . count($exigences) . ", Nombre de groupes: " . count($groups));
    
    // Connexion à la base de données
    if (!$service->connectToDatabase()) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    // Nom des tables spécifiques à l'utilisateur
    $exigencesTableName = "exigences_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    $groupsTableName = "exigence_groups_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    
    // Enregistrer cette synchronisation dans l'historique
    try {
        $pdo = $service->getPdo();
        
        // Créer la table d'historique de synchronisation si elle n'existe pas
        $pdo->exec("CREATE TABLE IF NOT EXISTS `sync_history` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `table_name` VARCHAR(100) NOT NULL,
            `user_id` VARCHAR(50) NOT NULL,
            `device_id` VARCHAR(100) NOT NULL,
            `record_count` INT NOT NULL,
            `sync_timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_user_device` (`user_id`, `device_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        
        // Insérer l'enregistrement
        $stmt = $pdo->prepare("INSERT INTO `sync_history` 
                              (table_name, user_id, device_id, record_count, sync_timestamp) 
                              VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute(['exigences', $userId, $deviceId, count($exigences) + count($groups)]);
    } catch (Exception $e) {
        // Continuer même si l'enregistrement de l'historique échoue
        error_log("Erreur lors de l'enregistrement de l'historique de synchronisation: " . $e->getMessage());
    }
    
    // Créer les tables si elles n'existent pas
    
    // Table des exigences
    $createExigencesTableQuery = "CREATE TABLE IF NOT EXISTS `{$exigencesTableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `nom` VARCHAR(255) NOT NULL,
        `responsabilites` TEXT,
        `exclusion` TINYINT(1) DEFAULT 0,
        `atteinte` VARCHAR(5),
        `groupId` VARCHAR(36),
        `userId` VARCHAR(50) NOT NULL,
        `last_sync_device` VARCHAR(100) NULL,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    $pdo->exec($createExigencesTableQuery);
    
    // Table des groupes
    $createGroupsTableQuery = "CREATE TABLE IF NOT EXISTS `{$groupsTableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `name` VARCHAR(255) NOT NULL,
        `expanded` TINYINT(1) DEFAULT 1,
        `userId` VARCHAR(50) NOT NULL,
        `last_sync_device` VARCHAR(100) NULL,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    $pdo->exec($createGroupsTableQuery);
    
    // Vérifier si la colonne last_sync_device existe et l'ajouter si nécessaire
    try {
        $columnsResultExigences = $pdo->query("SHOW COLUMNS FROM `{$exigencesTableName}` LIKE 'last_sync_device'");
        if ($columnsResultExigences->rowCount() === 0) {
            $pdo->exec("ALTER TABLE `{$exigencesTableName}` ADD COLUMN `last_sync_device` VARCHAR(100) NULL");
            error_log("Colonne last_sync_device ajoutée à la table {$exigencesTableName}");
        }
        
        $columnsResultGroups = $pdo->query("SHOW COLUMNS FROM `{$groupsTableName}` LIKE 'last_sync_device'");
        if ($columnsResultGroups->rowCount() === 0) {
            $pdo->exec("ALTER TABLE `{$groupsTableName}` ADD COLUMN `last_sync_device` VARCHAR(100) NULL");
            error_log("Colonne last_sync_device ajoutée à la table {$groupsTableName}");
        }
    } catch (Exception $e) {
        error_log("Erreur lors de la vérification/ajout de la colonne last_sync_device: " . $e->getMessage());
    }
    
    // Démarrer une transaction
    $service->beginTransaction();
    
    try {
        // Supprimer les anciens enregistrements qui sont spécifiques à cet utilisateur
        // On ne supprime que les données qui viennent de cet appareil spécifique pour la résolution de conflits
        if (count($exigences) > 0) {
            $stmt = $pdo->prepare("DELETE FROM `{$exigencesTableName}` WHERE userId = ? AND (last_sync_device = ? OR last_sync_device IS NULL)");
            $stmt->execute([$userId, $deviceId]);
            error_log("Suppression des anciennes exigences pour {$userId} de l'appareil {$deviceId}");
        }
        
        if (count($groups) > 0) {
            $stmt = $pdo->prepare("DELETE FROM `{$groupsTableName}` WHERE userId = ? AND (last_sync_device = ? OR last_sync_device IS NULL)");
            $stmt->execute([$userId, $deviceId]);
            error_log("Suppression des anciens groupes pour {$userId} de l'appareil {$deviceId}");
        }
        
        // Récupérer les données des autres appareils pour fusion
        $stmt = $pdo->prepare("SELECT * FROM `{$exigencesTableName}` WHERE userId = ? AND last_sync_device != ?");
        $stmt->execute([$userId, $deviceId]);
        $otherDevicesExigences = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $stmt = $pdo->prepare("SELECT * FROM `{$groupsTableName}` WHERE userId = ? AND last_sync_device != ?");
        $stmt->execute([$userId, $deviceId]);
        $otherDevicesGroups = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Fusionner les données - commencer par créer des index par ID
        $exigencesById = [];
        foreach ($exigences as $exigence) {
            $exigencesById[$exigence['id']] = $exigence;
        }
        
        $groupsById = [];
        foreach ($groups as $group) {
            $groupsById[$group['id']] = $group;
        }
        
        // Ajouter les données des autres appareils qui n'existent pas dans les données actuelles
        foreach ($otherDevicesExigences as $otherExigence) {
            if (!isset($exigencesById[$otherExigence['id']])) {
                $exigences[] = $otherExigence;
                $exigencesById[$otherExigence['id']] = $otherExigence;
            }
        }
        
        foreach ($otherDevicesGroups as $otherGroup) {
            if (!isset($groupsById[$otherGroup['id']])) {
                $groups[] = $otherGroup;
                $groupsById[$otherGroup['id']] = $otherGroup;
            }
        }
        
        // Maintenant insérer tous les groupes
        if (count($groups) > 0) {
            $insertGroupQuery = "INSERT INTO `{$groupsTableName}` 
                (id, name, expanded, userId, last_sync_device) 
                VALUES (:id, :name, :expanded, :userId, :deviceId)";
            $stmtGroup = $pdo->prepare($insertGroupQuery);
            
            foreach ($groups as $group) {
                $stmtGroup->execute([
                    'id' => $group['id'],
                    'name' => $group['name'],
                    'expanded' => $group['expanded'] ? 1 : 0,
                    'userId' => $userId,
                    'deviceId' => $deviceId
                ]);
            }
            error_log("Groupes insérés: " . count($groups));
        }
        
        // Insérer toutes les exigences
        if (count($exigences) > 0) {
            $insertExigenceQuery = "INSERT INTO `{$exigencesTableName}` 
                (id, nom, responsabilites, exclusion, atteinte, groupId, userId, last_sync_device, date_creation) 
                VALUES (:id, :nom, :responsabilites, :exclusion, :atteinte, :groupId, :userId, :deviceId, :date_creation)";
            $stmtExigence = $pdo->prepare($insertExigenceQuery);
            
            foreach ($exigences as $exigence) {
                // Préparer les données de l'exigence
                $responsabilitesJson = isset($exigence['responsabilites']) ? 
                    (is_string($exigence['responsabilites']) ? $exigence['responsabilites'] : json_encode($exigence['responsabilites'])) : 
                    json_encode(['r' => [], 'a' => [], 'c' => [], 'i' => []]);
                
                // Convertir la date au format SQL si nécessaire
                if (isset($exigence['date_creation']) && is_string($exigence['date_creation'])) {
                    $dateCreation = date('Y-m-d H:i:s', strtotime($exigence['date_creation']));
                } else {
                    $dateCreation = date('Y-m-d H:i:s');
                }
                
                $stmtExigence->execute([
                    'id' => $exigence['id'],
                    'nom' => $exigence['nom'],
                    'responsabilites' => $responsabilitesJson,
                    'exclusion' => $exigence['exclusion'] ? 1 : 0,
                    'atteinte' => $exigence['atteinte'],
                    'groupId' => $exigence['groupId'] ?? null,
                    'userId' => $userId,
                    'deviceId' => $deviceId,
                    'date_creation' => $dateCreation
                ]);
            }
            error_log("Exigences insérées: " . count($exigences));
        }
        
        // Valider la transaction
        $service->commitTransaction();
        
        // Réponse réussie
        echo json_encode([
            'success' => true,
            'message' => 'Synchronisation réussie',
            'count' => [
                'exigences' => count($exigences),
                'groups' => count($groups)
            ],
            'deviceId' => $deviceId,
            'timestamp' => date('c')
        ]);
        
    } catch (Exception $e) {
        // Annuler la transaction en cas d'erreur
        $service->rollbackTransaction();
        throw $e;
    }
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans exigences-sync.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Exception dans exigences-sync.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($service)) {
        $service->finalize();
    }
    
    error_log("=== FIN DE L'EXÉCUTION DE exigences-sync.php ===");
    if (ob_get_level()) ob_end_flush();
}
