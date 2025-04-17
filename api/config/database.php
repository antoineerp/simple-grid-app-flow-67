
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
            error_log("Erreur de connexion à la base de données: " . $exception->getMessage());
            echo "Erreur de connexion: " . $exception->getMessage();
        }

        return $this->conn;
    }

    // Convertir les tables en utf8mb4
    private function convertTablesToUtf8mb4() {
        try {
            // Vérifier si la base de données est déjà en utf8mb4
            $stmt = $this->conn->query("SELECT default_character_set_name, default_collation_name 
                                      FROM information_schema.SCHEMATA 
                                      WHERE schema_name = '" . $this->db_name . "'");
            $dbInfo = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Si la base n'est pas déjà en utf8mb4, la convertir
            if ($dbInfo && $dbInfo['default_character_set_name'] !== 'utf8mb4') {
                $this->conn->exec("ALTER DATABASE `" . $this->db_name . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
                error_log("Base de données convertie en utf8mb4");
            }
            
            // Récupérer toutes les tables de la base de données
            $stmt = $this->conn->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Écrire dans le journal les tables trouvées
            error_log("Tables trouvées dans la base de données: " . implode(', ', $tables));
            
            foreach ($tables as $table) {
                // Vérifier le charset actuel de la table
                $stmt = $this->conn->query("SHOW TABLE STATUS WHERE Name = '" . $table . "'");
                $tableInfo = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Convertir la table si nécessaire
                if ($tableInfo && $tableInfo['Collation'] !== 'utf8mb4_general_ci') {
                    $this->conn->exec("ALTER TABLE `" . $table . "` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
                    error_log("Table {$table} convertie en utf8mb4");
                    
                    // Obtenir la liste des colonnes
                    $stmt = $this->conn->query("SHOW FULL COLUMNS FROM `" . $table . "`");
                    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Convertir chaque colonne de type texte
                    foreach ($columns as $column) {
                        if (strpos($column['Type'], 'varchar') !== false || 
                            strpos($column['Type'], 'text') !== false || 
                            strpos($column['Type'], 'char') !== false || 
                            strpos($column['Type'], 'enum') !== false || 
                            strpos($column['Type'], 'longtext') !== false) {
                            
                            if ($column['Collation'] !== 'utf8mb4_general_ci') {
                                $this->conn->exec("ALTER TABLE `" . $table . "` MODIFY `" . $column['Field'] . "` " . 
                                                $column['Type'] . " CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
                                error_log("Colonne {$table}.{$column['Field']} convertie en utf8mb4");
                            }
                        }
                    }
                }
            }
        } catch(PDOException $e) {
            // Journaliser l'erreur mais ne pas interrompre l'exécution
            error_log("Erreur lors de la conversion en utf8mb4: " . $e->getMessage());
        }
    }
}
?>
