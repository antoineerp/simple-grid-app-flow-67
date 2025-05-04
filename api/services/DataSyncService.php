
<?php
require_once 'RequestHandler.php';
require_once 'TableManager.php';
require_once 'TransactionManager.php';

class DataSyncService {
    protected $connection = null;
    public $tableName = '';  // Changed from protected to public
    protected $userId = '';
    protected $tableManager;
    protected $transactionManager;

    public function __construct($type) {
        $this->tableName = $type;
    }

    public function setStandardHeaders($methods = "GET, POST, OPTIONS") {
        RequestHandler::setStandardHeaders($methods);
    }

    public function handleOptionsRequest() {
        RequestHandler::handleOptionsRequest();
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
            
            // Initialiser les gestionnaires après la connexion
            $this->tableManager = new TableManager($this->connection, $this->tableName, $this->userId);
            $this->transactionManager = new TransactionManager($this->connection);
            
            return true;
        } catch (Exception $e) {
            error_log("Exception lors de la connexion à la base: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Exécute une requête SQL directe
     * @param string $sql La requête SQL à exécuter
     * @return bool|PDOStatement Résultat de l'exécution
     */
    public function exec($sql) {
        if (!$this->connection) {
            error_log("Tentative d'exécution SQL sans connexion à la base de données");
            return false;
        }
        
        try {
            return $this->connection->exec($sql);
        } catch (PDOException $e) {
            error_log("Erreur lors de l'exécution SQL: " . $e->getMessage());
            throw $e; // Relancer l'exception pour qu'elle puisse être gérée par l'appelant
        }
    }

    /**
     * Prépare et retourne une requête SQL
     * @param string $sql La requête SQL à préparer
     * @return PDOStatement La requête préparée
     */
    public function prepare($sql) {
        if (!$this->connection) {
            throw new Exception("Pas de connexion à la base de données");
        }
        
        return $this->connection->prepare($sql);
    }
    
    /**
     * Exécute une requête SQL et retourne un PDOStatement
     * @param string $sql La requête SQL à exécuter
     * @return PDOStatement Le résultat de la requête
     */
    public function query($sql) {
        if (!$this->connection) {
            throw new Exception("Pas de connexion à la base de données");
        }
        
        return $this->connection->query($sql);
    }

    public function ensureTableExists($schema) {
        if (!$this->tableManager) {
            $this->tableManager = new TableManager($this->connection, $this->tableName, $this->userId);
        }
        return $this->tableManager->ensureTableExists($schema);
    }

    public function getTableColumns() {
        if (!$this->tableManager) {
            $this->tableManager = new TableManager($this->connection, $this->tableName, $this->userId);
        }
        return $this->tableManager->getTableColumns();
    }

    public function sanitizeUserId($userId) {
        $this->userId = RequestHandler::sanitizeUserId($userId);
        
        // Met à jour le TableManager avec le nouvel userId
        if ($this->tableManager) {
            $this->tableManager = new TableManager($this->connection, $this->tableName, $this->userId);
        }
        
        return $this->userId;
    }

    public function beginTransaction() {
        if (!$this->transactionManager) {
            $this->transactionManager = new TransactionManager($this->connection);
        }
        return $this->transactionManager->beginTransaction();
    }

    public function commitTransaction() {
        if (!$this->transactionManager) {
            return false;
        }
        return $this->transactionManager->commitTransaction();
    }

    public function rollbackTransaction() {
        if (!$this->transactionManager) {
            return false;
        }
        return $this->transactionManager->rollbackTransaction();
    }

    public function syncData($records) {
        if (!$this->connection) {
            throw new Exception("Pas de connexion à la base de données");
        }
        
        if (!$this->transactionManager || !$this->transactionManager->isTransactionActive()) {
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
            $tableName = $this->tableManager->getFullTableName();
            $query = "SELECT id FROM `{$tableName}`";
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
            
            $tableName = $this->tableManager->getFullTableName();
            $query = "INSERT INTO `{$tableName}` ($fieldsStr) VALUES ($placeholdersStr)";
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
            
            $tableName = $this->tableManager->getFullTableName();
            $query = "UPDATE `{$tableName}` SET $updatesStr WHERE id = ?";
            $stmt = $this->connection->prepare($query);
            
            return $stmt->execute($values);
        } catch (PDOException $e) {
            error_log("Erreur lors de la mise à jour: " . $e->getMessage());
            return false;
        }
    }

    public function loadData() {
        if (!$this->tableManager) {
            $this->tableManager = new TableManager($this->connection, $this->tableName, $this->userId);
        }
        return $this->tableManager->loadData();
    }
    
    public function insertMultipleData($records) {
        if (!$this->tableManager) {
            $this->tableManager = new TableManager($this->connection, $this->tableName, $this->userId);
        }
        return $this->tableManager->insertMultipleData($records);
    }

    public function getPdo() {
        return $this->connection;
    }

    public function finalize() {
        if ($this->transactionManager) {
            $this->transactionManager->finalize();
        }
        
        // Fermer la connexion
        $this->connection = null;
    }
}
?>
