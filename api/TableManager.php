
<?php
class TableManager {
    protected $connection;
    protected $tableName;
    protected $userId = '';
    protected $deviceId = 'unknown_device';

    /**
     * Constructeur avec support pour l'ID utilisateur et l'ID appareil
     */
    public function __construct($connection, $tableName, $userId = '', $deviceId = null) {
        $this->connection = $connection;
        $this->tableName = $tableName;
        $this->userId = $userId;
        
        // Récupérer l'ID de l'appareil s'il est fourni
        if ($deviceId) {
            $this->deviceId = $this->sanitizeDeviceId($deviceId);
        } else {
            // Essayer de récupérer depuis les en-têtes HTTP ou les paramètres GET
            $headers = getallheaders();
            if (isset($headers['X-Device-ID'])) {
                $this->deviceId = $this->sanitizeDeviceId($headers['X-Device-ID']);
            } elseif (isset($_GET['deviceId'])) {
                $this->deviceId = $this->sanitizeDeviceId($_GET['deviceId']);
            }
        }
        
        error_log("TableManager initialisé pour table: $tableName, user: $userId, device: $this->deviceId");
    }

    /**
     * Nettoyage de l'ID appareil
     */
    protected function sanitizeDeviceId($deviceId) {
        return preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $deviceId);
    }

    /**
     * Retourne le nom complet de la table en incluant l'ID utilisateur si fourni
     */
    public function getFullTableName() {
        if (!empty($this->userId)) {
            return "{$this->tableName}_{$this->userId}";
        }
        return $this->tableName;
    }

    /**
     * Assure que la table existe, la crée sinon
     */
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

    /**
     * Récupère les colonnes de la table
     */
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

    /**
     * Insère plusieurs enregistrements dans la table
     */
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
            
            // Log des insertions pour le suivi multi-appareils
            $this->logSync('insert', count($records));
            
            return $stmt->execute($values);
        } catch (PDOException $e) {
            error_log("Erreur lors de l'insertion multiple: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Charge les données avec filtrage systématique par ID utilisateur
     */
    public function loadData() {
        if (!$this->connection) {
            throw new Exception("Pas de connexion à la base de données");
        }
        
        try {
            $tableName = $this->getFullTableName();
            $query = "SELECT * FROM `{$tableName}`";
            
            // Ajouter la condition sur userId si la colonne existe
            $columnsExist = $this->tableHasColumn('userId');
            if ($columnsExist && !empty($this->userId)) {
                $query .= " WHERE userId = :userId";
                $stmt = $this->connection->prepare($query);
                $stmt->bindParam(':userId', $this->userId, PDO::PARAM_STR);
            } else {
                $stmt = $this->connection->prepare($query);
            }
            
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Log du chargement pour le suivi multi-appareils
            $this->logSync('load', count($result));
            
            return $result;
        } catch (PDOException $e) {
            error_log("Erreur lors du chargement des données: " . $e->getMessage());
            throw new Exception("Erreur lors du chargement des données: " . $e->getMessage());
        }
    }
    
    /**
     * Vérifie si une table contient une colonne spécifique
     */
    public function tableHasColumn($columnName) {
        try {
            $columns = $this->getTableColumns();
            return in_array($columnName, $columns);
        } catch (Exception $e) {
            error_log("Erreur lors de la vérification de colonne: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Journalise les opérations de synchronisation
     */
    protected function logSync($operation, $count) {
        try {
            $logDir = __DIR__ . '/logs';
            
            // Créer le répertoire logs s'il n'existe pas
            if (!file_exists($logDir)) {
                mkdir($logDir, 0755, true);
            }
            
            $logFile = $logDir . '/sync_operations.log';
            $logData = date('Y-m-d H:i:s') . " | Table: {$this->tableName} | User: {$this->userId} | Device: {$this->deviceId} | {$operation} | Count: {$count}" . PHP_EOL;
            file_put_contents($logFile, $logData, FILE_APPEND);
        } catch (Exception $e) {
            error_log("Erreur lors de la journalisation de synchronisation: " . $e->getMessage());
        }
    }
}
?>
