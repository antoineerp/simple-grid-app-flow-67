
<?php
trait UserQueries {
    public function read() {
        try {
            $this->createTableIfNotExists();
            
            $query = "SELECT id, nom, prenom, email, identifiant_technique, role, date_creation, mot_de_passe
                    FROM " . $this->table_name . "
                    ORDER BY id DESC";

            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt;
        } catch (PDOException $e) {
            error_log("Erreur lors de la lecture des utilisateurs: " . $e->getMessage());
            throw $e;
        }
    }

    public function create() {
        try {
            error_log("Création d'un nouvel utilisateur: début");
            $this->createTableIfNotExists();
            
            error_log("Table vérifiée, préparation de la requête INSERT");
            
            // Vérifier que les propriétés nécessaires sont définies
            if (empty($this->nom) || empty($this->prenom) || empty($this->email) || 
                empty($this->identifiant_technique) || empty($this->role)) {
                error_log("Erreur: données utilisateur incomplètes");
                throw new Exception("Données utilisateur incomplètes");
            }
            
            $query = "INSERT INTO " . $this->table_name . "
                    (nom, prenom, email, mot_de_passe, identifiant_technique, role, date_creation)
                    VALUES
                    (:nom, :prenom, :email, :mot_de_passe, :identifiant_technique, :role, NOW())";

            $stmt = $this->conn->prepare($query);
            
            // Nettoyage des données
            foreach (['nom', 'prenom', 'email', 'identifiant_technique', 'role'] as $field) {
                error_log("Nettoyage du champ {$field}: " . $this->$field);
                $this->$field = $this->cleanUTF8($this->sanitizeInput($this->$field));
                error_log("Après nettoyage: " . $this->$field);
            }

            // Hash du mot de passe s'il n'est pas déjà hashé
            if (!empty($this->mot_de_passe)) {
                $passwordInfo = password_get_info($this->mot_de_passe);
                error_log("Info mot de passe - algo: " . ($passwordInfo['algo'] ?? 'none'));
                
                if (!$passwordInfo['algo']) {
                    error_log("Hashage du mot de passe");
                    $this->mot_de_passe = password_hash($this->mot_de_passe, PASSWORD_BCRYPT);
                }
            } else {
                // Générer un mot de passe aléatoire si non fourni
                error_log("Génération d'un mot de passe par défaut");
                $this->mot_de_passe = password_hash('password123', PASSWORD_BCRYPT);
            }

            // Binding des paramètres
            error_log("Binding des paramètres");
            $stmt->bindParam(":nom", $this->nom);
            $stmt->bindParam(":prenom", $this->prenom);
            $stmt->bindParam(":email", $this->email);
            $stmt->bindParam(":mot_de_passe", $this->mot_de_passe);
            $stmt->bindParam(":identifiant_technique", $this->identifiant_technique);
            $stmt->bindParam(":role", $this->role);

            // Exécution de la requête
            error_log("Exécution de la requête INSERT");
            if (!$stmt->execute()) {
                $errorInfo = $stmt->errorInfo();
                error_log("Erreur SQL lors de la création: " . json_encode($errorInfo));
                throw new Exception("Erreur SQL: " . ($errorInfo[2] ?? "Erreur inconnue"));
            }
            
            error_log("Création de l'utilisateur réussie");
            return true;
        } catch (PDOException $e) {
            error_log("Exception PDO lors de la création d'un utilisateur: " . $e->getMessage());
            error_log("Trace: " . $e->getTraceAsString());
            throw $e;
        }
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . "
                SET nom = :nom, prenom = :prenom, email = :email, role = :role
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        foreach (['id', 'nom', 'prenom', 'email', 'role'] as $field) {
            $this->$field = $this->cleanUTF8($this->sanitizeInput($this->$field));
        }

        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":nom", $this->nom);
        $stmt->bindParam(":prenom", $this->prenom);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":role", $this->role);

        return $stmt->execute();
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        
        $this->id = $this->cleanUTF8($this->sanitizeInput($this->id));
        $stmt->bindParam(1, $this->id);

        return $stmt->execute();
    }
}
?>
