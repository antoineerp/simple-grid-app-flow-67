
<?php
class TestQualiflowConnection {
    private $config;
    
    public function __construct() {
        // Configuration pour la base p71x6d_qualiflow
        $this->config = [
            'host' => 'p71x6d.myd.infomaniak.com',
            'db_name' => 'p71x6d_qualiflow',
            'username' => 'p71x6d_qualiflow',
            'password' => 'Trottinette43!'  // À modifier avec votre mot de passe réel
        ];
    }
    
    public function testConnection() {
        try {
            $dsn = "mysql:host={$this->config['host']};dbname={$this->config['db_name']};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            // Tenter d'établir la connexion
            $pdo = new PDO($dsn, $this->config['username'], $this->config['password'], $options);
            
            // Vérifier la connexion avec une requête simple
            $stmt = $pdo->query("SELECT 1 as test, DATABASE() as db_name");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Récupérer la liste des tables
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            return [
                'status' => 'success',
                'message' => 'Connexion à la base p71x6d_qualiflow réussie',
                'database' => $result['db_name'],
                'tables' => $tables,
                'table_count' => count($tables)
            ];
        } catch (PDOException $e) {
            return [
                'status' => 'error',
                'message' => 'Échec de la connexion à p71x6d_qualiflow: ' . $e->getMessage()
            ];
        }
    }
}
?>
