
<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Traitement des requêtes OPTIONS (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Inclure les configurations de base de données
require_once 'config/database.php';

// Vérifier les paramètres requis
if (!isset($_GET['userId']) || !isset($_GET['action'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Paramètres manquants: userId et action sont requis',
        'timestamp' => date('c')
    ]);
    exit;
}

$userId = $_GET['userId'];
$action = $_GET['action'];

// Connexion à la base de données
try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Répondre en fonction de l'action demandée
    switch ($action) {
        case 'repair_sync':
            // Réparer l'historique de synchronisation
            $result = repairSyncHistory($pdo, $userId);
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'Historique de synchronisation réparé' : 'Échec de la réparation de l\'historique',
                'timestamp' => date('c')
            ]);
            break;
            
        case 'check_tables':
            // Vérifier et réparer les tables
            $result = checkAndRepairTables($pdo, $userId);
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'Tables vérifiées et réparées' : 'Échec de la vérification des tables',
                'timestamp' => date('c')
            ]);
            break;
            
        case 'reset_queue':
            // Réinitialiser la file d'attente de synchronisation
            $result = resetSyncQueue($pdo, $userId);
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'File d\'attente réinitialisée' : 'Échec de la réinitialisation de la file d\'attente',
                'timestamp' => date('c')
            ]);
            break;
            
        case 'remove_duplicates':
            // Supprimer les entrées dupliquées
            $result = removeDuplicates($pdo, $userId);
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'Duplications supprimées' : 'Échec de la suppression des duplications',
                'timestamp' => date('c')
            ]);
            break;
            
        case 'fix_id':
            // Réparer l'ID problématique
            $problemId = isset($_GET['problem_id']) ? $_GET['problem_id'] : '002ecca6-dc39-468d-a6ce-a1aed0264383';
            $result = fixProblemId($pdo, $userId, $problemId);
            echo json_encode([
                'success' => $result,
                'message' => $result ? "ID problématique $problemId réparé" : "Échec de la réparation de l'ID $problemId",
                'timestamp' => date('c')
            ]);
            break;
            
        default:
            echo json_encode([
                'success' => false,
                'message' => 'Action non reconnue',
                'timestamp' => date('c')
            ]);
            break;
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage(),
        'timestamp' => date('c')
    ]);
}

/**
 * Répare l'historique de synchronisation
 */
function repairSyncHistory($pdo, $userId) {
    try {
        // Supprimer les entrées d'historique obsolètes (plus anciennes que 7 jours)
        $stmt = $pdo->prepare("DELETE FROM sync_history WHERE user_id = ? AND sync_timestamp < DATE_SUB(NOW(), INTERVAL 7 DAY)");
        $stmt->execute([$userId]);
        
        // Ajouter la colonne 'operation' si elle n'existe pas
        $columnCheck = $pdo->prepare("SHOW COLUMNS FROM sync_history LIKE 'operation'");
        $columnCheck->execute();
        
        if ($columnCheck->rowCount() == 0) {
            $pdo->exec("ALTER TABLE sync_history ADD COLUMN operation VARCHAR(50) DEFAULT 'sync' AFTER item_count");
        }
        
        // S'assurer que toutes les entrées ont une valeur pour 'operation'
        $pdo->exec("UPDATE sync_history SET operation = 'sync' WHERE operation IS NULL OR operation = ''");
        
        return true;
    } catch (Exception $e) {
        error_log("Erreur lors de la réparation de l'historique: " . $e->getMessage());
        return false;
    }
}

/**
 * Vérifie et répare les tables
 */
function checkAndRepairTables($pdo, $userId) {
    try {
        // Vérifier si la table des membres existe
        $tableName = "membres_" . $userId;
        $checkTable = $pdo->prepare("SHOW TABLES LIKE ?");
        $checkTable->execute([$tableName]);
        
        if ($checkTable->rowCount() == 0) {
            // Si la table n'existe pas, la créer
            $createQuery = "CREATE TABLE IF NOT EXISTS `$tableName` (
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
            $pdo->exec($createQuery);
        } else {
            // Si la table existe, la réparer
            $pdo->exec("REPAIR TABLE `$tableName`");
            $pdo->exec("OPTIMIZE TABLE `$tableName`");
        }
        
        // Vérifier la table id_mapping
        $pdo->exec("CREATE TABLE IF NOT EXISTS `id_mapping` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `original_id` VARCHAR(100) NOT NULL,
            `uuid_id` VARCHAR(36) NOT NULL,
            `table_name` VARCHAR(50) NOT NULL,
            `user_id` VARCHAR(50) NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY `uniq_mapping` (`original_id`, `table_name`, `user_id`)
        )");
        
        return true;
    } catch (Exception $e) {
        error_log("Erreur lors de la vérification des tables: " . $e->getMessage());
        return false;
    }
}

/**
 * Réinitialise la file d'attente de synchronisation
 */
function resetSyncQueue($pdo, $userId) {
    try {
        // Supprimer toutes les entrées en attente pour cet utilisateur
        $stmt = $pdo->prepare("DELETE FROM sync_queue WHERE user_id = ?");
        $stmt->execute([$userId]);
        
        // Mettre à jour le statut du dernier événement de synchronisation
        $stmt = $pdo->prepare("UPDATE sync_history SET status = 'completed' WHERE user_id = ? AND status = 'pending'");
        $stmt->execute([$userId]);
        
        return true;
    } catch (Exception $e) {
        error_log("Erreur lors de la réinitialisation de la file d'attente: " . $e->getMessage());
        return false;
    }
}

/**
 * Supprime les entrées dupliquées
 */
function removeDuplicates($pdo, $userId) {
    try {
        // Supprimer les duplications dans l'historique de synchronisation
        $pdo->exec("CREATE TEMPORARY TABLE temp_sync_history AS
            SELECT MIN(id) as id
            FROM sync_history
            WHERE user_id = '$userId'
            GROUP BY table_name, device_id, sync_timestamp
            HAVING COUNT(*) > 1");
            
        $pdo->exec("DELETE FROM sync_history 
            WHERE id IN (SELECT id FROM temp_sync_history)
            AND user_id = '$userId'");
            
        $pdo->exec("DROP TEMPORARY TABLE IF EXISTS temp_sync_history");
        
        // Trouver et supprimer les doublons dans la table des membres
        $tableName = "membres_" . $userId;
        
        // Vérifier si la table existe
        $checkTable = $pdo->prepare("SHOW TABLES LIKE ?");
        $checkTable->execute([$tableName]);
        
        if ($checkTable->rowCount() > 0) {
            // Identifier les doublons potentiels par nom et prénom
            $pdo->exec("CREATE TEMPORARY TABLE temp_duplicates AS
                SELECT MIN(id) as keep_id, nom, prenom
                FROM `$tableName`
                GROUP BY nom, prenom
                HAVING COUNT(*) > 1");
                
            // Supprimer les doublons en conservant un seul enregistrement
            $pdo->exec("DELETE FROM `$tableName` 
                WHERE id NOT IN (SELECT keep_id FROM temp_duplicates)
                AND (nom, prenom) IN (SELECT nom, prenom FROM temp_duplicates)");
                
            $pdo->exec("DROP TEMPORARY TABLE IF EXISTS temp_duplicates");
        }
        
        return true;
    } catch (Exception $e) {
        error_log("Erreur lors de la suppression des duplications: " . $e->getMessage());
        return false;
    }
}

/**
 * Répare l'ID problématique spécifique
 */
function fixProblemId($pdo, $userId, $problemId) {
    try {
        $tableName = "membres_" . $userId;
        
        // Vérifier si l'ID problématique existe dans la table
        $stmt = $pdo->prepare("SELECT id FROM `$tableName` WHERE id = ?");
        $stmt->execute([$problemId]);
        
        if ($stmt->rowCount() > 0) {
            // L'ID existe, générer un nouvel ID
            $newId = generateUuid();
            
            // Créer une sauvegarde de l'entrée avec le nouvel ID
            $stmt = $pdo->prepare("INSERT INTO `$tableName` 
                SELECT ?, nom, prenom, email, telephone, fonction, organisation, notes, initiales, userId, mot_de_passe, date_creation, date_modification, last_sync_device
                FROM `$tableName` 
                WHERE id = ?");
            $stmt->execute([$newId, $problemId]);
            
            // Supprimer l'entrée problématique
            $stmt = $pdo->prepare("DELETE FROM `$tableName` WHERE id = ?");
            $stmt->execute([$problemId]);
            
            // Mettre à jour la table id_mapping si elle existe
            try {
                $mapStmt = $pdo->prepare("INSERT IGNORE INTO `id_mapping` (original_id, uuid_id, table_name, user_id) VALUES (?, ?, 'membres', ?)");
                $mapStmt->execute([$problemId, $newId, $userId]);
            } catch (Exception $mapError) {
                error_log("Avertissement lors de la mise à jour de id_mapping: " . $mapError->getMessage());
            }
            
            error_log("ID problématique $problemId remplacé par $newId");
            return true;
        } else {
            // L'ID n'existe pas, donc il pourrait être un conflit avec une autre table
            // ou un problème de synchronisation. Nettoyer les références.
            
            // Supprimer toutes les références à cet ID dans l'historique de synchronisation
            $stmt = $pdo->prepare("DELETE FROM sync_history WHERE data LIKE ? AND user_id = ?");
            $stmt->execute(['%' . $problemId . '%', $userId]);
            
            // Supprimer de la file d'attente
            $stmt = $pdo->prepare("DELETE FROM sync_queue WHERE data LIKE ? AND user_id = ?");
            $stmt->execute(['%' . $problemId . '%', $userId]);
            
            return true;
        }
    } catch (Exception $e) {
        error_log("Erreur lors de la réparation de l'ID problématique: " . $e->getMessage());
        return false;
    }
}

/**
 * Génère un UUID v4
 */
function generateUuid() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
?>
