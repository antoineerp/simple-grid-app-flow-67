
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
            
            // Convertir les tables en utf8mb4 si nécessaire
            $this->convertTablesToUtf8mb4();
            
        } catch(PDOException $exception) {
            echo "Erreur de connexion: " . $exception->getMessage();
        }

        return $this->conn;
    }

    // Convertir les tables en utf8mb4
    private function convertTablesToUtf8mb4() {
        try {
            // Conversion de la base de données
            $this->conn->exec("ALTER DATABASE `" . $this->db_name . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
            
            // Liste des tables à convertir
            $tables = ['exigences', 'membres'];
            
            foreach ($tables as $table) {
                // Convertir la table
                $this->conn->exec("ALTER TABLE `" . $table . "` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
                
                // Obtenir la liste des colonnes
                $stmt = $this->conn->query("SHOW FULL COLUMNS FROM `" . $table . "`");
                $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Convertir chaque colonne de type texte
                foreach ($columns as $column) {
                    if (strpos($column['Type'], 'varchar') !== false || 
                        strpos($column['Type'], 'text') !== false || 
                        strpos($column['Type'], 'char') !== false) {
                        $this->conn->exec("ALTER TABLE `" . $table . "` MODIFY `" . $column['Field'] . "` " . 
                                        $column['Type'] . " CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
                    }
                }
            }
        } catch(PDOException $e) {
            error_log("Erreur lors de la conversion en utf8mb4: " . $e->getMessage());
        }
    }
}
?>

