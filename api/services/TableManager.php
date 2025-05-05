
<?php
class TableManager {
    protected $connection;
    protected $tableName;
    protected $userId = '';

    public function __construct($connection, $tableName, $userId = '') {
        $this->connection = $connection;
        $this->tableName = $tableName;
        $this->userId = $userId;
    }

    public function getFullTableName() {
        if (!empty($this->userId)) {
            return "{$this->tableName}_{$this->userId}";
        }
        return $this->tableName;
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
            $tableName = $this->getFullTableName();
            
            $sql = "SHOW COLUMNS FROM `{$tableName}`";
            $stmt = $this->connection->prepare($sql);
            $stmt->execute();
            
            $columns = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $columns[] = $row['Field'];
            }
            
            error_log("Colonnes récupérées pour la table {$tableName}: " . implode(", ", $columns));
            return $columns;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des colonnes: " . $e->getMessage());
            return [];
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
            $tableName = $this->getFullTableName();
            
            $query = "INSERT INTO `{$tableName}` (`" . $fieldsStr . "`) VALUES " . $placeholdersStr;
            $stmt = $this->connection->prepare($query);
            
            return $stmt->execute($values);
        } catch (PDOException $e) {
            error_log("Erreur lors de l'insertion multiple: " . $e->getMessage());
            return false;
        }
    }

    public function loadData() {
        if (!$this->connection) {
            throw new Exception("Pas de connexion à la base de données");
        }
        
        try {
            $tableName = $this->getFullTableName();
            $query = "SELECT * FROM `{$tableName}`";
            $stmt = $this->connection->prepare($query);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors du chargement des données: " . $e->getMessage());
            throw new Exception("Erreur lors du chargement des données: " . $e->getMessage());
        }
    }
}
?>
