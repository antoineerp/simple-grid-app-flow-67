
<?php
// Script de test de connexion à la base de données via SSH
// Exécuter avec: php ssh-db-test.php

echo "=== TEST DE CONNEXION À LA BASE DE DONNÉES VIA SSH ===\n";
echo "Date et heure: " . date('Y-m-d H:i:s') . "\n";
echo "Version PHP: " . phpversion() . "\n\n";

// Charger la configuration depuis le fichier JSON
$config_file = __DIR__ . '/api/config/db_config.json';
if (!file_exists($config_file)) {
    die("Erreur: Le fichier de configuration db_config.json n'existe pas.\n");
}

try {
    // Lire la configuration
    $config = json_decode(file_get_contents($config_file), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Erreur de décodage JSON: " . json_last_error_msg());
    }
    
    // Afficher la configuration (masquer le mot de passe)
    echo "Configuration chargée depuis: $config_file\n";
    echo "Host: " . $config['host'] . "\n";
    echo "DB Name: " . $config['db_name'] . "\n";
    echo "Username: " . $config['username'] . "\n";
    echo "Password: [MASQUÉ]\n\n";
    
    // Tester la connexion PDO
    echo "Tentative de connexion via PDO...\n";
    $start_time = microtime(true);
    $dsn = "mysql:host=" . $config['host'] . ";dbname=" . $config['db_name'] . ";charset=utf8";
    
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $config['username'], $config['password'], $options);
    $time = round((microtime(true) - $start_time) * 1000, 2);
    echo "✓ Connexion PDO réussie en {$time}ms\n\n";
    
    // Exécuter une requête de test
    echo "Exécution d'une requête de test...\n";
    $query = $pdo->query("SELECT VERSION() as version, NOW() as now, DATABASE() as db");
    $result = $query->fetch();
    
    echo "Version MySQL: " . $result['version'] . "\n";
    echo "Date/heure MySQL: " . $result['now'] . "\n";
    echo "Base de données: " . $result['db'] . "\n\n";
    
    // Lister les tables
    echo "Tables disponibles dans la base de données:\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = [];
    
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $table_name = $row[0];
        $tables[] = $table_name;
        
        // Compter le nombre d'enregistrements dans la table
        try {
            $count = $pdo->query("SELECT COUNT(*) FROM `$table_name`")->fetchColumn();
            echo "- $table_name ($count enregistrements)\n";
        } catch (PDOException $e) {
            echo "- $table_name (Erreur lors du comptage: " . $e->getMessage() . ")\n";
        }
    }
    
    // Vérifier si la table utilisateurs existe
    echo "\nVérification de la table utilisateurs...\n";
    if (in_array('utilisateurs', $tables)) {
        echo "✓ La table utilisateurs existe\n\n";
        
        // Afficher la structure de la table
        echo "Structure de la table utilisateurs:\n";
        $stmt = $pdo->query("DESCRIBE utilisateurs");
        while ($row = $stmt->fetch()) {
            $nullable = $row['Null'] === 'YES' ? '' : '[NOT NULL]';
            $key = $row['Key'] === 'PRI' ? '[PRIMARY KEY]' : '';
            echo "- " . $row['Field'] . " (" . $row['Type'] . ") " . $key . " " . $nullable . "\n";
        }
        
        // Compter le nombre d'utilisateurs
        $count = $pdo->query("SELECT COUNT(*) FROM utilisateurs")->fetchColumn();
        echo "\nNombre d'utilisateurs: $count\n";
        
        // Afficher quelques exemples d'utilisateurs
        if ($count > 0) {
            echo "\nExemple d'utilisateurs (max. 3):\n";
            $stmt = $pdo->query("SELECT id, email, nom, prenom, role FROM utilisateurs LIMIT 3");
            while ($row = $stmt->fetch()) {
                echo "ID: " . $row['id'] . ", Email: " . $row['email'] . ", Nom: " . $row['nom'] . 
                     ", Prénom: " . $row['prenom'] . ", Rôle: " . $row['role'] . "\n";
            }
        }
    } else {
        echo "✗ La table utilisateurs n'existe pas\n";
        
        // Proposer de créer la table
        echo "\nCréation de la table utilisateurs...\n";
        $create_table = "CREATE TABLE IF NOT EXISTS utilisateurs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            prenom VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            mot_de_passe VARCHAR(255) NOT NULL,
            identifiant_technique VARCHAR(100) NOT NULL UNIQUE,
            role ENUM('administrateur', 'utilisateur', 'gestionnaire') NOT NULL,
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($create_table);
        echo "✓ Table utilisateurs créée\n";
        
        // Créer un utilisateur administrateur par défaut
        $check = $pdo->query("SELECT COUNT(*) FROM utilisateurs")->fetchColumn();
        if ($check == 0) {
            $insert = $pdo->prepare("INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
                                   VALUES (?, ?, ?, ?, ?, ?)");
            
            $nom = "Défaut";
            $prenom = "Utilisateur";
            $email = "antcirier@gmail.com";
            $mot_de_passe = password_hash("admin123", PASSWORD_DEFAULT);
            $identifiant_technique = "p71x6d_system";
            $role = "administrateur";
            
            $insert->execute([$nom, $prenom, $email, $mot_de_passe, $identifiant_technique, $role]);
            echo "✓ Utilisateur administrateur créé: $email / admin123\n";
        }
    }
    
    echo "\n=== TEST DE CONNEXION TERMINÉ AVEC SUCCÈS ===\n";
    
} catch (PDOException $e) {
    echo "ERREUR DE CONNEXION PDO: " . $e->getMessage() . "\n";
    echo "Type d'erreur: " . get_class($e) . "\n";
    echo "Dans le fichier: " . $e->getFile() . " à la ligne " . $e->getLine() . "\n";
    echo "\nTraceback:\n";
    print_r($e->getTrace());
    echo "\n";
    
} catch (Exception $e) {
    echo "ERREUR: " . $e->getMessage() . "\n";
    echo "Type d'erreur: " . get_class($e) . "\n";
    echo "Dans le fichier: " . $e->getFile() . " à la ligne " . $e->getLine() . "\n";
    echo "\n";
}

echo "\nVérifications supplémentaires:\n\n";

// Vérifier les extensions PHP requises
echo "Extensions PHP chargées:\n";
$extensions = get_loaded_extensions();
sort($extensions);
foreach ($extensions as $ext) {
    echo "- $ext\n";
}

// Vérifier les extensions requises
$required_extensions = ['pdo', 'pdo_mysql', 'mysqli', 'json'];
foreach ($required_extensions as $ext) {
    if (!extension_loaded($ext)) {
        echo "\n⚠️ Extension requise non chargée: $ext\n";
    }
}

?>
