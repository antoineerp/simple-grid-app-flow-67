
<?php
// Configuration de la connexion à la base de données
class Database {
    // Variables de connexion à la base de données
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    // Constructeur qui charge la configuration
    public function __construct() {
        // Chargement de la configuration depuis le fichier config
        $this->loadConfig();
    }

    // Charger la configuration depuis un fichier JSON
    private function loadConfig() {
        $configFile = __DIR__ . '/db_config.json';
        
        // Configuration par défaut
        $this->host = "p71x6d.myd.infomaniak.com";
        $this->db_name = "p71x6d_system";
        $this->username = "p71x6d_system";
        $this->password = "Trottinette43!";
        
        // Si le fichier de configuration existe, charger les valeurs
        if (file_exists($configFile)) {
            try {
                $config = json_decode(file_get_contents($configFile), true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    if (isset($config['host'])) $this->host = $config['host'];
                    if (isset($config['db_name'])) $this->db_name = $config['db_name'];
                    if (isset($config['username'])) $this->username = $config['username'];
                    if (isset($config['password'])) $this->password = $config['password'];
                }
            } catch (Exception $e) {
                error_log("Erreur lors du chargement de la configuration de base de données: " . $e->getMessage());
            }
        } else {
            // Créer le fichier de configuration avec les valeurs par défaut
            $this->saveConfig();
        }
    }

    // Sauvegarder la configuration actuelle
    public function saveConfig() {
        $configFile = __DIR__ . '/db_config.json';
        $config = [
            'host' => $this->host,
            'db_name' => $this->db_name,
            'username' => $this->username,
            'password' => $this->password
        ];
        
        try {
            file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            return true;
        } catch (Exception $e) {
            error_log("Erreur lors de la sauvegarde de la configuration de base de données: " . $e->getMessage());
            return false;
        }
    }

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

    // Obtenir les informations de configuration actuelle
    public function getConfig() {
        return [
            'host' => $this->host,
            'db_name' => $this->db_name,
            'username' => $this->username,
            'password' => $this->password
        ];
    }

    // Mettre à jour la configuration
    public function updateConfig($host, $db_name, $username, $password) {
        $this->host = $host;
        $this->db_name = $db_name;
        $this->username = $username;
        $this->password = $password;
        
        return $this->saveConfig();
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
