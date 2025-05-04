
<?php
// Force output buffering to prevent output before headers
ob_start();

// Initialiser la gestion des requêtes
require_once 'services/RequestHandler.php';

// Définir les en-têtes standard
RequestHandler::setStandardHeaders("GET, OPTIONS");
RequestHandler::handleOptionsRequest();

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    RequestHandler::handleError('Méthode non autorisée. Utilisez GET.', 405);
}

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Récupérer les paramètres
    $userId = isset($_GET['userId']) ? RequestHandler::sanitizeUserId($_GET['userId']) : null;
    $action = isset($_GET['action']) ? $_GET['action'] : 'diagnostic';
    
    if (!$userId) {
        throw new Exception("Paramètre 'userId' requis");
    }
    
    // Connexion à la base de données
    require_once 'config/database.php';
    $database = new Database();
    $pdo = $database->getConnection();
    
    if (!$pdo) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    // Exécuter l'action demandée
    switch ($action) {
        case 'diagnostic':
            $result = runDiagnostic($pdo, $userId);
            break;
        
        case 'fix-missing-tables':
            $result = fixMissingTables($pdo, $userId);
            break;
        
        case 'rebuild-history':
            $result = rebuildSyncHistory($pdo, $userId);
            break;
        
        case 'initialize-all-tables':
            $result = initializeAllTables($pdo, $userId);
            break;
        
        default:
            throw new Exception("Action non reconnue: {$action}");
    }
    
    // Réponse réussie
    RequestHandler::sendJsonResponse(true, 'Opération terminée avec succès', $result);
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans sync-fix.php: " . $e->getMessage());
    RequestHandler::handleError($e, 500);
} catch (Exception $e) {
    error_log("Exception dans sync-fix.php: " . $e->getMessage());
    RequestHandler::handleError($e);
} finally {
    if (ob_get_level()) ob_end_flush();
}

/**
 * Exécute un diagnostic complet de synchronisation pour un utilisateur
 */
function runDiagnostic($pdo, $userId) {
    // Récupérer toutes les tables de l'utilisateur
    $tables = getUserTables($pdo, $userId);
    
    // Récupérer l'historique de synchronisation
    $syncHistory = getSyncHistory($pdo, $userId);
    
    // Analyser les tables manquantes dans l'historique
    $tablesInHistory = array_unique(array_column($syncHistory, 'table_name'));
    $missingInHistory = array_diff(array_keys($tables), $tablesInHistory);
    
    // Vérifier les opérations manquantes (load ou sync)
    $missingOperations = [];
    foreach ($tablesInHistory as $tableName) {
        $operations = [];
        foreach ($syncHistory as $record) {
            if ($record['table_name'] === $tableName) {
                $operations[] = $record['operation'];
            }
        }
        
        $uniqueOperations = array_unique($operations);
        if (!in_array('sync', $uniqueOperations)) {
            $missingOperations[] = ['table' => $tableName, 'missing' => 'sync'];
        }
        if (!in_array('load', $uniqueOperations)) {
            $missingOperations[] = ['table' => $tableName, 'missing' => 'load'];
        }
    }
    
    return [
        'tables_found' => count($tables),
        'tables_list' => array_keys($tables),
        'sync_history_records' => count($syncHistory),
        'tables_in_history' => count($tablesInHistory),
        'tables_in_history_list' => $tablesInHistory,
        'missing_in_history' => $missingInHistory,
        'missing_operations' => $missingOperations
    ];
}

/**
 * Corrige les tables manquantes dans l'historique de synchronisation
 */
function fixMissingTables($pdo, $userId) {
    $deviceId = RequestHandler::getDeviceId();
    $fixes = [];
    
    // Récupérer toutes les tables de l'utilisateur
    $tables = getUserTables($pdo, $userId);
    
    // Récupérer l'historique de synchronisation
    $syncHistory = getSyncHistory($pdo, $userId);
    $tablesInHistory = array_unique(array_column($syncHistory, 'table_name'));
    
    // Ajouter des enregistrements pour les tables manquantes
    foreach ($tables as $tableName => $recordCount) {
        if (!in_array($tableName, $tablesInHistory)) {
            // Ajouter des enregistrements pour load et sync
            $stmt = $pdo->prepare("INSERT INTO `sync_history` 
                                (table_name, user_id, device_id, record_count, operation, sync_timestamp) 
                                VALUES (?, ?, ?, ?, ?, NOW())");
            
            // Opération load
            $stmt->execute([$tableName, $userId, $deviceId, $recordCount, 'load']);
            
            // Opération sync
            $stmt->execute([$tableName, $userId, $deviceId, $recordCount, 'sync']);
            
            $fixes[] = $tableName;
        }
    }
    
    return [
        'tables_fixed' => count($fixes),
        'fixed_tables' => $fixes
    ];
}

/**
 * Reconstruit tout l'historique de synchronisation pour un utilisateur
 */
function rebuildSyncHistory($pdo, $userId) {
    $deviceId = RequestHandler::getDeviceId();
    
    // Récupérer toutes les tables de l'utilisateur
    $tables = getUserTables($pdo, $userId);
    
    // Supprimer tout l'historique existant pour cet utilisateur
    $deleteStmt = $pdo->prepare("DELETE FROM `sync_history` WHERE user_id = ?");
    $deleteStmt->execute([$userId]);
    
    // Reconstruire l'historique
    $insertStmt = $pdo->prepare("INSERT INTO `sync_history` 
                               (table_name, user_id, device_id, record_count, operation, sync_timestamp) 
                               VALUES (?, ?, ?, ?, ?, NOW())");
    
    $rebuilt = [];
    foreach ($tables as $tableName => $recordCount) {
        // Opération load
        $insertStmt->execute([$tableName, $userId, $deviceId, $recordCount, 'load']);
        
        // Opération sync
        $insertStmt->execute([$tableName, $userId, $deviceId, $recordCount, 'sync']);
        
        $rebuilt[] = $tableName;
    }
    
    return [
        'tables_rebuilt' => count($rebuilt),
        'rebuilt_tables' => $rebuilt
    ];
}

/**
 * Initialise l'historique de synchronisation pour toutes les tables standard
 */
function initializeAllTables($pdo, $userId) {
    $deviceId = RequestHandler::getDeviceId();
    
    // Liste des tables standard de l'application
    $standardTables = [
        'documents', 
        'exigences', 
        'membres', 
        'bibliotheque', 
        'collaboration',
        'collaboration_groups',
        'test_table'
    ];
    
    // Créer la table d'historique si elle n'existe pas
    $pdo->exec("CREATE TABLE IF NOT EXISTS `sync_history` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `table_name` VARCHAR(100) NOT NULL,
        `user_id` VARCHAR(50) NOT NULL,
        `device_id` VARCHAR(100) NOT NULL,
        `record_count` INT NOT NULL,
        `operation` VARCHAR(50) DEFAULT 'sync',
        `sync_timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX `idx_user_device` (`user_id`, `device_id`),
        INDEX `idx_table_user` (`table_name`, `user_id`),
        INDEX `idx_timestamp` (`sync_timestamp`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    
    // Préparer la requête d'insertion
    $insertStmt = $pdo->prepare("INSERT INTO `sync_history` 
                               (table_name, user_id, device_id, record_count, operation, sync_timestamp) 
                               VALUES (?, ?, ?, ?, ?, NOW())");
    
    // Pour chaque table standard, vérifier si elle existe déjà dans l'historique
    $initialized = [];
    $alreadyExists = [];
    
    // Récupérer les tables déjà présentes dans l'historique
    $existingTablesQuery = $pdo->prepare("SELECT DISTINCT table_name FROM `sync_history` WHERE user_id = ?");
    $existingTablesQuery->execute([$userId]);
    $existingTables = $existingTablesQuery->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($standardTables as $tableName) {
        // Si la table n'est pas déjà dans l'historique
        if (!in_array($tableName, $existingTables)) {
            // Opération load
            $insertStmt->execute([$tableName, $userId, $deviceId, 0, 'load']);
            
            // Opération sync
            $insertStmt->execute([$tableName, $userId, $deviceId, 0, 'sync']);
            
            $initialized[] = $tableName;
            
            // Créer la table spécifique à l'utilisateur si elle n'existe pas
            $userTableName = "{$tableName}_{$userId}";
            createTableIfNotExists($pdo, $tableName, $userTableName);
        } else {
            $alreadyExists[] = $tableName;
        }
    }
    
    return [
        'tables_initialized' => count($initialized),
        'initialized_tables' => $initialized,
        'already_in_history' => $alreadyExists
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
                        `titre` VARCHAR(255) NOT NULL,
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
                        `titre` VARCHAR(255) NOT NULL,
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
                        `titre` VARCHAR(255) NOT NULL,
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
        }
        return true;
    } catch (Exception $e) {
        error_log("Erreur lors de la création de la table {$userTableName}: " . $e->getMessage());
        return false;
    }
}

/**
 * Récupère toutes les tables d'un utilisateur
 */
function getUserTables($pdo, $userId) {
    $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    $tables = [];
    
    // Récupérer toutes les tables avec un suffixe _userId
    $stmt = $pdo->query("SHOW TABLES LIKE '%\_$safeUserId'");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $fullTableName = $row[0];
        // Extraire le nom de base de la table
        $baseTableName = preg_replace("/_$safeUserId$/", '', $fullTableName);
        
        // Compter les enregistrements
        $countStmt = $pdo->query("SELECT COUNT(*) FROM `$fullTableName`");
        $recordCount = $countStmt->fetchColumn();
        
        $tables[$baseTableName] = (int)$recordCount;
    }
    
    return $tables;
}

/**
 * Récupère l'historique de synchronisation d'un utilisateur
 */
function getSyncHistory($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT * FROM `sync_history` WHERE user_id = ? ORDER BY sync_timestamp DESC");
    $stmt->execute([$userId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

