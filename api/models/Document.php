
<?php
require_once dirname(__FILE__) . '/BaseModel.php';
require_once dirname(__FILE__) . '/traits/TableManager.php';

class Document extends BaseModel {
    use TableManager;

    // Properties
    public $id;
    public $user_id;
    public $document_id;
    public $nom;
    public $fichier_path;
    public $responsabilites;
    public $etat;
    public $date_creation;
    public $date_modification;

    public function __construct($db) {
        parent::__construct($db, 'documents');
    }

    public function createDocumentsTable() {
        try {
            $query = "
                CREATE TABLE IF NOT EXISTS `" . $this->table_name . "` (
                    `id` int(11) NOT NULL AUTO_INCREMENT,
                    `user_id` varchar(255) NOT NULL,
                    `document_id` varchar(50) NOT NULL,
                    `nom` varchar(255) NOT NULL,
                    `fichier_path` varchar(255) DEFAULT NULL,
                    `responsabilites` text DEFAULT NULL,
                    `etat` varchar(10) DEFAULT NULL,
                    `date_creation` datetime NOT NULL,
                    `date_modification` datetime NOT NULL,
                    PRIMARY KEY (`id`),
                    KEY `user_id` (`user_id`),
                    KEY `document_id` (`document_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ";
            $this->conn->exec($query);
            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors de la création de la table des documents: " . $e->getMessage());
            return false;
        }
    }

    public function getDocumentsForUser($user_id) {
        try {
            $this->createTableIfNotExists();
            
            $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = :user_id";
            $stmt = $this->conn->prepare($query);
            
            $user_id = $this->sanitizeInput($user_id);
            $stmt->bindParam(":user_id", $user_id);
            
            $stmt->execute();
            return $stmt;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des documents: " . $e->getMessage());
            return null;
        }
    }

    public function saveDocuments($user_id, $documents) {
        try {
            $this->conn->beginTransaction();
            
            // Supprimer les documents existants pour cet utilisateur
            $deleteQuery = "DELETE FROM " . $this->table_name . " WHERE user_id = :user_id";
            $deleteStmt = $this->conn->prepare($deleteQuery);
            
            $user_id = $this->sanitizeInput($user_id);
            $deleteStmt->bindParam(':user_id', $user_id);
            
            $deleteStmt->execute();
            
            // Insérer les nouveaux documents
            $insertQuery = "INSERT INTO " . $this->table_name . " 
                            (user_id, document_id, nom, fichier_path, responsabilites, etat, date_creation, date_modification) 
                            VALUES (:user_id, :document_id, :nom, :fichier_path, :responsabilites, :etat, :date_creation, :date_modification)";
            
            $insertStmt = $this->conn->prepare($insertQuery);
            
            foreach ($documents as $document) {
                $document_id = $this->sanitizeInput($document->id);
                $nom = $this->sanitizeInput($document->nom);
                $fichier_path = $document->fichier_path ? $this->sanitizeInput($document->fichier_path) : null;
                
                // Convertir les responsabilités en JSON
                $responsabilites = json_encode($document->responsabilites);
                
                $etat = $document->etat !== null ? $this->sanitizeInput($document->etat) : null;
                
                // Convertir les dates au format SQL
                $dateCrea = new DateTime($document->date_creation);
                $dateCreationSQL = $dateCrea->format('Y-m-d H:i:s');
                
                $dateMod = new DateTime($document->date_modification);
                $dateModificationSQL = $dateMod->format('Y-m-d H:i:s');
                
                $insertStmt->bindParam(':user_id', $user_id);
                $insertStmt->bindParam(':document_id', $document_id);
                $insertStmt->bindParam(':nom', $nom);
                $insertStmt->bindParam(':fichier_path', $fichier_path);
                $insertStmt->bindParam(':responsabilites', $responsabilites);
                $insertStmt->bindParam(':etat', $etat);
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
            error_log("Erreur lors de la sauvegarde des documents: " . $e->getMessage());
            return false;
        }
    }

    protected function createTableIfNotExists() {
        return $this->createDocumentsTable();
    }
}
?>
