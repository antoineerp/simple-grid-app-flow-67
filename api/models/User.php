
<?php
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
        // Requête select all
        $query = "SELECT
                    id, nom, prenom, email, identifiant_technique, role, date_creation
                FROM
                    " . $this->table_name . "
                ORDER BY
                    id DESC";

        // Préparation de la requête
        $stmt = $this->conn->prepare($query);

        // Exécution de la requête
        $stmt->execute();

        return $stmt;
    }

    // Créer un utilisateur
    public function create() {
        // Requête d'insertion
        $query = "INSERT INTO " . $this->table_name . "
                SET
                    nom = :nom,
                    prenom = :prenom,
                    email = :email,
                    mot_de_passe = :mot_de_passe,
                    identifiant_technique = :identifiant_technique,
                    role = :role,
                    date_creation = NOW()";

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

        // Hachage du mot de passe
        $this->mot_de_passe = password_hash($this->mot_de_passe, PASSWORD_BCRYPT);

        // Liaison des valeurs
        $stmt->bindParam(":nom", $this->nom);
        $stmt->bindParam(":prenom", $this->prenom);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":mot_de_passe", $this->mot_de_passe);
        $stmt->bindParam(":identifiant_technique", $this->identifiant_technique);
        $stmt->bindParam(":role", $this->role);

        // Exécution de la requête
        if($stmt->execute()) {
            return true;
        }

        return false;
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
}
?>
