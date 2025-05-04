
<?php
class SelectionOperations {
    private $conn;
    private $tableSelections = 'user_selections';
    private $tableCheckboxes = 'checkboxes';
    
    public function __construct($db) {
        $this->conn = $db;
        
        // Vérifier si les tables existent, sinon les créer
        $this->ensureTablesExist();
    }
    
    /**
     * Assure que les tables nécessaires existent
     */
    private function ensureTablesExist() {
        try {
            // Créer la table des checkboxes si elle n'existe pas
            $createCheckboxesTable = "CREATE TABLE IF NOT EXISTS {$this->tableCheckboxes} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category VARCHAR(100) NOT NULL,
                label VARCHAR(255) NOT NULL,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY (category, label)
            )";
            $this->conn->exec($createCheckboxesTable);
            
            // Créer la table des sélections utilisateur si elle n'existe pas
            $createSelectionsTable = "CREATE TABLE IF NOT EXISTS {$this->tableSelections} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                checkbox_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY (user_id, checkbox_id),
                FOREIGN KEY (checkbox_id) REFERENCES {$this->tableCheckboxes}(id) ON DELETE CASCADE
            )";
            $this->conn->exec($createSelectionsTable);
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors de la création des tables: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Récupère toutes les checkboxes avec l'état de sélection pour un utilisateur
     */
    public function getUserSelections($userId) {
        try {
            $query = "
                SELECT c.id, c.category, c.label, c.sort_order,
                       CASE WHEN us.id IS NOT NULL THEN TRUE ELSE FALSE END AS is_selected
                FROM {$this->tableCheckboxes} c
                LEFT JOIN {$this->tableSelections} us ON c.id = us.checkbox_id AND us.user_id = :user_id
                ORDER BY c.category, c.sort_order, c.label
            ";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Transformer les résultats pour avoir une structure plus exploitable
            $formattedResult = [];
            foreach ($result as $row) {
                $formattedResult[] = [
                    'id' => $row['id'],
                    'category' => $row['category'],
                    'label' => $row['label'],
                    'sortOrder' => $row['sort_order'],
                    'isSelected' => (bool)$row['is_selected']
                ];
            }
            
            return $formattedResult;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des sélections: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Met à jour une sélection utilisateur
     */
    public function updateSelection($userId, $checkboxId, $isSelected) {
        try {
            // Vérifier d'abord si la checkbox existe
            $checkboxQuery = "SELECT id FROM {$this->tableCheckboxes} WHERE id = :id";
            $checkboxStmt = $this->conn->prepare($checkboxQuery);
            $checkboxStmt->bindParam(':id', $checkboxId);
            $checkboxStmt->execute();
            
            if ($checkboxStmt->rowCount() === 0) {
                // La checkbox n'existe pas, donc on ne peut pas la sélectionner
                return false;
            }
            
            $this->conn->beginTransaction();
            
            if ($isSelected) {
                // Ajouter la sélection si elle n'existe pas déjà
                $insertQuery = "INSERT IGNORE INTO {$this->tableSelections} (user_id, checkbox_id) VALUES (:user_id, :checkbox_id)";
                $insertStmt = $this->conn->prepare($insertQuery);
                $insertStmt->bindParam(':user_id', $userId);
                $insertStmt->bindParam(':checkbox_id', $checkboxId);
                $insertStmt->execute();
            } else {
                // Supprimer la sélection si elle existe
                $deleteQuery = "DELETE FROM {$this->tableSelections} WHERE user_id = :user_id AND checkbox_id = :checkbox_id";
                $deleteStmt = $this->conn->prepare($deleteQuery);
                $deleteStmt->bindParam(':user_id', $userId);
                $deleteStmt->bindParam(':checkbox_id', $checkboxId);
                $deleteStmt->execute();
            }
            
            $this->conn->commit();
            return true;
        } catch (PDOException $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log("Erreur lors de la mise à jour de la sélection: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Met à jour plusieurs sélections d'un utilisateur en une seule opération
     */
    public function bulkUpdateSelections($userId, $selections) {
        try {
            $this->conn->beginTransaction();
            
            // Supprimer toutes les sélections existantes pour cet utilisateur
            $deleteQuery = "DELETE FROM {$this->tableSelections} WHERE user_id = :user_id";
            $deleteStmt = $this->conn->prepare($deleteQuery);
            $deleteStmt->bindParam(':user_id', $userId);
            $deleteStmt->execute();
            
            // Insérer les nouvelles sélections
            if (!empty($selections)) {
                $insertQuery = "INSERT INTO {$this->tableSelections} (user_id, checkbox_id) VALUES (:user_id, :checkbox_id)";
                $insertStmt = $this->conn->prepare($insertQuery);
                
                foreach ($selections as $checkboxId) {
                    $insertStmt->bindParam(':user_id', $userId);
                    $insertStmt->bindParam(':checkbox_id', $checkboxId);
                    $insertStmt->execute();
                }
            }
            
            $this->conn->commit();
            return true;
        } catch (PDOException $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log("Erreur lors de la mise à jour en masse des sélections: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Crée une nouvelle checkbox
     */
    public function createCheckbox($category, $label, $sortOrder = 0) {
        try {
            $query = "INSERT INTO {$this->tableCheckboxes} (category, label, sort_order) VALUES (:category, :label, :sort_order)";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':category', $category);
            $stmt->bindParam(':label', $label);
            $stmt->bindParam(':sort_order', $sortOrder);
            $stmt->execute();
            
            return $this->conn->lastInsertId();
        } catch (PDOException $e) {
            error_log("Erreur lors de la création d'une checkbox: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Supprime une checkbox
     */
    public function deleteCheckbox($checkboxId) {
        try {
            $query = "DELETE FROM {$this->tableCheckboxes} WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $checkboxId);
            $stmt->execute();
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression d'une checkbox: " . $e->getMessage());
            return false;
        }
    }
}
?>
