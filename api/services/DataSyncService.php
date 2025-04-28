
<?php
// Force output buffering to prevent output before headers
ob_start();

class DataSyncService {
    private $host;
    private $dbname;
    private $username;
    private $password;
    private $pdo;
    private $tableName;
    private $userId;
    private $entityType;
    private $transaction_active = false;
    
    public function __construct($entityType) {
        // Configuration de la base de données
        $this->host = "p71x6d.myd.infomaniak.com";
        $this->dbname = "p71x6d_system";
        $this->username = "p71x6d_system";
        $this->password = "Trottinette43!";
        $this->entityType = $entityType;
        
        // Journalisation
        error_log("=== DÉBUT DU SERVICE DataSyncService POUR {$entityType} ===");
    }
    
    /**
     * Configure les en-têtes HTTP standards pour les API
     */
    public function setStandardHeaders($method = "GET, POST, OPTIONS") {
        header("Content-Type: application/json; charset=UTF-8");
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: {$method}");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Cache-Control: no-cache, no-store, must-revalidate");
    }
    
    /**
     * Gère les requêtes OPTIONS (preflight CORS)
     */
    public function handleOptionsRequest() {
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            http_response_code(200);
            echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
            exit;
        }
    }
    
    /**
     * Initialise la connexion à la base de données
     */
    public function connectToDatabase() {
        try {
            // Nettoyer tout buffer existant
            if (ob_get_level()) ob_clean();
            
            $this->pdo = new PDO(
                "mysql:host={$this->host};dbname={$this->dbname};charset=utf8mb4", 
                $this->username, 
                $this->password, 
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
            
            error_log("Connexion à la base de données réussie pour {$this->entityType}");
            return true;
        } catch (PDOException $e) {
            error_log("Erreur de connexion à la base de données: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Vérifie et sanitize l'ID de l'utilisateur
     */
    public function sanitizeUserId($rawUserId) {
        if (empty($rawUserId) || $rawUserId === '[object Object]' || strpos($rawUserId, 'object') !== false) {
            error_log("UserId invalide ou [object Object] détecté, utilisation de l'ID par défaut");
            return 'p71x6d_system';
        }
        
        $this->userId = preg_replace('/[^a-zA-Z0-9_]/', '_', $rawUserId);
        $this->tableName = "{$this->entityType}_{$this->userId}";
        
        error_log("UserId traité: {$this->userId}, Table: {$this->tableName}");
        return $this->userId;
    }
    
    /**
     * Vérifie si une table existe et la crée si nécessaire
     */
    public function ensureTableExists($schema) {
        try {
            // Vérifier si la table existe
            $tableExistsQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?";
            $stmt = $this->pdo->prepare($tableExistsQuery);
            $stmt->execute([$this->dbname, $this->tableName]);
            $tableExists = (int)$stmt->fetchColumn() > 0;
            
            if (!$tableExists) {
                // Créer la table avec le schéma fourni
                error_log("Création de la table {$this->tableName}");
                $this->pdo->exec($schema);
                return true;
            }
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification/création de la table: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Récupère les colonnes existantes d'une table
     */
    public function getTableColumns() {
        try {
            $stmt = $this->pdo->prepare("SHOW COLUMNS FROM `{$this->tableName}`");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des colonnes: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Charge des données depuis la table
     */
    public function loadData() {
        try {
            $query = "SELECT * FROM `{$this->tableName}`";
            $stmt = $this->pdo->query($query);
            $data = $stmt->fetchAll();
            
            // Formater les dates pour le client
            foreach ($data as &$item) {
                if (isset($item['date_creation']) && $item['date_creation']) {
                    $item['date_creation'] = date('Y-m-d\TH:i:s', strtotime($item['date_creation']));
                }
                if (isset($item['date_modification']) && $item['date_modification']) {
                    $item['date_modification'] = date('Y-m-d\TH:i:s', strtotime($item['date_modification']));
                }
            }
            
            error_log("Données chargées: " . count($data) . " enregistrements");
            return $data;
        } catch (PDOException $e) {
            error_log("Erreur lors du chargement des données: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Synchronise les données avec la table
     */
    public function syncData($items) {
        try {
            // Démarrer une transaction
            $this->pdo->beginTransaction();
            $this->transaction_active = true;
            
            // Vider la table
            $this->pdo->exec("TRUNCATE TABLE `{$this->tableName}`");
            
            // Récupérer les colonnes disponibles
            $columns = $this->getTableColumns();
            error_log("Colonnes disponibles: " . implode(", ", $columns));
            
            if (count($columns) === 0) {
                throw new Exception("Table {$this->tableName} n'a pas de colonnes ou n'existe pas");
            }
            
            // Insérer les données
            if (count($items) > 0) {
                // Préparer la requête d'insertion dynamiquement
                $placeholders = [];
                $columnsToInsert = [];
                
                foreach ($columns as $column) {
                    if ($column !== 'date_modification' || !in_array('date_creation', $columns)) {
                        $columnsToInsert[] = "`$column`";
                        $placeholders[] = "?";
                    }
                }
                
                $columnsStr = implode(", ", $columnsToInsert);
                $placeholdersStr = implode(", ", $placeholders);
                
                $insertQuery = "INSERT INTO `{$this->tableName}` ($columnsStr) VALUES ($placeholdersStr)";
                error_log("Requête d'insertion: $insertQuery");
                
                $stmt = $this->pdo->prepare($insertQuery);
                
                foreach ($items as $item) {
                    $values = [];
                    foreach ($columns as $column) {
                        if ($column !== 'date_modification' || !in_array('date_creation', $columns)) {
                            // Pour les dates, s'assurer qu'elles sont au format SQL
                            if (($column === 'date_creation' || $column === 'date_modification') && isset($item[$column])) {
                                if (is_string($item[$column])) {
                                    $values[] = date('Y-m-d H:i:s', strtotime($item[$column]));
                                } else {
                                    $values[] = date('Y-m-d H:i:s');
                                }
                            } else {
                                $values[] = isset($item[$column]) ? $item[$column] : null;
                            }
                        }
                    }
                    
                    error_log("Insertion de l'élément: " . json_encode(array_slice($values, 0, 3)) . "...");
                    $stmt->execute($values);
                }
            }
            
            // Valider la transaction
            $this->pdo->commit();
            $this->transaction_active = false;
            
            error_log("Synchronisation réussie pour {$this->entityType}, {$this->userId}");
            return true;
        } catch (Exception $e) {
            // Annuler la transaction en cas d'erreur
            if ($this->transaction_active && $this->pdo->inTransaction()) {
                $this->pdo->rollBack();
                $this->transaction_active = false;
            }
            
            error_log("Erreur lors de la synchronisation: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Gère l'insertion de données de test si nécessaire
     */
    public function insertTestData($testData) {
        try {
            $columns = $this->getTableColumns();
            
            if (count($columns) === 0) {
                throw new Exception("Table {$this->tableName} n'a pas de colonnes ou n'existe pas");
            }
            
            // Vérifier si des données existent déjà
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM `{$this->tableName}`");
            $stmt->execute();
            $dataExists = (int)$stmt->fetchColumn() > 0;
            
            if (!$dataExists) {
                error_log("Aucune donnée trouvée dans {$this->tableName}, ajout de données de test");
                
                // Préparer la requête d'insertion
                $placeholders = [];
                $columnsToInsert = [];
                
                foreach ($columns as $column) {
                    if ($column !== 'date_modification' || !in_array('date_creation', $columns)) {
                        $columnsToInsert[] = "`$column`";
                        $placeholders[] = "?";
                    }
                }
                
                $columnsStr = implode(", ", $columnsToInsert);
                $placeholdersStr = implode(", ", $placeholders);
                
                $insertQuery = "INSERT INTO `{$this->tableName}` ($columnsStr) VALUES ($placeholdersStr)";
                $stmt = $this->pdo->prepare($insertQuery);
                
                foreach ($testData as $item) {
                    $values = [];
                    foreach ($columns as $column) {
                        if ($column !== 'date_modification' || !in_array('date_creation', $columns)) {
                            $values[] = isset($item[$column]) ? $item[$column] : null;
                        }
                    }
                    
                    $stmt->execute($values);
                }
                
                error_log("Données de test insérées dans {$this->tableName}");
            }
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors de l'insertion des données de test: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Méthode finale pour nettoyer et terminer proprement
     */
    public function finalize() {
        // S'assurer que toute transaction est terminée
        if ($this->transaction_active && $this->pdo && $this->pdo->inTransaction()) {
            try {
                error_log("Annulation d'une transaction qui était encore active");
                $this->pdo->rollBack();
            } catch (Exception $e) {
                error_log("Erreur lors du rollback final: " . $e->getMessage());
            }
        }
        
        error_log("=== FIN DU SERVICE DataSyncService POUR {$this->entityType} ===");
        
        // Vider et fermer le buffer
        if (ob_get_level()) ob_end_flush();
    }
}
?>
