
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test Connexion Utilisateurs</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; overflow: auto; }
    </style>
</head>
<body>
    <h1>Test de Connexion aux Utilisateurs</h1>
    
    <?php
    // Afficher la configuration
    $db_config_file = 'api/config/db_config.json';
    
    if (file_exists($db_config_file)) {
        $config = json_decode(file_get_contents($db_config_file), true);
        echo "<h2>Configuration</h2>";
        echo "<p>Hôte: " . $config['host'] . "</p>";
        echo "<p>Base de données: " . $config['db_name'] . "</p>";
        echo "<p>Utilisateur: " . $config['username'] . "</p>";
        
        // Tester la connexion
        try {
            $dsn = "mysql:host=" . $config['host'] . ";dbname=" . $config['db_name'] . ";charset=utf8mb4";
            $pdo = new PDO($dsn, $config['username'], $config['password']);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            echo "<p class='success'>Connexion à la base de données réussie!</p>";
            
            // Rechercher les tables utilisateur
            echo "<h2>Tables Utilisateur</h2>";
            $stmt = $pdo->query("SHOW TABLES LIKE 'utilisateurs'");
            $userTablesExist = $stmt->rowCount() > 0;
            
            if ($userTablesExist) {
                echo "<p class='success'>Table 'utilisateurs' trouvée!</p>";
                
                // Compter les utilisateurs
                $stmt = $pdo->query("SELECT COUNT(*) FROM utilisateurs");
                $userCount = $stmt->fetchColumn();
                echo "<p>Nombre d'utilisateurs: " . $userCount . "</p>";
                
                // Afficher les 5 premiers utilisateurs (sans mot de passe)
                if ($userCount > 0) {
                    $stmt = $pdo->query("SELECT id, email, nom, prenom, role FROM utilisateurs LIMIT 5");
                    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    echo "<h3>Exemples d'utilisateurs:</h3>";
                    echo "<pre>";
                    print_r($users);
                    echo "</pre>";
                }
            } else {
                echo "<p class='error'>Table 'utilisateurs' non trouvée!</p>";
                
                // Lister toutes les tables
                $stmt = $pdo->query("SHOW TABLES");
                $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                
                echo "<h3>Tables disponibles:</h3>";
                echo "<pre>";
                print_r($tables);
                echo "</pre>";
            }
        } catch (PDOException $e) {
            echo "<p class='error'>Erreur de connexion: " . $e->getMessage() . "</p>";
        }
    } else {
        echo "<p class='error'>Fichier de configuration non trouvé: " . $db_config_file . "</p>";
    }
    ?>
</body>
</html>
