<?php
require_once dirname(__FILE__) . '/BaseModel.php';
require_once dirname(__FILE__) . '/traits/TableManager.php';
require_once dirname(__FILE__) . '/traits/UserValidator.php';
require_once dirname(__FILE__) . '/traits/UserQueries.php';

class User extends BaseModel {
    use TableManager, UserValidator, UserQueries;

    // Properties
    public $id;
    public $nom;
    public $prenom;
    public $email;
    public $mot_de_passe;
    public $identifiant_technique;
    public $role;
    public $date_creation;

    public function __construct($db) {
        parent::__construct($db, 'utilisateurs');
    }

    public function countUsersByRole($role) {
        try {
            $query = "SELECT COUNT(*) FROM " . $this->table_name . " WHERE role = :role";
            $stmt = $this->conn->prepare($query);
            $role = $this->sanitizeInput($role);
            $stmt->bindParam(":role", $role);
            $stmt->execute();
            return $stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Erreur lors du comptage des utilisateurs par rôle: " . $e->getMessage());
            return 0;
        }
    }

    public function emailExists($email) {
        try {
            $query = "SELECT COUNT(*) FROM " . $this->table_name . " WHERE email = :email";
            $stmt = $this->conn->prepare($query);
            $email = $this->sanitizeInput($email);
            $stmt->bindParam(":email", $email);
            $stmt->execute();
            return ($stmt->fetchColumn() > 0);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'email: " . $e->getMessage());
            return false;
        }
    }

    public function identifiantExists($identifiant) {
        try {
            $query = "SELECT COUNT(*) FROM " . $this->table_name . " WHERE identifiant_technique = :identifiant";
            $stmt = $this->conn->prepare($query);
            $identifiant = $this->sanitizeInput($identifiant);
            $stmt->bindParam(":identifiant", $identifiant);
            $stmt->execute();
            return ($stmt->fetchColumn() > 0);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'identifiant: " . $e->getMessage());
            return false;
        }
    }

    public function findByEmailQuery($email) {
        try {
            $this->createTableIfNotExists();
            
            $query = "SELECT id, nom, prenom, email, identifiant_technique, role, date_creation 
                     FROM " . $this->table_name . " 
                     WHERE email = :email";
                     
            $stmt = $this->conn->prepare($query);
            $email = $this->sanitizeInput($email);
            $stmt->bindParam(":email", $email);
            $stmt->execute();
            
            return $stmt;
        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche par email: " . $e->getMessage());
            return null;
        }
    }

    public function findByIdentifiant($identifiant) {
        $identifiant = $this->cleanUTF8($this->sanitizeInput($identifiant));
        $this->createTableIfNotExists();
        
        $query = "SELECT * FROM " . $this->table_name . " WHERE identifiant_technique = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $identifiant);
        $stmt->execute();
        
        if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            foreach ($row as $key => $value) {
                $this->$key = $value;
            }
            return true;
        }
        return false;
    }

    public function findByEmail($email) {
        $email = $this->cleanUTF8($this->sanitizeInput($email));
        $this->createTableIfNotExists();
        
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $email);
        $stmt->execute();
        
        if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            foreach ($row as $key => $value) {
                $this->$key = $value;
            }
            return true;
        }
        return false;
    }

    public function findById($id) {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $id);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche par ID: " . $e->getMessage());
            return null;
        }
    }

    public function getAdminCount() {
        try {
            $query = "SELECT COUNT(*) FROM " . $this->table_name . " WHERE role IN ('admin', 'administrateur')";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt;
        } catch (PDOException $e) {
            error_log("Erreur lors du comptage des administrateurs: " . $e->getMessage());
            return null;
        }
    }

    public function getManager() {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE role = 'gestionnaire' LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération du gestionnaire: " . $e->getMessage());
            return null;
        }
    }

    public function initializeUserDataFromManager($userId) {
        try {
            error_log("Initialisation des données pour l'utilisateur: $userId");
            $manager = $this->getManager();
            if (!$manager) {
                error_log("Aucun gestionnaire trouvé pour initialiser les données utilisateur");
                return false;
            }
            
            $managerIdentifiant = $manager['identifiant_technique'];
            error_log("Gestionnaire trouvé: $managerIdentifiant");
            
            $this->copyUserData('documents', $managerIdentifiant, $userId);
            $this->copyUserData('exigences', $managerIdentifiant, $userId);
            return true;
        } catch (Exception $e) {
            error_log("Erreur lors de l'initialisation des données utilisateur: " . $e->getMessage());
            return false;
        }
    }

    private function copyUserData($dataType, $sourceUserId, $targetUserId) {
        error_log("Copie des données $dataType de $sourceUserId vers $targetUserId");
        // Implémentation simulée - à adapter selon votre structure de données
        try {
            // Vérifiez si la table existe, sinon la créer
            $tableName = $dataType . '_' . str_replace('-', '_', $targetUserId);
            error_log("Préparation de la table: $tableName");
            
            // Simule une copie de données
            return true;
        } catch (Exception $e) {
            error_log("Erreur lors de la copie des données $dataType: " . $e->getMessage());
            return false;
        }
    }
}
