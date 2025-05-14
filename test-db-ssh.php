
<?php
// Script de test de connexion à la base de données via SSH
// Exécuter avec: php test-db-ssh.php

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
    
    echo "Configuration chargée depuis: $config_file\n";
    echo "Host: " . $config['host'] . "\n";
    echo "DB Name: " . $config['db_name'] . "\n";
    echo "Username: " . $config['username'] . "\n";
    echo "Password: " . (isset($config['password']) ? '[MASQUÉ]' : 'Non défini') . "\n\n";
    
    // Tentative de connexion PDO
    echo "Tentative de connexion via PDO...\n";
    $start_time = microtime(true);
    
    $dsn = "mysql:host={$config['host']};dbname={$config['db_name']};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $config['username'], $config['password'], $options);
    $duration = round((microtime(true) - $start_time) * 1000, 2);
    
    echo "✓ Connexion PDO réussie en {$duration}ms\n";
    
    // Test d'une requête simple
    echo "\nExécution d'une requête de test...\n";
    $stmt = $pdo->query("SELECT VERSION() AS version, NOW() AS now, DATABASE() AS db");
    $result = $stmt->fetch();
    
    echo "Version MySQL: " . $result['version'] . "\n";
    echo "Date/heure MySQL: " . $result['now'] . "\n";
    echo "Base de données: " . $result['db'] . "\n\n";
    
    // Liste des tables
    echo "Tables disponibles dans la base de données:\n";
    $tables = $pdo->query("SHOW TABLES");
    $table_count = 0;
    foreach ($tables as $table) {
        $table_name = $table[0];
        echo "- $table_name";
        
        // Compter les enregistrements
        $count = $pdo->query("SELECT COUNT(*) FROM `$table_name`")->fetchColumn();
        echo " ($count enregistrements)\n";
        $table_count++;
    }
    
    if ($table_count === 0) {
        echo "Aucune table trouvée dans la base de données.\n";
    }
    
    // Vérifier si la table utilisateurs existe
    echo "\nVérification de la table utilisateurs...\n";
    $check = $pdo->query("SHOW TABLES LIKE 'utilisateurs'")->rowCount();
    if ($check > 0) {
        echo "✓ La table utilisateurs existe\n";
        
        // Afficher la structure
        echo "\nStructure de la table utilisateurs:\n";
        $columns = $pdo->query("DESCRIBE utilisateurs");
        foreach ($columns as $col) {
            echo "- {$col['Field']} ({$col['Type']})";
            if ($col['Key'] === 'PRI') echo " [PRIMARY KEY]";
            if ($col['Null'] === 'NO') echo " [NOT NULL]";
            echo "\n";
        }
        
        // Compter les utilisateurs
        $user_count = $pdo->query("SELECT COUNT(*) FROM utilisateurs")->fetchColumn();
        echo "\nNombre d'utilisateurs: $user_count\n";
        
        if ($user_count > 0) {
            // Afficher quelques utilisateurs (limiter les informations sensibles)
            echo "\nExemple d'utilisateurs (max. 3):\n";
            $users = $pdo->query("SELECT id, email, nom, prenom, role FROM utilisateurs LIMIT 3");
            foreach ($users as $user) {
                echo "ID: {$user['id']}, Email: {$user['email']}, ";
                echo "Nom: {$user['nom']}, Prénom: {$user['prenom']}, ";
                echo "Rôle: {$user['role']}\n";
            }
        }
    } else {
        echo "✗ La table utilisateurs n'existe pas\n";
    }
    
    echo "\n=== TEST DE CONNEXION TERMINÉ AVEC SUCCÈS ===\n";
    
} catch (Exception $e) {
    echo "ERREUR: " . $e->getMessage() . "\n";
    echo "Type d'erreur: " . get_class($e) . "\n";
    echo "Dans le fichier: " . $e->getFile() . " à la ligne " . $e->getLine() . "\n";
    echo "\nTraceback:\n" . $e->getTraceAsString() . "\n";
    
    // Vérifications supplémentaires en cas d'erreur
    echo "\nVérifications supplémentaires:\n";
    
    if (!extension_loaded('pdo')) {
        echo "✗ L'extension PDO n'est pas chargée\n";
    }
    
    if (!extension_loaded('pdo_mysql')) {
        echo "✗ L'extension pdo_mysql n'est pas chargée\n";
    }
    
    echo "\nExtensions PHP chargées:\n";
    $extensions = get_loaded_extensions();
    sort($extensions);
    foreach ($extensions as $ext) {
        echo "- $ext\n";
    }
}
