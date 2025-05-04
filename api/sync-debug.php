
<?php
// Force output buffering to prevent output before headers
ob_start();

// Initialiser la gestion des requêtes
require_once 'services/RequestHandler.php';

// Définir les en-têtes standard
RequestHandler::setStandardHeaders("GET, OPTIONS");
RequestHandler::handleOptionsRequest();

// Définir le mode de débogage
define('DEBUG_MODE', true);

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    RequestHandler::handleError('Méthode non autorisée. Utilisez GET.', 405);
}

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Récupérer les paramètres
    $userId = isset($_GET['userId']) ? RequestHandler::sanitizeUserId($_GET['userId']) : null;
    $action = isset($_GET['action']) ? $_GET['action'] : 'check';
    
    // Connexion à la base de données
    require_once 'config/database.php';
    $database = new Database();
    $pdo = $database->getConnection();
    
    if (!$pdo) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    // Exécuter l'action demandée
    switch ($action) {
        case 'check':
            $result = checkSyncState($pdo, $userId);
            break;
        
        case 'repair_sync':
            $result = repairSyncHistory($pdo, $userId);
            break;
        
        case 'cleanup_duplicates':
            $count = RequestHandler::cleanupSyncDuplicates($pdo, $userId);
            $result = [
                'action' => 'cleanup_duplicates',
                'duplicatesRemoved' => $count,
                'success' => $count >= 0
            ];
            break;
        
        case 'reset_queue':
            $result = resetSyncQueue($pdo, $userId);
            break;
            
        case 'fix_tables':
            $result = verifyAndFixTables($pdo, $userId);
            break;
            
        default:
            throw new Exception("Action non reconnue: {$action}");
    }
    
    // Réponse réussie
    RequestHandler::sendJsonResponse(true, 'Opération terminée avec succès', $result);
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans sync-debug.php: " . $e->getMessage());
    RequestHandler::handleError($e, 500);
} catch (Exception $e) {
    error_log("Exception dans sync-debug.php: " . $e->getMessage());
    RequestHandler::handleError($e);
} finally {
    if (ob_get_level()) ob_end_flush();
}

/**
 * Vérifie l'état de la synchronisation pour un utilisateur
 */
function checkSyncState($pdo, $userId = null) {
    $result = [];
    
    // Vérifier la configuration de la table sync_history
    $tableExists = $pdo->query("SHOW TABLES LIKE 'sync_history'")->rowCount() > 0;
    $result['sync_history_table'] = [
        'exists' => $tableExists,
        'status' => $tableExists ? 'ok' : 'missing'
    ];
    
    // Si la table existe, obtenir des statistiques
    if ($tableExists) {
        // Récupérer les statistiques globales
        $statsQuery = "SELECT COUNT(*) as total, 
                      COUNT(DISTINCT user_id) as users, 
                      COUNT(DISTINCT table_name) as tables,
                      COUNT(DISTINCT device_id) as devices,
                      MAX(sync_timestamp) as last_sync
                      FROM sync_history";
        $stats = $pdo->query($statsQuery)->fetch(PDO::FETCH_ASSOC);
        $result['sync_history_stats'] = $stats;
        
        // Si un userId est spécifié, obtenir des statistiques pour cet utilisateur
        if ($userId) {
            $userStatsQuery = "SELECT COUNT(*) as total, 
                              COUNT(DISTINCT table_name) as tables,
                              COUNT(DISTINCT device_id) as devices,
                              MAX(sync_timestamp) as last_sync
                              FROM sync_history
                              WHERE user_id = ?";
            $stmt = $pdo->prepare($userStatsQuery);
            $stmt->execute([$userId]);
            $userStats = $stmt->fetch(PDO::FETCH_ASSOC);
            $result['user_stats'] = $userStats;
            
            // Récupérer les tables synchronisées par cet utilisateur
            $tablesQuery = "SELECT DISTINCT table_name FROM sync_history WHERE user_id = ?";
            $stmt = $pdo->prepare($tablesQuery);
            $stmt->execute([$userId]);
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $result['user_tables'] = $tables;
            
            // Vérifier les tables physiques pour cet utilisateur
            $physicalTables = [];
            foreach ($tables as $table) {
                $userTable = "{$table}_{$userId}";
                $exists = $pdo->query("SHOW TABLES LIKE '{$userTable}'")->rowCount() > 0;
                
                if ($exists) {
                    $countQuery = "SELECT COUNT(*) FROM `{$userTable}`";
                    $count = $pdo->query($countQuery)->fetchColumn();
                    
                    $physicalTables[$table] = [
                        'exists' => true,
                        'table_name' => $userTable,
                        'record_count' => (int)$count
                    ];
                } else {
                    $physicalTables[$table] = [
                        'exists' => false,
                        'table_name' => $userTable
                    ];
                }
            }
            $result['physical_tables'] = $physicalTables;
        }
    }
    
    return $result;
}

/**
 * Répare l'historique de synchronisation
 */
function repairSyncHistory($pdo, $userId) {
    if (!$userId) {
        throw new Exception("User ID requis pour la réparation");
    }
    
    $deviceId = RequestHandler::getDeviceId();
    $repaired = [];
    
    // Liste des tables standard
    $standardTables = [
        'documents', 
        'exigences', 
        'membres', 
        'bibliotheque', 
        'collaboration',
        'collaboration_groups',
        'test_table'
    ];
    
    // Vérifier chaque table standard
    foreach ($standardTables as $tableName) {
        // Vérifier si cette table a des enregistrements dans l'historique
        $historyQuery = "SELECT COUNT(*) FROM sync_history WHERE table_name = ? AND user_id = ?";
        $stmt = $pdo->prepare($historyQuery);
        $stmt->execute([$tableName, $userId]);
        $historyCount = $stmt->fetchColumn();
        
        if ($historyCount == 0) {
            // Insérer des enregistrements pour cette table
            $insertStmt = $pdo->prepare("INSERT INTO sync_history
                                      (table_name, user_id, device_id, record_count, operation, sync_timestamp)
                                      VALUES (?, ?, ?, 0, ?, NOW())");
            
            // Ajouter load et sync
            $insertStmt->execute([$tableName, $userId, $deviceId, 'load']);
            $insertStmt->execute([$tableName, $userId, $deviceId, 'sync']);
            
            $repaired[] = [
                'table' => $tableName,
                'action' => 'added_to_history',
                'operations_added' => 2
            ];
        } else {
            // Vérifier si les opérations load et sync existent
            $opsQuery = "SELECT operation, COUNT(*) as count 
                        FROM sync_history 
                        WHERE table_name = ? AND user_id = ?
                        GROUP BY operation";
            $stmt = $pdo->prepare($opsQuery);
            $stmt->execute([$tableName, $userId]);
            $operations = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            
            if (!isset($operations['load']) || $operations['load'] == 0) {
                $insertStmt = $pdo->prepare("INSERT INTO sync_history
                                          (table_name, user_id, device_id, record_count, operation, sync_timestamp)
                                          VALUES (?, ?, ?, 0, 'load', NOW())");
                $insertStmt->execute([$tableName, $userId, $deviceId]);
                
                $repaired[] = [
                    'table' => $tableName,
                    'action' => 'added_load_operation'
                ];
            }
            
            if (!isset($operations['sync']) || $operations['sync'] == 0) {
                $insertStmt = $pdo->prepare("INSERT INTO sync_history
                                          (table_name, user_id, device_id, record_count, operation, sync_timestamp)
                                          VALUES (?, ?, ?, 0, 'sync', NOW())");
                $insertStmt->execute([$tableName, $userId, $deviceId]);
                
                $repaired[] = [
                    'table' => $tableName,
                    'action' => 'added_sync_operation'
                ];
            }
        }
        
        // Vérifier si la table physique existe
        $userTableName = "{$tableName}_{$userId}";
        $tableExists = $pdo->query("SHOW TABLES LIKE '{$userTableName}'")->rowCount() > 0;
        
        if (!$tableExists) {
            // Créer la table physique
            createTableIfNotExists($pdo, $tableName, $userTableName);
            
            $repaired[] = [
                'table' => $tableName,
                'action' => 'created_physical_table',
                'table_name' => $userTableName
            ];
        }
    }
    
    return [
        'repaired_count' => count($repaired),
        'repaired_items' => $repaired
    ];
}

/**
 * Réinitialise la file d'attente de synchronisation
 */
function resetSyncQueue($pdo, $userId = null) {
    // Supprimer les entrées d'historique temporaires
    $query = "DELETE FROM sync_history WHERE operation LIKE 'sync-%' OR operation LIKE 'load-%'";
    $params = [];
    
    if ($userId) {
        $query .= " AND user_id = ?";
        $params[] = $userId;
    }
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $count = $stmt->rowCount();
    
    return [
        'action' => 'reset_queue',
        'entries_removed' => $count,
        'status' => 'success'
    ];
}

/**
 * Vérifie et répare les tables d'un utilisateur
 */
function verifyAndFixTables($pdo, $userId) {
    if (!$userId) {
        throw new Exception("User ID requis pour vérifier les tables");
    }
    
    $standardTables = [
        'documents', 
        'exigences', 
        'membres', 
        'bibliotheque', 
        'collaboration',
        'collaboration_groups',
        'test_table'
    ];
    
    $results = [];
    
    foreach ($standardTables as $tableName) {
        $userTableName = "{$tableName}_{$userId}";
        
        // Vérifier si la table existe
        $tableExists = $pdo->query("SHOW TABLES LIKE '{$userTableName}'")->rowCount() > 0;
        
        if (!$tableExists) {
            // Créer la table
            $created = createTableIfNotExists($pdo, $tableName, $userTableName);
            $results[$tableName] = [
                'status' => $created ? 'created' : 'error',
                'table_name' => $userTableName
            ];
        } else {
            // La table existe, vérifier sa structure
            $columns = [];
            $columnsStmt = $pdo->query("SHOW COLUMNS FROM `{$userTableName}`");
            while ($column = $columnsStmt->fetch(PDO::FETCH_ASSOC)) {
                $columns[$column['Field']] = $column;
            }
            
            $results[$tableName] = [
                'status' => 'exists',
                'table_name' => $userTableName,
                'columns_count' => count($columns),
                'has_id' => isset($columns['id']),
                'has_userId' => isset($columns['userId'])
            ];
        }
    }
    
    return [
        'tables_verified' => count($results),
        'tables_status' => $results
    ];
}

/**
 * Crée la table spécifique à l'utilisateur si elle n'existe pas
 */
function createTableIfNotExists($pdo, $tableName, $userTableName) {
    try {
        // Vérifier si la table existe déjà
        $tableExists = $pdo->query("SHOW TABLES LIKE '{$userTableName}'")->rowCount() > 0;
        
        if (!$tableExists) {
            // Créer la structure de table en fonction du type de table
            switch ($tableName) {
                case 'documents':
                    $pdo->exec("CREATE TABLE `{$userTableName}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(255) NOT NULL,
                        `description` TEXT NULL,
                        `type` VARCHAR(50) NULL,
                        `statut` VARCHAR(50) NULL,
                        `reference` VARCHAR(100) NULL,
                        `userId` VARCHAR(50) NOT NULL,
                        `groupId` VARCHAR(36) NULL,
                        `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )");
                    break;
                    
                case 'exigences':
                    $pdo->exec("CREATE TABLE `{$userTableName}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(255) NOT NULL,
                        `description` TEXT NULL,
                        `niveau` VARCHAR(50) NULL,
                        `statut` VARCHAR(50) NULL,
                        `reference` VARCHAR(100) NULL,
                        `userId` VARCHAR(50) NOT NULL,
                        `groupId` VARCHAR(36) NULL,
                        `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )");
                    break;
                    
                case 'membres':
                    $pdo->exec("CREATE TABLE `{$userTableName}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(100) NOT NULL,
                        `prenom` VARCHAR(100) NOT NULL,
                        `email` VARCHAR(255) NULL,
                        `telephone` VARCHAR(20) NULL,
                        `fonction` VARCHAR(100) NULL,
                        `organisation` VARCHAR(255) NULL,
                        `notes` TEXT NULL,
                        `userId` VARCHAR(50) NOT NULL,
                        `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )");
                    break;
                    
                case 'bibliotheque':
                    $pdo->exec("CREATE TABLE `{$userTableName}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(255) NOT NULL,
                        `description` TEXT NULL,
                        `chemin_fichier` VARCHAR(255) NULL,
                        `type_fichier` VARCHAR(50) NULL,
                        `taille_fichier` INT NULL,
                        `userId` VARCHAR(50) NOT NULL,
                        `groupId` VARCHAR(36) NULL,
                        `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )");
                    break;
                    
                case 'collaboration':
                    $pdo->exec("CREATE TABLE `{$userTableName}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(255) NOT NULL,
                        `description` TEXT NULL,
                        `link` VARCHAR(255) NULL,
                        `groupId` VARCHAR(36) NULL,
                        `userId` VARCHAR(50) NOT NULL,
                        `last_sync_device` VARCHAR(100) NULL,
                        `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )");
                    break;
                    
                case 'collaboration_groups':
                    $pdo->exec("CREATE TABLE `{$userTableName}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(255) NOT NULL,
                        `description` TEXT NULL,
                        `userId` VARCHAR(50) NOT NULL,
                        `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )");
                    break;
                    
                case 'test_table':
                    $pdo->exec("CREATE TABLE `{$userTableName}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(255) NOT NULL,
                        `valeur` VARCHAR(255) NULL,
                        `userId` VARCHAR(50) NOT NULL,
                        `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )");
                    break;
                    
                default:
                    // Table générique pour les autres types
                    $pdo->exec("CREATE TABLE `{$userTableName}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(255) NOT NULL,
                        `description` TEXT NULL,
                        `userId` VARCHAR(50) NOT NULL,
                        `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )");
                    break;
            }
            
            return true;
        }
        return true;
    } catch (Exception $e) {
        error_log("Erreur lors de la création de la table {$userTableName}: " . $e->getMessage());
        return false;
    }
}
