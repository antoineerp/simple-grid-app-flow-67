
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
            $this->createTableIfNotExists();
            
            $query = "INSERT INTO " . $this->table_name . "
                    (nom, prenom, email, mot_de_passe, identifiant_technique, role, date_creation)
                    VALUES
                    (:nom, :prenom, :email, :mot_de_passe, :identifiant_technique, :role, NOW())";

            $stmt = $this->conn->prepare($query);
            
            foreach (['nom', 'prenom', 'email', 'identifiant_technique', 'role'] as $field) {
                $this->$field = $this->cleanUTF8($this->sanitizeInput($this->$field));
            }

            if (!password_get_info($this->mot_de_passe)['algo']) {
                $this->mot_de_passe = password_hash($this->mot_de_passe, PASSWORD_BCRYPT);
            }

            $stmt->bindParam(":nom", $this->nom);
            $stmt->bindParam(":prenom", $this->prenom);
            $stmt->bindParam(":email", $this->email);
            $stmt->bindParam(":mot_de_passe", $this->mot_de_passe);
            $stmt->bindParam(":identifiant_technique", $this->identifiant_technique);
            $stmt->bindParam(":role", $this->role);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Erreur lors de la création d'un utilisateur: " . $e->getMessage());
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
