
<?php
// Fonction pour nettoyer les données UTF-8 si elle n'existe pas encore
if (!function_exists('cleanUTF8')) {
    function cleanUTF8($input) {
        if (is_string($input)) {
            return mb_convert_encoding($input, 'UTF-8', 'UTF-8');
        } elseif (is_array($input)) {
            foreach ($input as $key => $value) {
                $input[$key] = cleanUTF8($value);
            }
        }
        return $input;
    }
}

class User {
    // Connexion à la base de données et nom de la table
    private $conn;
    private $table_name = "utilisateurs";

    // Propriétés de l'objet
    public $id;
    public $nom;
    public $prenom;
    public $email;
    public $mot_de_passe;
    public $identifiant_technique;
    public $role;
    public $date_creation;

    // Constructeur avec $db comme connexion à la base de données
    public function __construct($db) {
        $this->conn = $db;
    }

    // Lire tous les utilisateurs
    public function read() {
        try {
            // Vérifier si la table existe
            $this->createTableIfNotExists();
            
            // Requête select all
            $query = "SELECT
                        id, nom, prenom, email, identifiant_technique, role, date_creation, mot_de_passe
                    FROM
                        " . $this->table_name . "
                    ORDER BY
                        id DESC";

            // Préparation de la requête
            $stmt = $this->conn->prepare($query);

            // Exécution de la requête
            $stmt->execute();

            return $stmt;
        } catch (PDOException $e) {
            error_log("Erreur lors de la lecture des utilisateurs: " . $e->getMessage());
            throw $e;
        }
    }

    // Vérifier si un email existe déjà
    public function emailExists($email) {
        try {
            $query = "SELECT COUNT(*) FROM " . $this->table_name . " WHERE email = :email";
            $stmt = $this->conn->prepare($query);
            $email = htmlspecialchars(strip_tags($email));
            $stmt->bindParam(":email", $email);
            $stmt->execute();
            
            return ($stmt->fetchColumn() > 0);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'email: " . $e->getMessage());
            return false;
        }
    }
    
    // Vérifier si un identifiant technique existe déjà
    public function identifiantExists($identifiant) {
        try {
            $query = "SELECT COUNT(*) FROM " . $this->table_name . " WHERE identifiant_technique = :identifiant";
            $stmt = $this->conn->prepare($query);
            $identifiant = htmlspecialchars(strip_tags($identifiant));
            $stmt->bindParam(":identifiant", $identifiant);
            $stmt->execute();
            
            return ($stmt->fetchColumn() > 0);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'identifiant: " . $e->getMessage());
            return false;
        }
    }
    
    // Fonction pour rechercher par email et retourner la requête préparée
    public function findByEmailQuery($email) {
        try {
            $this->createTableIfNotExists();
            
            $query = "SELECT id, nom, prenom, email, identifiant_technique, role, date_creation 
                     FROM " . $this->table_name . " 
                     WHERE email = :email";
                     
            $stmt = $this->conn->prepare($query);
            $email = htmlspecialchars(strip_tags($email));
            $stmt->bindParam(":email", $email);
            $stmt->execute();
            
            return $stmt;
        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche par email: " . $e->getMessage());
            return null;
        }
    }

    // Créer un utilisateur
    public function create() {
        try {
            // Vérifier si la table existe
            $this->createTableIfNotExists();
            
            // Log pour voir l'état avant la création
            error_log("Création d'utilisateur - Table vérifiée/créée");
            
            // Requête d'insertion - IMPORTANTE: Ne PAS inclure l'ID pour permettre l'auto-incrémentation
            $query = "INSERT INTO " . $this->table_name . "
                    (nom, prenom, email, mot_de_passe, identifiant_technique, role, date_creation)
                    VALUES
                    (:nom, :prenom, :email, :mot_de_passe, :identifiant_technique, :role, NOW())";

            error_log("Requête SQL préparée: " . $query);

            // Préparation de la requête
            $stmt = $this->conn->prepare($query);

            // Nettoyage et sécurisation des données
            $this->nom = htmlspecialchars(strip_tags($this->nom));
            $this->prenom = htmlspecialchars(strip_tags($this->prenom));
            $this->email = htmlspecialchars(strip_tags($this->email));
            $this->identifiant_technique = htmlspecialchars(strip_tags($this->identifiant_technique));
            $this->role = htmlspecialchars(strip_tags($this->role));

            // Convertir explicitement en UTF-8 et s'assurer que les chaînes sont valides
            $this->nom = cleanUTF8($this->nom);
            $this->prenom = cleanUTF8($this->prenom);
            $this->email = cleanUTF8($this->email);
            $this->identifiant_technique = cleanUTF8($this->identifiant_technique);
            $this->role = cleanUTF8($this->role);
            
            // Vérifier que ces valeurs ne sont pas vides
            if (empty($this->nom) || empty($this->prenom) || empty($this->email) || 
                empty($this->identifiant_technique) || empty($this->role)) {
                error_log("Erreur: Valeurs requises manquantes après nettoyage");
                return false;
            }
            
            error_log("Données après nettoyage - Nom: {$this->nom}, Prénom: {$this->prenom}, Email: {$this->email}");

            // Hachage du mot de passe si ce n'est pas déjà fait
            if (!password_get_info($this->mot_de_passe)['algo']) {
                $this->mot_de_passe = password_hash($this->mot_de_passe, PASSWORD_BCRYPT);
            }

            // Liaison des valeurs
            $stmt->bindParam(":nom", $this->nom);
            $stmt->bindParam(":prenom", $this->prenom);
            $stmt->bindParam(":email", $this->email);
            $stmt->bindParam(":mot_de_passe", $this->mot_de_passe);
            $stmt->bindParam(":identifiant_technique", $this->identifiant_technique);
            $stmt->bindParam(":role", $this->role);

            // Exécution de la requête
            if($stmt->execute()) {
                error_log("Requête SQL exécutée avec succès");
                return true;
            }

            error_log("Échec de l'exécution SQL: " . implode(", ", $stmt->errorInfo()));
            return false;
        } catch (PDOException $e) {
            error_log("Erreur PDO lors de la création d'un utilisateur: " . $e->getMessage());
            throw $e;
        } catch (Exception $e) {
            error_log("Exception lors de la création d'un utilisateur: " . $e->getMessage());
            throw $e;
        }
    }

    // S'assurer que la table existe, sinon la créer
    private function createTableIfNotExists() {
        try {
            // Vérifier si la table existe
            $tableExistsQuery = "SHOW TABLES LIKE '" . $this->table_name . "'";
            $stmt = $this->conn->prepare($tableExistsQuery);
            $stmt->execute();
            
            if ($stmt->rowCount() == 0) {
                // La table n'existe pas, la créer avec l'encodage utf8mb4
                $createTableSQL = "CREATE TABLE IF NOT EXISTS `" . $this->table_name . "` (
                    `id` int(11) NOT NULL AUTO_INCREMENT,
                    `nom` varchar(100) NOT NULL,
                    `prenom` varchar(100) NOT NULL,
                    `email` varchar(255) NOT NULL,
                    `mot_de_passe` varchar(255) NOT NULL,
                    `identifiant_technique` varchar(100) NOT NULL,
                    `role` varchar(20) NOT NULL,
                    `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    UNIQUE KEY `email` (`email`),
                    UNIQUE KEY `identifiant_technique` (`identifiant_technique`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
                
                $this->conn->exec($createTableSQL);
                error_log("Table 'utilisateurs' créée avec succès - charset=utf8mb4 collate=utf8mb4_unicode_ci");
                
                // Insertion d'un utilisateur administrateur par défaut
                $adminPassword = password_hash('admin123', PASSWORD_BCRYPT);
                $insertAdminQuery = "INSERT INTO `" . $this->table_name . "` 
                    (`nom`, `prenom`, `email`, `mot_de_passe`, `identifiant_technique`, `role`, `date_creation`) VALUES
                    ('Admin', 'Système', 'admin@qualiopi.ch', '" . $adminPassword . "', 'p71x6d_system', 'admin', NOW());";
                
                $this->conn->exec($insertAdminQuery);
                error_log("Utilisateur administrateur créé par défaut");
            } else {
                // La table existe, vérifier et éventuellement mettre à jour l'encodage
                $tableInfoQuery = "SELECT CCSA.character_set_name, CCSA.collation_name 
                                FROM information_schema.`TABLES` T, 
                                information_schema.`COLLATION_CHARACTER_SET_APPLICABILITY` CCSA 
                                WHERE CCSA.collation_name = T.table_collation 
                                AND T.table_schema = DATABASE() 
                                AND T.table_name = '" . $this->table_name . "'";
                $stmt = $this->conn->prepare($tableInfoQuery);
                $stmt->execute();
                $tableInfo = $stmt->fetch(PDO::FETCH_ASSOC);
                
                error_log("Table 'utilisateurs' existe déjà. Charset: " . ($tableInfo['character_set_name'] ?? 'inconnu') . 
                        ", Collation: " . ($tableInfo['collation_name'] ?? 'inconnue'));
            }
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification/création de la table: " . $e->getMessage());
            // Ne pas propager cette exception, car nous voulons continuer même si la table existe déjà
        }
    }

    // Mettre à jour un utilisateur
    public function update() {
        // Requête de mise à jour
        $query = "UPDATE " . $this->table_name . "
                SET
                    nom = :nom,
                    prenom = :prenom,
                    email = :email,
                    role = :role
                WHERE
                    id = :id";

        // Préparation de la requête
        $stmt = $this->conn->prepare($query);

        // Nettoyage et sécurisation des données
        $this->id = htmlspecialchars(strip_tags($this->id));
        $this->nom = htmlspecialchars(strip_tags($this->nom));
        $this->prenom = htmlspecialchars(strip_tags($this->prenom));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->role = htmlspecialchars(strip_tags($this->role));

        // Convertir explicitement en UTF-8
        $this->id = cleanUTF8($this->id);
        $this->nom = cleanUTF8($this->nom);
        $this->prenom = cleanUTF8($this->prenom);
        $this->email = cleanUTF8($this->email);
        $this->role = cleanUTF8($this->role);

        // Liaison des valeurs
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":nom", $this->nom);
        $stmt->bindParam(":prenom", $this->prenom);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":role", $this->role);

        // Exécution de la requête
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Supprimer un utilisateur
    public function delete() {
        // Requête de suppression
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";

        // Préparation de la requête
        $stmt = $this->conn->prepare($query);

        // Nettoyage et sécurisation de l'ID
        $this->id = htmlspecialchars(strip_tags($this->id));
        $this->id = cleanUTF8($this->id);

        // Liaison de l'ID
        $stmt->bindParam(1, $this->id);

        // Exécution de la requête
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Rechercher un utilisateur par son identifiant technique
    public function findByIdentifiant($identifiant) {
        // Nettoyer et convertir l'identifiant en UTF-8
        $identifiant = cleanUTF8(htmlspecialchars(strip_tags($identifiant)));
        
        // Vérifier si la table existe
        $this->createTableIfNotExists();
        
        // Requête pour trouver l'utilisateur
        $query = "SELECT id, nom, prenom, email, mot_de_passe, identifiant_technique, role, date_creation
                FROM " . $this->table_name . "
                WHERE identifiant_technique = ?
                LIMIT 0,1";

        // Préparation de la requête
        $stmt = $this->conn->prepare($query);

        // Liaison de l'identifiant
        $stmt->bindParam(1, $identifiant);

        // Exécution de la requête
        $stmt->execute();

        // Récupération du résultat
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        // Si un utilisateur est trouvé
        if($row) {
            $this->id = $row['id'];
            $this->nom = $row['nom'];
            $this->prenom = $row['prenom'];
            $this->email = $row['email'];
            $this->mot_de_passe = $row['mot_de_passe'];
            $this->identifiant_technique = $row['identifiant_technique'];
            $this->role = $row['role'];
            $this->date_creation = $row['date_creation'];
            return true;
        }

        return false;
    }
    
    // Rechercher un utilisateur par son email
    public function findByEmail($email) {
        // Nettoyer et convertir l'email en UTF-8
        $email = cleanUTF8(htmlspecialchars(strip_tags($email)));
        
        // Vérifier si la table existe
        $this->createTableIfNotExists();
        
        // Requête pour trouver l'utilisateur par email
        $query = "SELECT id, nom, prenom, email, mot_de_passe, identifiant_technique, role, date_creation
                FROM " . $this->table_name . "
                WHERE email = ?
                LIMIT 0,1";

        // Préparation de la requête
        $stmt = $this->conn->prepare($query);

        // Liaison de l'email
        $stmt->bindParam(1, $email);

        // Exécution de la requête
        $stmt->execute();

        // Récupération du résultat
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        // Si un utilisateur est trouvé
        if($row) {
            $this->id = $row['id'];
            $this->nom = $row['nom'];
            $this->prenom = $row['prenom'];
            $this->email = $row['email'];
            $this->mot_de_passe = $row['mot_de_passe'];
            $this->identifiant_technique = $row['identifiant_technique'];
            $this->role = $row['role'];
            $this->date_creation = $row['date_creation'];
            return true;
        }

        return false;
    }
}
?>
