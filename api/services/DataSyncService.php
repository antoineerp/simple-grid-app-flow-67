
<?php
class DataSyncService {
    protected $connection = null;
    protected $tableName = '';
    protected $userId = '';
    protected $transactionStarted = false;

    public function __construct($type) {
        $this->tableName = $type;
    }

    public function setStandardHeaders($methods = "GET, POST, OPTIONS") {
        header('Content-Type: application/json; charset=UTF-8');
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: $methods");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
        header("Cache-Control: no-cache, no-store, must-revalidate");
    }

    public function handleOptionsRequest() {
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Preflight OK']);
            exit;
        }
    }

    public function connectToDatabase() {
        require_once 'config/database.php';
        
        try {
            $database = new Database();
            $this->connection = $database->getConnection();
            
            if (!$database->testConnection()) {
                error_log("Erreur de connexion à la base de données");
                return false;
            }
            
            return true;
        } catch (Exception $e) {
            error_log("Exception lors de la connexion à la base: " . $e->getMessage());
            return false;
        }
    }

    public function ensureTableExists($schema) {
        if (!$this->connection) {
            error_log("Pas de connexion à la base de données");
            return false;
        }
        
        try {
            $stmt = $this->connection->prepare($schema);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Erreur lors de la création de la table: " . $e->getMessage());
            return false;
        }
    }

    public function getTableColumns() {
        if (!$this->connection) {
            error_log("Pas de connexion à la base de données pour obtenir les colonnes");
            return [];
        }
        
        try {
            $table = $this->tableName;
            if (!empty($this->userId)) {
                $table = "{$this->tableName}_{$this->userId}";
            }
            
            $sql = "SHOW COLUMNS FROM `{$table}`";
            $stmt = $this->connection->prepare($sql);
            $stmt->execute();
            
            $columns = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $columns[] = $row['Field'];
            }
            
            error_log("Colonnes récupérées pour la table {$table}: " . implode(", ", $columns));
            return $columns;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des colonnes: " . $e->getMessage());
            return [];
        }
    }

    public function sanitizeUserId($userId) {
        // Nettoyage simple de l'userId
        $userId = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $userId);
        return substr($userId, 0, 50); // Limiter la longueur
    }

    public function beginTransaction() {
        if (!$this->connection || $this->transactionStarted) {
            return false;
        }
        
        try {
            $this->transactionStarted = $this->connection->beginTransaction();
            return $this->transactionStarted;
        } catch (Exception $e) {
            error_log("Erreur lors du démarrage de la transaction: " . $e->getMessage());
            return false;
        }
    }

    public function commitTransaction() {
        if (!$this->connection || !$this->transactionStarted) {
            return false;
        }
        
        try {
            $result = $this->connection->commit();
            $this->transactionStarted = false;
            return $result;
        } catch (Exception $e) {
            error_log("Erreur lors de la validation de la transaction: " . $e->getMessage());
            return false;
        }
    }

    public function rollbackTransaction() {
        if (!$this->connection || !$this->transactionStarted) {
            return false;
        }
        
        try {
            $result = $this->connection->rollBack();
            $this->transactionStarted = false;
            return $result;
        } catch (Exception $e) {
            error_log("Erreur lors de l'annulation de la transaction: " . $e->getMessage());
            return false;
        }
    }

    public function syncData($records) {
        if (!$this->connection) {
            throw new Exception("Pas de connexion à la base de données");
        }
        
        if (!$this->transactionStarted) {
            throw new Exception("Aucune transaction active. Appelez beginTransaction() d'abord.");
        }
        
        if (empty($records)) {
            return true; // Rien à synchroniser
        }
        
        // Récupérer tous les IDs pour optimiser les opérations
        $existingIds = $this->getAllIds();
        
        foreach ($records as $record) {
            if (isset($record['id'])) {
                $id = $record['id'];
                
                if (in_array($id, $existingIds)) {
                    $this->updateRecord($record);
                } else {
                    $this->insertRecord($record);
                }
            } else {
                error_log("Enregistrement sans ID ignoré: " . json_encode($record));
            }
        }
        
        return true;
    }

    protected function getAllIds() {
        try {
            $query = "SELECT id FROM {$this->tableName}";
            $stmt = $this->connection->prepare($query);
            $stmt->execute();
            
            $ids = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $ids[] = $row['id'];
            }
            
            return $ids;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des IDs: " . $e->getMessage());
            return [];
        }
    }

    protected function insertRecord($record) {
        try {
            $fields = [];
            $placeholders = [];
            $values = [];
            
            foreach ($record as $key => $value) {
                $fields[] = "`$key`";
                $placeholders[] = "?";
                $values[] = $value;
            }
            
            $fieldsStr = implode(", ", $fields);
            $placeholdersStr = implode(", ", $placeholders);
            
            $query = "INSERT INTO {$this->tableName} ($fieldsStr) VALUES ($placeholdersStr)";
            $stmt = $this->connection->prepare($query);
            
            return $stmt->execute($values);
        } catch (PDOException $e) {
            error_log("Erreur lors de l'insertion: " . $e->getMessage());
            return false;
        }
    }

    protected function updateRecord($record) {
        try {
            $updates = [];
            $values = [];
            
            foreach ($record as $key => $value) {
                if ($key !== 'id') {
                    $updates[] = "`$key` = ?";
                    $values[] = $value;
                }
            }
            
            $values[] = $record['id']; // Pour la condition WHERE
            $updatesStr = implode(", ", $updates);
            
            $query = "UPDATE {$this->tableName} SET $updatesStr WHERE id = ?";
            $stmt = $this->connection->prepare($query);
            
            return $stmt->execute($values);
        } catch (PDOException $e) {
            error_log("Erreur lors de la mise à jour: " . $e->getMessage());
            return false;
        }
    }

    public function loadData() {
        if (!$this->connection) {
            throw new Exception("Pas de connexion à la base de données");
        }
        
        try {
            $query = "SELECT * FROM {$this->tableName}";
            $stmt = $this->connection->prepare($query);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors du chargement des données: " . $e->getMessage());
            throw new Exception("Erreur lors du chargement des données: " . $e->getMessage());
        }
    }
    
    public function insertMultipleData($records) {
        if (empty($records)) {
            return true; // Rien à insérer
        }
        
        try {
            // Préparer une requête d'insertion multiple
            $first = reset($records);
            $fields = array_keys($first);
            $fieldsStr = implode("`, `", $fields);
            
            $values = [];
            $placeholders = [];
            
            foreach ($records as $record) {
                $recordPlaceholders = [];
                foreach ($record as $value) {
                    $values[] = $value;
                    $recordPlaceholders[] = "?";
                }
                $placeholders[] = "(" . implode(", ", $recordPlaceholders) . ")";
            }
            
            $placeholdersStr = implode(", ", $placeholders);
            
            $query = "INSERT INTO {$this->tableName} (`" . $fieldsStr . "`) VALUES " . $placeholdersStr;
            $stmt = $this->connection->prepare($query);
            
            return $stmt->execute($values);
        } catch (PDOException $e) {
            error_log("Erreur lors de l'insertion multiple: " . $e->getMessage());
            return false;
        }
    }

    public function getPdo() {
        return $this->connection;
    }

    public function finalize() {
        // S'assurer que la transaction est terminée si elle a été démarrée
        if ($this->connection && $this->transactionStarted) {
            try {
                $this->connection->rollBack();
                $this->transactionStarted = false;
            } catch (Exception $e) {
                error_log("Erreur lors de la finalisation de la transaction: " . $e->getMessage());
            }
        }
        
        // Fermer la connexion
        $this->connection = null;
    }
}
?>
