
<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/logging.php';

class DataSyncService {
    private $db;
    private $tableName;
    private $logger;
    
    public function __construct(string $tableName) {
        $this->tableName = $tableName;
        $this->logger = new Logger($tableName . '_sync');
        $this->logger->info("Service DataSync initialisé pour " . $tableName);
    }
    
    /**
     * Définir les en-têtes standard pour les requêtes
     */
    public function setStandardHeaders(string $allowedMethods = "GET, POST, OPTIONS") {
        header("Content-Type: application/json; charset=UTF-8");
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: " . $allowedMethods);
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID");
        header("Cache-Control: no-cache, no-store, must-revalidate");
    }
    
    /**
     * Gérer les requêtes OPTIONS (preflight)
     */
    public function handleOptionsRequest() {
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            http_response_code(200);
            echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
            exit;
        }
    }
    
    /**
     * Sanitize l'ID utilisateur pour l'utiliser dans les noms de tables
     */
    public function sanitizeUserId(string $userId): string {
        return preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    }
    
    /**
     * Extraire l'ID utilisateur de la requête
     */
    public function extractUserId(): string {
        // Vérifier les en-têtes pour l'ID utilisateur
        $userId = $_SERVER['HTTP_X_USER_ID'] ?? null;
        
        if (!$userId) {
            // Essayer de l'extraire des données JSON
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);
            $userId = $data['userId'] ?? 'p71x6d_system';
        }
        
        return $this->sanitizeUserId($userId);
    }
    
    /**
     * Se connecter à la base de données spécifique à l'utilisateur
     */
    public function connectToDatabase(): bool {
        try {
            // Obtenir l'ID utilisateur
            $userId = $this->extractUserId();
            $this->logger->info("Connexion à la base de données pour l'utilisateur: " . $userId);
            
            // Créer une instance de la base de données spécifique à l'utilisateur
            $this->db = new Database($userId);
            return $this->db->testConnection();
        } catch (Exception $e) {
            $this->logger->error("Erreur de connexion à la base de données: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * S'assurer que la table existe
     */
    public function ensureTableExists(string $schema): bool {
        try {
            if (!$this->db || !$this->db->getConnection()) {
                $this->logger->error("Pas de connexion à la base de données");
                return false;
            }
            
            // Exécuter le schéma pour créer la table si elle n'existe pas
            $this->db->getConnection()->exec($schema);
            $this->logger->info("Table vérifiée/créée avec succès");
            return true;
        } catch (PDOException $e) {
            $this->logger->error("Erreur lors de la création de la table: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Démarrer une transaction
     */
    public function beginTransaction(): bool {
        try {
            if (!$this->db || !$this->db->getConnection()) {
                return false;
            }
            
            return $this->db->getConnection()->beginTransaction();
        } catch (PDOException $e) {
            $this->logger->error("Erreur lors du démarrage de la transaction: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Valider une transaction
     */
    public function commitTransaction(): bool {
        try {
            if (!$this->db || !$this->db->getConnection()) {
                return false;
            }
            
            return $this->db->getConnection()->commit();
        } catch (PDOException $e) {
            $this->logger->error("Erreur lors de la validation de la transaction: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Annuler une transaction
     */
    public function rollbackTransaction(): bool {
        try {
            if (!$this->db || !$this->db->getConnection()) {
                return false;
            }
            
            return $this->db->getConnection()->rollBack();
        } catch (PDOException $e) {
            $this->logger->error("Erreur lors de l'annulation de la transaction: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Synchroniser les données
     */
    public function syncData(array $data): bool {
        try {
            if (!$this->db || !$this->db->getConnection()) {
                $this->logger->error("Pas de connexion à la base de données pour la synchronisation");
                return false;
            }
            
            $userId = $this->extractUserId();
            $this->logger->info("Synchronisation pour l'utilisateur " . $userId . " avec " . count($data) . " éléments");
            
            // Obtenir une référence à la connexion
            $conn = $this->db->getConnection();
            
            // Vider la table pour une synchronisation complète
            $conn->exec("DELETE FROM `" . $this->tableName . "_{$userId}`");
            
            if (empty($data)) {
                $this->logger->info("Pas de données à synchroniser");
                return true;
            }
            
            // Construire la requête d'insertion dynamique basée sur les clés de la première entrée
            $firstItem = $data[0];
            $columns = array_keys($firstItem);
            
            $placeholders = array_map(function($col) {
                return ':' . $col;
            }, $columns);
            
            $sql = "INSERT INTO `" . $this->tableName . "_{$userId}` (" . 
                   implode(', ', $columns) . 
                   ") VALUES (" . 
                   implode(', ', $placeholders) . 
                   ")";
            
            $stmt = $conn->prepare($sql);
            
            // Insérer chaque élément
            foreach ($data as $item) {
                $bindParams = [];
                foreach ($columns as $col) {
                    $bindParams[':' . $col] = isset($item[$col]) ? $item[$col] : null;
                }
                
                $stmt->execute($bindParams);
            }
            
            $this->logger->info("Synchronisation réussie");
            return true;
        } catch (PDOException $e) {
            $this->logger->error("Erreur lors de la synchronisation des données: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Finaliser et libérer les ressources
     */
    public function finalize() {
        $this->db = null;
    }
}
