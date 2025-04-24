
<?php
require_once dirname(__FILE__) . '/BaseModel.php';
require_once dirname(__FILE__) . '/traits/TableManager.php';

class Exigence extends BaseModel {
    use TableManager;

    // Properties
    public $id;
    public $user_id;
    public $exigence_id;
    public $nom;
    public $responsabilites;
    public $exclusion;
    public $atteinte;
    public $date_creation;
    public $date_modification;

    public function __construct($db) {
        parent::__construct($db, 'exigences');
    }

    public function createExigencesTable() {
        try {
            $query = "
                CREATE TABLE IF NOT EXISTS `" . $this->table_name . "` (
                    `id` int(11) NOT NULL AUTO_INCREMENT,
                    `user_id` varchar(255) NOT NULL,
                    `exigence_id` varchar(50) NOT NULL,
                    `nom` varchar(255) NOT NULL,
                    `responsabilites` text DEFAULT NULL,
                    `exclusion` tinyint(1) DEFAULT 0,
                    `atteinte` varchar(10) DEFAULT NULL,
                    `date_creation` datetime NOT NULL,
                    `date_modification` datetime NOT NULL,
                    PRIMARY KEY (`id`),
                    KEY `user_id` (`user_id`),
                    KEY `exigence_id` (`exigence_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ";
            $this->conn->exec($query);
            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors de la création de la table des exigences: " . $e->getMessage());
            return false;
        }
    }

    public function getExigencesForUser($user_id) {
        try {
            $this->createTableIfNotExists();
            
            $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = :user_id";
            $stmt = $this->conn->prepare($query);
            
            $user_id = $this->sanitizeInput($user_id);
            $stmt->bindParam(":user_id", $user_id);
            
            $stmt->execute();
            return $stmt;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des exigences: " . $e->getMessage());
            return null;
        }
    }

    public function saveExigences($user_id, $exigences) {
        try {
            $this->conn->beginTransaction();
            
            // Supprimer les exigences existantes pour cet utilisateur
            $deleteQuery = "DELETE FROM " . $this->table_name . " WHERE user_id = :user_id";
            $deleteStmt = $this->conn->prepare($deleteQuery);
            
            $user_id = $this->sanitizeInput($user_id);
            $deleteStmt->bindParam(':user_id', $user_id);
            
            $deleteStmt->execute();
            
            // Insérer les nouvelles exigences
            $insertQuery = "INSERT INTO " . $this->table_name . " 
                            (user_id, exigence_id, nom, responsabilites, exclusion, atteinte, date_creation, date_modification) 
                            VALUES (:user_id, :exigence_id, :nom, :responsabilites, :exclusion, :atteinte, :date_creation, :date_modification)";
            
            $insertStmt = $this->conn->prepare($insertQuery);
            
            foreach ($exigences as $exigence) {
                $exigence_id = $this->sanitizeInput($exigence->id);
                $nom = $this->sanitizeInput($exigence->nom);
                
                // Convertir les responsabilités en JSON
                $responsabilites = json_encode($exigence->responsabilites);
                
                $exclusion = $exigence->exclusion ? 1 : 0;
                $atteinte = $exigence->atteinte !== null ? $this->sanitizeInput($exigence->atteinte) : null;
                
                // Convertir les dates au format SQL
                $dateCrea = new DateTime($exigence->date_creation);
                $dateCreationSQL = $dateCrea->format('Y-m-d H:i:s');
                
                $dateMod = new DateTime($exigence->date_modification);
                $dateModificationSQL = $dateMod->format('Y-m-d H:i:s');
                
                $insertStmt->bindParam(':user_id', $user_id);
                $insertStmt->bindParam(':exigence_id', $exigence_id);
                $insertStmt->bindParam(':nom', $nom);
                $insertStmt->bindParam(':responsabilites', $responsabilites);
                $insertStmt->bindParam(':exclusion', $exclusion, PDO::PARAM_INT);
                $insertStmt->bindParam(':atteinte', $atteinte);
                $insertStmt->bindParam(':date_creation', $dateCreationSQL);
                $insertStmt->bindParam(':date_modification', $dateModificationSQL);
                
                $insertStmt->execute();
            }
            
            $this->conn->commit();
            return true;
        } catch (PDOException $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log("Erreur lors de la sauvegarde des exigences: " . $e->getMessage());
            return false;
        }
    }

    protected function createTableIfNotExists() {
        return $this->createExigencesTable();
    }
}
?>
