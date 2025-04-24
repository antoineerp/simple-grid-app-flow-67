
<?php
require_once dirname(__FILE__) . '/BaseModel.php';
require_once dirname(__FILE__) . '/traits/TableManager.php';

class Membre extends BaseModel {
    use TableManager;

    // Properties
    public $id;
    public $user_id;
    public $membre_id;
    public $nom;
    public $prenom;
    public $fonction;
    public $initiales;
    public $date_creation;

    public function __construct($db) {
        parent::__construct($db, 'membres');
    }

    public function createMembresTable() {
        try {
            $query = "
                CREATE TABLE IF NOT EXISTS `" . $this->table_name . "` (
                    `id` int(11) NOT NULL AUTO_INCREMENT,
                    `user_id` varchar(255) NOT NULL,
                    `membre_id` varchar(50) NOT NULL,
                    `nom` varchar(100) NOT NULL,
                    `prenom` varchar(100) NOT NULL,
                    `fonction` varchar(100) DEFAULT NULL,
                    `initiales` varchar(10) DEFAULT NULL,
                    `date_creation` datetime NOT NULL,
                    PRIMARY KEY (`id`),
                    KEY `user_id` (`user_id`),
                    KEY `membre_id` (`membre_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ";
            $this->conn->exec($query);
            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors de la création de la table des membres: " . $e->getMessage());
            return false;
        }
    }

    public function getMembresForUser($user_id) {
        try {
            $this->createTableIfNotExists();
            
            $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = :user_id";
            $stmt = $this->conn->prepare($query);
            
            $user_id = $this->sanitizeInput($user_id);
            $stmt->bindParam(":user_id", $user_id);
            
            $stmt->execute();
            return $stmt;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des membres: " . $e->getMessage());
            return null;
        }
    }

    public function saveMembres($user_id, $membres) {
        try {
            $this->conn->beginTransaction();
            
            // Supprimer les membres existants pour cet utilisateur
            $deleteQuery = "DELETE FROM " . $this->table_name . " WHERE user_id = :user_id";
            $deleteStmt = $this->conn->prepare($deleteQuery);
            
            $user_id = $this->sanitizeInput($user_id);
            $deleteStmt->bindParam(':user_id', $user_id);
            
            $deleteStmt->execute();
            
            // Insérer les nouveaux membres
            $insertQuery = "INSERT INTO " . $this->table_name . " 
                            (user_id, membre_id, nom, prenom, fonction, initiales, date_creation) 
                            VALUES (:user_id, :membre_id, :nom, :prenom, :fonction, :initiales, :date_creation)";
            
            $insertStmt = $this->conn->prepare($insertQuery);
            
            foreach ($membres as $membre) {
                $membre_id = $this->sanitizeInput($membre->id);
                $nom = $this->sanitizeInput($membre->nom);
                $prenom = $this->sanitizeInput($membre->prenom);
                $fonction = $this->sanitizeInput($membre->fonction ?? '');
                $initiales = $this->sanitizeInput($membre->initiales ?? '');
                
                // Convertir la date au format SQL
                $date = new DateTime($membre->date_creation);
                $dateSQL = $date->format('Y-m-d H:i:s');
                
                $insertStmt->bindParam(':user_id', $user_id);
                $insertStmt->bindParam(':membre_id', $membre_id);
                $insertStmt->bindParam(':nom', $nom);
                $insertStmt->bindParam(':prenom', $prenom);
                $insertStmt->bindParam(':fonction', $fonction);
                $insertStmt->bindParam(':initiales', $initiales);
                $insertStmt->bindParam(':date_creation', $dateSQL);
                
                $insertStmt->execute();
            }
            
            $this->conn->commit();
            return true;
        } catch (PDOException $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log("Erreur lors de la sauvegarde des membres: " . $e->getMessage());
            return false;
        }
    }

    protected function createTableIfNotExists() {
        return $this->createMembresTable();
    }
}
?>
