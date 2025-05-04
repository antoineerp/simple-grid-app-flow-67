
<?php

class DataSyncService {
    private $pdo = null;
    private $tableName;
    private $userId;
    private $inTransaction = false;

    public function __construct($tableName) {
        $this->tableName = $tableName;
    }

    public function connectToDatabase() {
        try {
            // Paramètres de connexion
            $host = "p71x6d.myd.infomaniak.com";
            $dbname = "p71x6d_system";
            $username = "p71x6d_system";
            $password = "Trottinette43!";
            
            // Connexion PDO
            $this->pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur de connexion à la base de données: " . $e->getMessage());
            return false;
        }
    }

    public function getPdo() {
        return $this->pdo;
    }

    public function sanitizeUserId($userId) {
        if (!$userId) {
            throw new Exception("ID utilisateur invalide");
        }
        
        // Si c'est un objet, tenter d'extraire l'ID
        if (is_array($userId)) {
            if (isset($userId['identifiant_technique'])) {
                $userId = $userId['identifiant_technique'];
            } else if (isset($userId['id'])) {
                $userId = $userId['id'];
            }
        }
        
        // Convertir en string et nettoyer
        $userId = (string)$userId;
        return preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    }

    /**
     * Génère un UUID v4 pour standardiser les IDs
     * @return string UUID au format 8-4-4-4-12
     */
    public function generateUuid() {
        // Générer 16 octets aléatoires
        if (function_exists('random_bytes')) {
            $data = random_bytes(16);
        } elseif (function_exists('openssl_random_pseudo_bytes')) {
            $data = openssl_random_pseudo_bytes(16);
        } else {
            // Fallback si les fonctions sécurisées ne sont pas disponibles
            $data = '';
            for ($i = 0; $i < 16; $i++) {
                $data .= chr(mt_rand(0, 255));
            }
        }

        // Définir la version (4) et la variante (RFC 4122)
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);

        // Formater en chaîne UUID
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    public function query($sql) {
        if (!$this->pdo) {
            throw new Exception("Base de données non connectée");
        }
        return $this->pdo->query($sql);
    }

    public function ensureTableExists($schema) {
        try {
            if (!$this->pdo) {
                return false;
            }
            $this->pdo->exec($schema);
            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors de la création de la table: " . $e->getMessage());
            return false;
        }
    }

    public function beginTransaction() {
        if ($this->pdo && !$this->inTransaction) {
            $this->inTransaction = $this->pdo->beginTransaction();
            return $this->inTransaction;
        }
        return false;
    }

    public function commitTransaction() {
        if ($this->pdo && $this->inTransaction) {
            $result = $this->pdo->commit();
            $this->inTransaction = false;
            return $result;
        }
        return false;
    }

    public function rollbackTransaction() {
        if ($this->pdo && $this->inTransaction) {
            $result = $this->pdo->rollBack();
            $this->inTransaction = false;
            return $result;
        }
        return false;
    }

    public function syncData($data) {
        if (!$this->pdo || !is_array($data) || empty($data)) {
            return false;
        }

        try {
            // Récupérer les données de la première ligne pour définir les colonnes
            $firstRecord = reset($data);
            if (!$firstRecord || !is_array($firstRecord)) {
                throw new Exception("Format de données invalide");
            }
            
            // Récupérer l'ID utilisateur du premier enregistrement
            $this->userId = isset($firstRecord['userId']) ? $this->sanitizeUserId($firstRecord['userId']) : null;
            if (!$this->userId) {
                throw new Exception("ID utilisateur non fourni dans les données");
            }

            // Préparer la requête d'insertion/mise à jour pour chaque ligne
            $fullTableName = "{$this->tableName}_{$this->userId}";
            
            $upsertQuery = "INSERT INTO `{$fullTableName}` (";
            $columns = [];
            $placeholders = [];
            $updates = [];
            $keys = array_keys($firstRecord);
            
            foreach ($keys as $key) {
                $columns[] = "`{$key}`";
                $placeholders[] = "?";
                
                // Ne pas mettre à jour l'ID ou la date de création
                if ($key !== 'id' && $key !== 'date_creation') {
                    $updates[] = "`{$key}` = VALUES(`{$key}`)";
                }
            }
            
            $upsertQuery .= implode(", ", $columns) . ") VALUES (" . implode(", ", $placeholders) . ") 
                             ON DUPLICATE KEY UPDATE " . implode(", ", $updates);
            
            $stmt = $this->pdo->prepare($upsertQuery);
            
            // Exécuter pour chaque enregistrement
            foreach ($data as $record) {
                $values = [];
                foreach ($keys as $key) {
                    $values[] = $record[$key] ?? null;
                }
                $stmt->execute($values);
            }
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors de la synchronisation des données: " . $e->getMessage());
            throw $e;
        }
    }

    public function finalize() {
        // Annuler la transaction si elle est encore active
        if ($this->inTransaction && $this->pdo) {
            $this->pdo->rollBack();
            $this->inTransaction = false;
        }
        
        // Fermer la connexion
        $this->pdo = null;
    }
}
?>
