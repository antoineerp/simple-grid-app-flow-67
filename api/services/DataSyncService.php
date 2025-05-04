
<?php
class DataSyncService {
    private $tableName;
    private $pdo = null;
    private $inTransaction = false;
    private $error = null;
    
    public function __construct($tableName) {
        $this->tableName = $tableName;
    }
    
    public function connectToDatabase() {
        try {
            require_once __DIR__ . '/../config/database.php';
            $database = new Database();
            $this->pdo = $database->getConnection();
            return $this->pdo !== null;
        } catch (Exception $e) {
            $this->error = $e->getMessage();
            error_log("Erreur de connexion à la base de données: " . $e->getMessage());
            return false;
        }
    }
    
    public function getPdo() {
        return $this->pdo;
    }
    
    public function beginTransaction() {
        if ($this->pdo && !$this->inTransaction) {
            $this->pdo->beginTransaction();
            $this->inTransaction = true;
            return true;
        }
        return false;
    }
    
    public function commitTransaction() {
        if ($this->pdo && $this->inTransaction) {
            $this->pdo->commit();
            $this->inTransaction = false;
            return true;
        }
        return false;
    }
    
    public function rollbackTransaction() {
        if ($this->pdo && $this->inTransaction) {
            $this->pdo->rollBack();
            $this->inTransaction = false;
            return true;
        }
        return false;
    }
    
    public function getError() {
        return $this->error;
    }
    
    public function generateUuid() {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
    
    // Méthode centralisée pour enregistrer toutes les opérations de synchronisation
    public function recordSyncOperation($userId, $deviceId, $operation = 'sync', $recordCount = 0) {
        if (!$this->pdo) {
            error_log("Impossible d'enregistrer l'opération, connexion non établie");
            return false;
        }
        
        try {
            // Récupérer le nom réel de la table (sans le suffix utilisateur)
            $baseTableName = $this->tableName;
            
            error_log("DEBUT: Enregistrement de l'opération {$operation} pour table {$baseTableName}, utilisateur {$userId}");
            
            // Créer la table d'historique si elle n'existe pas
            $this->pdo->exec("CREATE TABLE IF NOT EXISTS `sync_history` (
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
            
            // Vérifier les synchronisations récentes pour éviter les doublons
            // (uniquement pour les opérations 'sync', pas pour 'load')
            if ($operation === 'sync') {
                $checkStmt = $this->pdo->prepare("SELECT COUNT(*) FROM `sync_history` 
                                               WHERE table_name = ? AND user_id = ? 
                                               AND device_id = ? AND operation = ?
                                               AND sync_timestamp > DATE_SUB(NOW(), INTERVAL 3 SECOND)");
                $checkStmt->execute([$baseTableName, $userId, $deviceId, $operation]);
                $recentCount = (int)$checkStmt->fetchColumn();
                
                if ($recentCount > 0) {
                    error_log("Opération {$operation} pour {$baseTableName} déjà enregistrée récemment, doublon évité");
                    return false;
                }
            }
            
            // Logging détaillé avant l'insertion
            error_log("Tentative d'insertion dans sync_history - Table: {$baseTableName}, User: {$userId}, Device: {$deviceId}, Op: {$operation}");
            
            // Insérer l'enregistrement de synchronisation
            $stmt = $this->pdo->prepare("INSERT INTO `sync_history` 
                                       (table_name, user_id, device_id, record_count, operation, sync_timestamp) 
                                       VALUES (?, ?, ?, ?, ?, NOW())");
            $result = $stmt->execute([$baseTableName, $userId, $deviceId, $recordCount, $operation]);
            
            if ($result) {
                $lastId = $this->pdo->lastInsertId();
                error_log("Succès: Opération {$operation} pour {$baseTableName} enregistrée avec ID {$lastId}");
            } else {
                error_log("Échec: Impossible d'enregistrer l'opération {$operation} pour {$baseTableName}");
            }
            
            return $result;
        } catch (Exception $e) {
            error_log("Erreur lors de l'enregistrement de l'opération {$operation}: " . $e->getMessage());
            return false;
        }
    }
    
    public function finalize() {
        // Si une transaction est en cours, on la termine
        if ($this->inTransaction && $this->pdo) {
            $this->pdo->rollBack();
            $this->inTransaction = false;
        }
        
        // Fermer la connexion
        $this->pdo = null;
    }
}
