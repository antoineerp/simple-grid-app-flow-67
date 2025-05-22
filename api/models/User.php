
<?php
class User {
    // Connexion à la base de données
    public $conn;
    public $table = 'utilisateurs_p71x6d_richard';
    
    // Propriétés de l'utilisateur
    public $id;
    public $nom;
    public $prenom;
    public $email;
    public $mot_de_passe;
    public $identifiant_technique;
    public $role;
    public $date_creation;
    
    // Constructeur avec connexion à la base de données
    public function __construct($db) {
        $this->conn = $db;
    }
    
    // Récupérer tous les utilisateurs
    public function getAll() {
        try {
            if (!$this->conn) {
                error_log("User::getAll - Pas de connexion à la base de données");
                return [];
            }
            
            $query = "SELECT id, nom, prenom, email, identifiant_technique, role, date_creation FROM {$this->table} ORDER BY date_creation DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("User::getAll - Erreur PDO: " . $e->getMessage());
            return [];
        } catch (Exception $e) {
            error_log("User::getAll - Exception: " . $e->getMessage());
            return [];
        }
    }
    
    // Récupérer un seul utilisateur
    public function getById($id) {
        try {
            if (!$this->conn) {
                error_log("User::getById - Pas de connexion à la base de données");
                return null;
            }
            
            $query = "SELECT id, nom, prenom, email, identifiant_technique, role, date_creation FROM {$this->table} WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("User::getById - Erreur PDO: " . $e->getMessage());
            return null;
        } catch (Exception $e) {
            error_log("User::getById - Exception: " . $e->getMessage());
            return null;
        }
    }
    
    // Création d'un utilisateur
    public function create() {
        try {
            if (!$this->conn) {
                error_log("User::create - Pas de connexion à la base de données");
                return false;
            }
            
            // Vérifier que les champs requis sont remplis
            if (!$this->nom || !$this->prenom || !$this->email || !$this->mot_de_passe) {
                error_log("User::create - Données utilisateur incomplètes");
                return false;
            }
            
            // Si l'identifiant technique n'est pas défini, générer un identifiant par défaut
            if (!$this->identifiant_technique) {
                $this->identifiant_technique = 'user_' . uniqid();
            }
            
            // Si le rôle n'est pas défini, utiliser 'utilisateur' par défaut
            if (!$this->role) {
                $this->role = 'utilisateur';
            }
            
            // Hacher le mot de passe
            $hashedPassword = password_hash($this->mot_de_passe, PASSWORD_DEFAULT);
            
            // Requête d'insertion
            $query = "INSERT INTO {$this->table} 
                      (nom, prenom, email, mot_de_passe, identifiant_technique, role, date_creation) 
                      VALUES (:nom, :prenom, :email, :mot_de_passe, :identifiant_technique, :role, NOW())";
            
            $stmt = $this->conn->prepare($query);
            
            // Nettoyage des données
            $this->nom = htmlspecialchars(strip_tags($this->nom));
            $this->prenom = htmlspecialchars(strip_tags($this->prenom));
            $this->email = htmlspecialchars(strip_tags($this->email));
            $this->role = htmlspecialchars(strip_tags($this->role));
            $this->identifiant_technique = htmlspecialchars(strip_tags($this->identifiant_technique));
            
            // Binding des paramètres
            $stmt->bindParam(':nom', $this->nom);
            $stmt->bindParam(':prenom', $this->prenom);
            $stmt->bindParam(':email', $this->email);
            $stmt->bindParam(':mot_de_passe', $hashedPassword);
            $stmt->bindParam(':identifiant_technique', $this->identifiant_technique);
            $stmt->bindParam(':role', $this->role);
            
            // Exécution de la requête
            if ($stmt->execute()) {
                $this->id = $this->conn->lastInsertId();
                $this->date_creation = date('Y-m-d H:i:s');
                error_log("User::create - Utilisateur créé avec succès: ID {$this->id}, identifiant {$this->identifiant_technique}");
                return true;
            }
            
            error_log("User::create - Échec de la création de l'utilisateur");
            return false;
            
        } catch (PDOException $e) {
            error_log("User::create - Erreur PDO: " . $e->getMessage());
            return false;
        } catch (Exception $e) {
            error_log("User::create - Exception: " . $e->getMessage());
            return false;
        }
    }
    
    // Mise à jour d'un utilisateur
    public function update() {
        try {
            if (!$this->conn || !$this->id) {
                error_log("User::update - Pas de connexion à la base de données ou ID manquant");
                return false;
            }
            
            $setFields = [];
            $params = [];
            
            // Construire dynamiquement les champs à mettre à jour
            if ($this->nom) {
                $setFields[] = "nom = :nom";
                $params[':nom'] = htmlspecialchars(strip_tags($this->nom));
            }
            
            if ($this->prenom) {
                $setFields[] = "prenom = :prenom";
                $params[':prenom'] = htmlspecialchars(strip_tags($this->prenom));
            }
            
            if ($this->email) {
                $setFields[] = "email = :email";
                $params[':email'] = htmlspecialchars(strip_tags($this->email));
            }
            
            if ($this->mot_de_passe) {
                $setFields[] = "mot_de_passe = :mot_de_passe";
                $params[':mot_de_passe'] = password_hash($this->mot_de_passe, PASSWORD_DEFAULT);
            }
            
            if ($this->role) {
                $setFields[] = "role = :role";
                $params[':role'] = htmlspecialchars(strip_tags($this->role));
            }
            
            // Si aucun champ à mettre à jour, retourner true
            if (empty($setFields)) {
                error_log("User::update - Aucun champ à mettre à jour");
                return true;
            }
            
            $setClause = implode(", ", $setFields);
            $query = "UPDATE {$this->table} SET {$setClause} WHERE id = :id";
            
            $stmt = $this->conn->prepare($query);
            $params[':id'] = $this->id;
            
            // Binding des paramètres
            foreach ($params as $key => &$value) {
                $stmt->bindParam($key, $value);
            }
            
            // Exécution de la requête
            if ($stmt->execute()) {
                error_log("User::update - Utilisateur mis à jour avec succès: ID {$this->id}");
                return true;
            }
            
            error_log("User::update - Échec de la mise à jour de l'utilisateur");
            return false;
            
        } catch (PDOException $e) {
            error_log("User::update - Erreur PDO: " . $e->getMessage());
            return false;
        } catch (Exception $e) {
            error_log("User::update - Exception: " . $e->getMessage());
            return false;
        }
    }
    
    // Suppression d'un utilisateur
    public function delete() {
        try {
            if (!$this->conn || !$this->id) {
                error_log("User::delete - Pas de connexion à la base de données ou ID manquant");
                return false;
            }
            
            $query = "DELETE FROM {$this->table} WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $this->id);
            
            // Exécution de la requête
            if ($stmt->execute()) {
                error_log("User::delete - Utilisateur supprimé avec succès: ID {$this->id}");
                return true;
            }
            
            error_log("User::delete - Échec de la suppression de l'utilisateur");
            return false;
            
        } catch (PDOException $e) {
            error_log("User::delete - Erreur PDO: " . $e->getMessage());
            return false;
        } catch (Exception $e) {
            error_log("User::delete - Exception: " . $e->getMessage());
            return false;
        }
    }
    
    // Vérifier si un utilisateur existe déjà
    public function exists($email = null, $identifiant = null) {
        try {
            if (!$this->conn) {
                error_log("User::exists - Pas de connexion à la base de données");
                return false;
            }
            
            $conditions = [];
            $params = [];
            
            if ($email) {
                $conditions[] = "email = :email";
                $params[':email'] = $email;
            }
            
            if ($identifiant) {
                $conditions[] = "identifiant_technique = :identifiant";
                $params[':identifiant'] = $identifiant;
            }
            
            if (empty($conditions)) {
                error_log("User::exists - Aucun critère de recherche spécifié");
                return false;
            }
            
            $whereClause = implode(" OR ", $conditions);
            $query = "SELECT COUNT(*) as count FROM {$this->table} WHERE {$whereClause}";
            
            $stmt = $this->conn->prepare($query);
            
            foreach ($params as $key => &$value) {
                $stmt->bindParam($key, $value);
            }
            
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result['count'] > 0;
            
        } catch (PDOException $e) {
            error_log("User::exists - Erreur PDO: " . $e->getMessage());
            return false;
        } catch (Exception $e) {
            error_log("User::exists - Exception: " . $e->getMessage());
            return false;
        }
    }
}
?>
