
<?php
// Force output buffering to prevent output before headers
ob_start();

// Initialiser la gestion de synchronisation
require_once 'services/DataSyncService.php';
require_once 'services/RequestHandler.php';
require_once 'services/TableManager.php';

// Nom de la table à synchroniser
$tableName = 'collaboration';

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
    
    error_log("Données reçues pour synchronisation de {$tableName}");
    
    // Vérifier si les données nécessaires sont présentes
    if (!isset($data['userId'])) {
        throw new Exception("Données incomplètes. 'userId' est requis");
    }
    
    // Récupérer les données
    $userId = RequestHandler::sanitizeUserId($data['userId']);
    $deviceId = isset($data['deviceId']) ? $data['deviceId'] : RequestHandler::getDeviceId();
    
    // Vérifier si on a des données dans le tableau records ou dans un tableau spécifique pour cette table
    $records = [];
    if (isset($data['records']) && is_array($data['records'])) {
        $records = $data['records'];
    } elseif (isset($data[$tableName]) && is_array($data[$tableName])) {
        $records = $data[$tableName];
    } else {
        error_log("Attention: Aucune donnée trouvée pour la table {$tableName}");
    }
    
    error_log("Synchronisation pour l'utilisateur: {$userId} depuis l'appareil: {$deviceId}");
    error_log("Nombre d'enregistrements pour {$tableName}: " . count($records));
    
    // Connexion à la base de données
    if (!$service->connectToDatabase()) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    // Nom de la table spécifique à l'utilisateur
    $userTableName = "{$tableName}_" . RequestHandler::sanitizeUserId($userId);
    
    // Obtenir une référence PDO
    $pdo = $service->getPdo();
    
    // Empêcher les opérations simultanées en vérifiant s'il y a déjà une synchronisation en cours
    $checkStmt = $pdo->prepare("
        SELECT COUNT(*) 
        FROM sync_history 
        WHERE table_name = ? 
        AND user_id = ? 
        AND operation = 'sync' 
        AND sync_timestamp > DATE_SUB(NOW(), INTERVAL 5 SECOND)
    ");
    $checkStmt->execute([$tableName, $userId]);
    $recentSyncs = $checkStmt->fetchColumn();
    
    if ($recentSyncs > 0) {
        error_log("Attention: Opération de synchronisation déjà en cours pour {$tableName} et l'utilisateur {$userId}, optimisation...");
        // On continue quand même mais on met à jour le timestamp plutôt que d'ajouter un nouvel enregistrement
        $updateStmt = $pdo->prepare("
            UPDATE sync_history 
            SET sync_timestamp = NOW(), record_count = record_count + ? 
            WHERE table_name = ? 
            AND user_id = ? 
            AND operation = 'sync' 
            ORDER BY sync_timestamp DESC 
            LIMIT 1
        ");
        $updateStmt->execute([count($records), $tableName, $userId]);
    } else {
        // Enregistrer cette opération de synchronisation dans l'historique
        RequestHandler::forceSyncRecord($pdo, $tableName, $userId, $deviceId, 'sync', count($records));
    }
    
    // Vérifier si la table existe et la créer si nécessaire
    $tables = $pdo->query("SHOW TABLES LIKE '{$userTableName}'")->fetchAll();
    if (count($tables) === 0) {
        // La table n'existe pas, utilisons TableManager pour la créer
        error_log("Table {$userTableName} non trouvée, création automatique via TableManager");
        
        try {
            // Initialiser la table pour cet utilisateur
            $success = TableManager::initializeTableForUser($pdo, $tableName, $userId);
            
            if ($success) {
                error_log("Table {$userTableName} créée avec succès via TableManager");
            } else {
                error_log("Échec de la création de la table {$userTableName} via TableManager");
                throw new Exception("Impossible de créer la table {$userTableName}");
            }
        } catch (Exception $e) {
            error_log("Erreur lors de la création de la table {$userTableName}: " . $e->getMessage());
            throw $e;
        }
    }
    
    // Vider la table pour une synchronisation complète
    // Note: Dans un système de production, vous voudrez peut-être modifier uniquement les enregistrements modifiés
    $stmt = $pdo->prepare("DELETE FROM `{$userTableName}` WHERE userId = ?");
    $stmt->execute([$userId]);
    
    // Insérer les documents
    if (!empty($records)) {
        $insertQuery = "INSERT INTO `{$userTableName}` 
            (id, nom, description, link, groupId, userId, last_sync_device, date_creation, date_modification) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
        $stmt = $pdo->prepare($insertQuery);
        
        foreach ($records as $doc) {
            // Vérifier que les propriétés existent et définir des valeurs par défaut si nécessaire
            $id = isset($doc['id']) ? $doc['id'] : uniqid('doc_');
            $nom = isset($doc['nom']) ? $doc['nom'] : (isset($doc['name']) ? $doc['name'] : 'Sans titre');
            $description = isset($doc['description']) ? $doc['description'] : null;
            $link = isset($doc['link']) ? $doc['link'] : null;
            $groupId = isset($doc['groupId']) ? $doc['groupId'] : null;
            
            $stmt->execute([
                $id,
                $nom,
                $description,
                $link,
                $groupId,
                $userId,
                $deviceId
            ]);
        }
    }
    
    error_log("Enregistrements de {$tableName} synchronisés: " . count($records));
    
    // Réponse réussie
    RequestHandler::sendJsonResponse(true, "Données de {$tableName} synchronisées avec succès", [
        'count' => count($records),
        'deviceId' => $deviceId,
        'tableName' => $tableName
    ]);
    
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
