
<?php
// Script simple pour tester la connexion à la base de données depuis SSH
echo "=== Test de connexion à la base de données ===\n";
echo "Exécuté le: " . date('Y-m-d H:i:s') . "\n\n";

// Charger la configuration
$config_file = __DIR__ . '/api/config/db_config.json';
echo "Recherche du fichier de configuration: $config_file\n";

if (!file_exists($config_file)) {
    echo "ERREUR: Fichier de configuration introuvable: $config_file\n";
    exit(1);
}

// Charger le fichier de configuration
echo "Chargement de la configuration...\n";
$config = json_decode(file_get_contents($config_file), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo "ERREUR: Problème de décodage JSON: " . json_last_error_msg() . "\n";
    exit(1);
}

// Afficher les paramètres (sans le mot de passe)
echo "Paramètres de connexion:\n";
echo "- Hôte: " . $config['host'] . "\n";
echo "- Base de données: " . $config['db_name'] . "\n";
echo "- Utilisateur: " . $config['username'] . "\n";
echo "- Mot de passe: [MASQUÉ]\n\n";

// Test de connexion MySQLi
echo "Test de connexion avec MySQLi:\n";
try {
    $mysqli = @new mysqli($config['host'], $config['username'], $config['password'], $config['db_name']);
    
    if ($mysqli->connect_error) {
        echo "ÉCHEC: Erreur de connexion MySQLi: " . $mysqli->connect_error . "\n";
    } else {
        echo "SUCCÈS: Connexion MySQLi établie!\n";
        echo "- Version serveur: " . $mysqli->server_info . "\n";
        
        // Test de requête simple
        $result = $mysqli->query("SELECT DATABASE() AS db_name");
        if ($result) {
            $row = $result->fetch_assoc();
            echo "- Base active: " . $row['db_name'] . "\n";
        }
        
        $mysqli->close();
    }
} catch (Exception $e) {
    echo "EXCEPTION MySQLi: " . $e->getMessage() . "\n";
}

// Test de connexion PDO
echo "\nTest de connexion avec PDO:\n";
try {
    $dsn = "mysql:host=" . $config['host'] . ";dbname=" . $config['db_name'] . ";charset=utf8mb4";
    $pdo = new PDO($dsn, $config['username'], $config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "SUCCÈS: Connexion PDO établie!\n";
    
    // Vérifier la version MySQL
    $stmt = $pdo->query("SELECT VERSION() AS version");
    $version = $stmt->fetchColumn();
    echo "- Version MySQL: " . $version . "\n";
    
    // Lister les tables
    echo "- Tables disponibles:\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (count($tables) > 0) {
        foreach ($tables as $table) {
            echo "  • $table\n";
        }
    } else {
        echo "  • Aucune table trouvée\n";
    }
    
} catch (PDOException $e) {
    echo "ÉCHEC: Erreur PDO: " . $e->getMessage() . "\n";
}

echo "\nTest terminé.\n";
?>
