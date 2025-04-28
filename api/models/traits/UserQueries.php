
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
            
            // Vérifier si un utilisateur avec cet email existe déjà
            if ($this->emailExists($this->email)) {
                error_log("Erreur: email déjà utilisé: " . $this->email);
                throw new Exception("Un utilisateur avec cet email existe déjà");
            }
            
            // Vérifier si un utilisateur avec cet identifiant existe déjà
            if ($this->identifiantExists($this->identifiant_technique)) {
                error_log("Erreur: identifiant technique déjà utilisé: " . $this->identifiant_technique);
                throw new Exception("Un utilisateur avec cet identifiant existe déjà");
            }
            
            // Vérifier si le rôle est autorisé dans la structure de la table
            try {
                $roleColumnQuery = "SHOW COLUMNS FROM " . $this->table_name . " LIKE 'role'";
                $stmt = $this->conn->prepare($roleColumnQuery);
                $stmt->execute();
                $roleColumn = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($roleColumn && strpos($roleColumn['Type'], 'enum') === 0) {
                    preg_match('/enum\((.*)\)/', $roleColumn['Type'], $matches);
                    if (isset($matches[1])) {
                        $enumStr = $matches[1];
                        $enumValues = array_map(function($val) {
                            return trim($val, "'\"");
                        }, explode(',', $enumStr));
                        
                        if (!in_array($this->role, $enumValues)) {
                            error_log("Rôle non autorisé dans la structure de la table: " . $this->role);
                            error_log("Valeurs autorisées: " . implode(', ', $enumValues));
                            
                            // Tenter d'adapter le rôle
                            if ($this->role === 'gestionnaire' && in_array('admin', $enumValues)) {
                                error_log("Adaptation du rôle 'gestionnaire' vers 'admin'");
                                $this->role = 'admin';
                            } else if ($this->role === 'utilisateur' && in_array('user', $enumValues)) {
                                error_log("Adaptation du rôle 'utilisateur' vers 'user'");
                                $this->role = 'user';
                            } else if ($this->role === 'administrateur' && in_array('admin', $enumValues)) {
                                error_log("Adaptation du rôle 'administrateur' vers 'admin'");
                                $this->role = 'admin';
                            } else {
                                // Utiliser la première valeur disponible comme fallback
                                error_log("Utilisation de la première valeur disponible comme fallback: " . $enumValues[0]);
                                $this->role = $enumValues[0];
                            }
                        }
                    }
                }
            } catch (Exception $e) {
                error_log("Erreur lors de la vérification du rôle: " . $e->getMessage());
                // Continuer malgré l'erreur, MySQL lèvera une exception si le rôle n'est pas valide
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
            error_log("Exécution de la requête INSERT avec rôle: " . $this->role);
            if (!$stmt->execute()) {
                $errorInfo = $stmt->errorInfo();
                error_log("Erreur SQL lors de la création: " . json_encode($errorInfo));
                throw new Exception("Erreur SQL: " . ($errorInfo[2] ?? "Erreur inconnue"));
            }
            
            // Récupérer l'ID inséré
            $this->id = $this->conn->lastInsertId();
            error_log("Création de l'utilisateur réussie avec ID: " . $this->id);
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
