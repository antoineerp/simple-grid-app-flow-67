<?php
class User {
    // Connexion à la base de données et nom de la table
    private $conn;
    public $table = "utilisateurs_p71x6d_richard"; // Utiliser TOUJOURS cette table
    
    // Propriétés de l'objet
    public $id;
    public $identifiant_technique;
    public $nom;
    public $prenom;
    public $email;
    public $mot_de_passe;
    public $date_creation;
    public $role;
    public $last_login;
    
    // Constructeur avec $db comme connexion à la base de données
    public function __construct($db) {
        $this->conn = $db;
        error_log("Modèle User initialisé avec la table fixe: {$this->table}");
    }
    
    // Créer un nouvel utilisateur
    public function create() {
        try {
            // Vérifier si la table existe, sinon la créer
            $this->checkTableExists();
            
            // Vérifier si l'email existe déjà
            if ($this->emailExists()) {
                return false;
            }
            
            // Vérifier le nombre de gestionnaires si le rôle est "gestionnaire"
            if ($this->role === "gestionnaire" && $this->countGestionnaires() > 0) {
                error_log("Impossible de créer plus d'un gestionnaire");
                return false;
            }
            
            // Générer un identifiant technique s'il n'est pas défini
            if (empty($this->identifiant_technique)) {
                $this->identifiant_technique = $this->generateTechnicalId();
            }
            
            // Préparer la requête d'insertion
            $query = "INSERT INTO " . $this->table . " 
                    (identifiant_technique, nom, prenom, email, mot_de_passe, role) 
                    VALUES
                    (:identifiant_technique, :nom, :prenom, :email, :mot_de_passe, :role)";
                    
            error_log("Requête de création: " . $query);
            
            $stmt = $this->conn->prepare($query);
            
            // Nettoyer les données
            $this->nom = htmlspecialchars(strip_tags($this->nom));
            $this->prenom = htmlspecialchars(strip_tags($this->prenom));
            $this->email = htmlspecialchars(strip_tags($this->email));
            $this->role = htmlspecialchars(strip_tags($this->role));
            
            // Hacher le mot de passe s'il est fourni
            if (!empty($this->mot_de_passe)) {
                $this->mot_de_passe = password_hash($this->mot_de_passe, PASSWORD_DEFAULT);
            } else {
                // Générer un mot de passe aléatoire si non fourni
                $randomPass = bin2hex(random_bytes(4));
                $this->mot_de_passe = password_hash($randomPass, PASSWORD_DEFAULT);
            }
            
            // Liaison des valeurs
            $stmt->bindParam(":identifiant_technique", $this->identifiant_technique);
            $stmt->bindParam(":nom", $this->nom);
            $stmt->bindParam(":prenom", $this->prenom);
            $stmt->bindParam(":email", $this->email);
            $stmt->bindParam(":mot_de_passe", $this->mot_de_passe);
            $stmt->bindParam(":role", $this->role);
            
            error_log("Tentative de création d'utilisateur: " . $this->prenom . " " . $this->nom . " (" . $this->email . ")");
            
            // Exécuter la requête
            if ($stmt->execute()) {
                $this->id = $this->conn->lastInsertId();
                error_log("Utilisateur créé avec succès. ID: " . $this->id);
                return true;
            }
            
            error_log("Échec de la création de l'utilisateur: " . json_encode($stmt->errorInfo()));
            return false;
            
        } catch (PDOException $e) {
            error_log("Exception lors de la création de l'utilisateur: " . $e->getMessage());
            return false;
        }
    }
    
    // Vérifier si la table existe, sinon la créer
    private function checkTableExists() {
        try {
            $query = "SHOW TABLES LIKE '" . $this->table . "'";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            if ($stmt->rowCount() == 0) {
                error_log("La table {$this->table} n'existe pas, création en cours...");
                
                // Créer la table
                $createTableQuery = "CREATE TABLE " . $this->table . " (
                    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    identifiant_technique VARCHAR(255) NOT NULL UNIQUE,
                    nom VARCHAR(100) NOT NULL,
                    prenom VARCHAR(100) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    mot_de_passe VARCHAR(255) NOT NULL,
                    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    role ENUM('admin', 'user', 'administrateur', 'utilisateur', 'gestionnaire') NOT NULL DEFAULT 'utilisateur',
                    last_login TIMESTAMP NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
                
                $this->conn->exec($createTableQuery);
                error_log("Table {$this->table} créée avec succès.");
            }
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification/création de la table: " . $e->getMessage());
            throw $e;
        }
    }
    
    // Vérifier si l'email existe déjà
    public function emailExists() {
        try {
            $query = "SELECT COUNT(*) FROM " . $this->table . " WHERE email = :email";
            $stmt = $this->conn->prepare($query);
            $this->email = htmlspecialchars(strip_tags($this->email));
            $stmt->bindParam(":email", $this->email);
            $stmt->execute();
            
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence de l'email: " . $e->getMessage());
            return false;
        }
    }
    
    // Compter le nombre de gestionnaires
    private function countGestionnaires() {
        try {
            $query = "SELECT COUNT(*) FROM " . $this->table . " WHERE role = 'gestionnaire'";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            return $stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Erreur lors du comptage des gestionnaires: " . $e->getMessage());
            return 0;
        }
    }
    
    // Générer un identifiant technique
    private function generateTechnicalId() {
        $prefix = "p71x6d_";
        $timestamp = time();
        $random = bin2hex(random_bytes(4));
        
        $technicalId = $prefix . strtolower(substr($this->nom, 0, 3) . substr($this->prenom, 0, 3) . "_" . $timestamp . $random);
        
        return $technicalId;
    }
    
    // Autres méthodes (lire, mettre à jour, supprimer, etc.)
    // Lire les données d'un utilisateur par ID
    public function readOne() {
        try {
            $query = "SELECT * FROM " . $this->table . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $this->id);
            $stmt->execute();
            
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($row) {
                $this->identifiant_technique = $row['identifiant_technique'];
                $this->nom = $row['nom'];
                $this->prenom = $row['prenom'];
                $this->email = $row['email'];
                $this->mot_de_passe = $row['mot_de_passe'];
                $this->date_creation = $row['date_creation'];
                $this->role = $row['role'];
                $this->last_login = $row['last_login'];
                
                return true;
            }
            
            return false;
        } catch (PDOException $e) {
            error_log("Erreur lors de la lecture des données de l'utilisateur: " . $e->getMessage());
            return false;
        }
    }
    
    // Mettre à jour les données d'un utilisateur
    public function update() {
        try {
            $query = "UPDATE " . $this->table . "
                    SET
                        nom = :nom,
                        prenom = :prenom,
                        email = :email,
                        mot_de_passe = :mot_de_passe,
                        role = :role
                    WHERE id = :id";
            
            $stmt = $this->conn->prepare($query);
            
            // Nettoyer les données
            $this->nom = htmlspecialchars(strip_tags($this->nom));
            $this->prenom = htmlspecialchars(strip_tags($this->prenom));
            $this->email = htmlspecialchars(strip_tags($this->email));
            $this->role = htmlspecialchars(strip_tags($this->role));
            
            // Hacher le mot de passe s'il est fourni
            if (!empty($this->mot_de_passe)) {
                $this->mot_de_passe = password_hash($this->mot_de_passe, PASSWORD_DEFAULT);
            }
            
            // Liaison des valeurs
            $stmt->bindParam(":nom", $this->nom);
            $stmt->bindParam(":prenom", $this->prenom);
            $stmt->bindParam(":email", $this->email);
            $stmt->bindParam(":mot_de_passe", $this->mot_de_passe);
            $stmt->bindParam(":role", $this->role);
            $stmt->bindParam(":id", $this->id);
            
            // Exécuter la requête
            if ($stmt->execute()) {
                return true;
            }
            
            return false;
        } catch (PDOException $e) {
            error_log("Erreur lors de la mise à jour des données de l'utilisateur: " . $e->getMessage());
            return false;
        }
    }
    
    // Supprimer un utilisateur
    public function delete() {
        try {
            $query = "DELETE FROM " . $this->table . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $this->id);
            
            // Exécuter la requête
            if ($stmt->execute()) {
                return true;
            }
            
            return false;
        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de l'utilisateur: " . $e->getMessage());
            return false;
        }
    }
}
?>
