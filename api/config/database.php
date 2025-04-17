
<?php
// Configuration de la connexion à la base de données
class Database {
    // Variables de connexion à la base de données
    private $host = "p71x6d.myd.infomaniak.com";
    private $db_name = "p71x6d_system";
    private $username = "p71x6d_system";
    private $password = "Trottinette43!";
    public $conn;

    // Obtenir la connexion à la base de données
    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // Forcer l'encodage UTF-8 pour toutes les requêtes
            $this->conn->exec("SET NAMES utf8mb4");
        } catch(PDOException $exception) {
            echo "Erreur de connexion: " . $exception->getMessage();
        }

        return $this->conn;
    }
}
?>
