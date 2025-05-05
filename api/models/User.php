
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
        
        // Vérifier le format de l'identifiant
        if (empty($identifiant) || strpos($identifiant, 'p71x6d_') !== 0) {
            error_log("Identifiant technique invalide: {$identifiant}");
            return false;
        }
        
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
            // Vérifier et corriger l'identifiant technique si nécessaire
            if (empty($row['identifiant_technique']) || strpos($row['identifiant_technique'], 'p71x6d_') !== 0) {
                $identifiant_technique = 'p71x6d_' . preg_replace('/[^a-z0-9]/', '', strtolower($row['nom']));
                
                // Mettre à jour l'utilisateur dans la base de données
                $update = $this->conn->prepare("UPDATE " . $this->table_name . " SET identifiant_technique = ? WHERE id = ?");
                $update->execute([$identifiant_technique, $row['id']]);
                
                error_log("Identifiant technique corrigé pour l'utilisateur {$row['id']}: {$identifiant_technique}");
                
                $row['identifiant_technique'] = $identifiant_technique;
            }
            
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
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Vérifier et corriger l'identifiant technique si nécessaire
            if ($user && (empty($user['identifiant_technique']) || strpos($user['identifiant_technique'], 'p71x6d_') !== 0)) {
                $identifiant_technique = 'p71x6d_' . preg_replace('/[^a-z0-9]/', '', strtolower($user['nom']));
                
                // Mettre à jour l'utilisateur dans la base de données
                $update = $this->conn->prepare("UPDATE " . $this->table_name . " SET identifiant_technique = ? WHERE id = ?");
                $update->execute([$identifiant_technique, $user['id']]);
                
                error_log("Identifiant technique corrigé pour l'utilisateur {$user['id']}: {$identifiant_technique}");
                
                $user['identifiant_technique'] = $identifiant_technique;
            }
            
            return $user;
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
            $manager = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Vérifier et corriger l'identifiant technique si nécessaire
            if ($manager && (empty($manager['identifiant_technique']) || strpos($manager['identifiant_technique'], 'p71x6d_') !== 0)) {
                $identifiant_technique = 'p71x6d_' . preg_replace('/[^a-z0-9]/', '', strtolower($manager['nom']));
                
                // Mettre à jour l'utilisateur dans la base de données
                $update = $this->conn->prepare("UPDATE " . $this->table_name . " SET identifiant_technique = ? WHERE id = ?");
                $update->execute([$identifiant_technique, $manager['id']]);
                
                error_log("Identifiant technique corrigé pour le gestionnaire {$manager['id']}: {$identifiant_technique}");
                
                $manager['identifiant_technique'] = $identifiant_technique;
            }
            
            return $manager;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération du gestionnaire: " . $e->getMessage());
            return null;
        }
    }

    public function initializeUserDataFromManager($userId) {
        try {
            error_log("Initialisation des données pour l'utilisateur: $userId");
            
            // Vérifier le format de l'identifiant utilisateur
            if (empty($userId) || strpos($userId, 'p71x6d_') !== 0) {
                error_log("Format d'identifiant utilisateur invalide: $userId");
                return false;
            }
            
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
