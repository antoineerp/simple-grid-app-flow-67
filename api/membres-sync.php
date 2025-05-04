
<?php
// Force output buffering to prevent output before headers
ob_start();

// Initialiser la gestion de synchronisation
require_once 'services/DataSyncService.php';
require_once 'services/RequestHandler.php';

// Nom de la table à synchroniser
$tableName = 'membres';

// Créer le service de synchronisation
$service = new DataSyncService($tableName);

// Définir les en-têtes standard
RequestHandler::setStandardHeaders("POST, OPTIONS");
RequestHandler::handleOptionsRequest();

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    RequestHandler::handleError('Méthode non autorisée. Utilisez POST.', 405);
}

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Récupérer les données POST JSON
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$json || !$data) {
        throw new Exception("Aucune donnée reçue ou format JSON invalide");
    }
    
    error_log("Données reçues pour synchronisation des membres");
    
    // Vérifier si les données nécessaires sont présentes
    if (!isset($data['userId']) || !isset($data['membres'])) {
        throw new Exception("Données incomplètes. 'userId' et 'membres' sont requis");
    }
    
    // Récupérer les données
    $userId = RequestHandler::sanitizeUserId($data['userId']);
    $membres = $data['membres'];
    $deviceId = isset($data['deviceId']) ? $data['deviceId'] : RequestHandler::getDeviceId();
    
    error_log("Synchronisation pour l'utilisateur: {$userId} depuis l'appareil: {$deviceId}");
    error_log("Nombre de membres: " . count($membres));
    
    // Connexion à la base de données
    if (!$service->connectToDatabase()) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    // Nom de la table spécifique à l'utilisateur
    $userTableName = "{$tableName}_" . $userId;
    
    // Obtenir une référence PDO
    $pdo = $service->getPdo();
    
    // Enregistrer cette synchronisation dans l'historique
    $service->recordSyncOperation($userId, $deviceId, 'sync', count($membres));
    
    // Schéma de la table membres
    $schema = "CREATE TABLE IF NOT EXISTS `{$userTableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `nom` VARCHAR(100) NOT NULL,
        `prenom` VARCHAR(100) NOT NULL,
        `email` VARCHAR(255) NULL,
        `telephone` VARCHAR(20) NULL,
        `fonction` VARCHAR(100) NULL,
        `organisation` VARCHAR(255) NULL,
        `notes` TEXT NULL,
        `initiales` VARCHAR(10) NULL,
        `userId` VARCHAR(50) NOT NULL,
        `mot_de_passe` VARCHAR(255) NULL,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        `last_sync_device` VARCHAR(100) NULL
    )";
    
    // Créer la table si nécessaire
    $pdo->exec($schema);
    
    // Démarrer une transaction
    $service->beginTransaction();
    
    try {
        // Standardiser les IDs - S'assurer que tous les membres ont des IDs au format UUID
        foreach ($membres as $key => $membre) {
            // Vérifier si l'ID est un simple nombre ou un format non-UUID
            if (isset($membre['id'])) {
                $id = $membre['id'];
                // Si c'est un nombre ou un ID court (moins de 32 caractères)
                if (is_numeric($id) || strlen($id) < 32 || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id)) {
                    // Générer un UUID v4 pour remplacer l'ID
                    $newId = $service->generateUuid();
                    error_log("Conversion d'ID: {$id} -> {$newId}");
                    
                    // Stocker la relation entre l'ancien et le nouvel ID pour référence future
                    try {
                        $pdo->exec("CREATE TABLE IF NOT EXISTS `id_mapping` (
                            `id` INT AUTO_INCREMENT PRIMARY KEY,
                            `original_id` VARCHAR(100) NOT NULL,
                            `uuid_id` VARCHAR(36) NOT NULL,
                            `table_name` VARCHAR(50) NOT NULL,
                            `user_id` VARCHAR(50) NOT NULL,
                            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            UNIQUE KEY `uniq_mapping` (`original_id`, `table_name`, `user_id`)
                        )");
                        
                        $mapStmt = $pdo->prepare("INSERT IGNORE INTO `id_mapping` (original_id, uuid_id, table_name, user_id) VALUES (?, ?, ?, ?)");
                        $mapStmt->execute([$id, $newId, $tableName, $userId]);
                    } catch (Exception $e) {
                        error_log("Erreur lors du mappage d'ID: " . $e->getMessage());
                    }
                    
                    // Mettre à jour l'ID dans le tableau
                    $membres[$key]['id'] = $newId;
                }
            } else {
                // Si le membre n'a pas d'ID, en générer un
                $membres[$key]['id'] = $service->generateUuid();
            }
            
            // Assigner le deviceId comme dernier appareil de synchronisation
            $membres[$key]['last_sync_device'] = $deviceId;
        }
        
        // Supprimer les membres qui viennent de cet appareil pour les remplacer
        $stmt = $pdo->prepare("DELETE FROM `{$userTableName}` WHERE userId = ? AND (last_sync_device = ? OR last_sync_device IS NULL)");
        $stmt->execute([$userId, $deviceId]);
        
        // Insérer les membres
        foreach ($membres as $membre) {
            $columns = [];
            $placeholders = [];
            $values = [];
            
            foreach ($membre as $key => $value) {
                // Ignorer les champs vides ou null
                if ($value !== null && $value !== '') {
                    $columns[] = "`$key`";
                    $placeholders[] = "?";
                    $values[] = $value;
                }
            }
            
            if (!empty($columns)) {
                $insertQuery = "INSERT INTO `{$userTableName}` (" . implode(", ", $columns) . ") VALUES (" . implode(", ", $placeholders) . ")";
                $insertStmt = $pdo->prepare($insertQuery);
                $insertStmt->execute($values);
            }
        }
        
        // Valider la transaction
        $service->commitTransaction();
        
        // Réponse réussie
        RequestHandler::sendJsonResponse(true, 'Synchronisation des membres réussie', [
            'count' => count($membres),
            'deviceId' => $deviceId,
            'tableName' => $tableName,
            'standardized_ids' => true
        ]);
        
    } catch (Exception $innerEx) {
        // Annuler la transaction en cas d'erreur
        $service->rollbackTransaction();
        throw $innerEx;
    }
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans {$tableName}-sync.php: " . $e->getMessage());
    RequestHandler::handleError($e, 500);
} catch (Exception $e) {
    error_log("Exception dans {$tableName}-sync.php: " . $e->getMessage());
    RequestHandler::handleError($e);
} finally {
    if (isset($service)) {
        $service->finalize();
    }
    
    error_log("=== FIN DE L'EXÉCUTION DE {$tableName}-sync.php ===");
    if (ob_get_level()) ob_end_flush();
}
