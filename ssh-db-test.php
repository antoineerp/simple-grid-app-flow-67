
<?php
// Script de test SSH pour vérifier la connexion à la base de données Infomaniak
// Exécutez avec: php ssh-db-test.php

echo "=== TEST DE CONNEXION À LA BASE DE DONNÉES VIA SSH ===\n";
echo "Date et heure: " . date('Y-m-d H:i:s') . "\n";
echo "Version PHP: " . phpversion() . "\n\n";

// Charger la configuration de la base de données
$db_config_file = __DIR__ . '/api/config/db_config.json';
echo "Vérification du fichier de configuration: $db_config_file\n";

if (!file_exists($db_config_file)) {
    echo "ERREUR: Fichier de configuration introuvable.\n";
    exit(1);
}

// Charger la configuration
try {
    $config = json_decode(file_get_contents($db_config_file), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Erreur de décodage JSON: " . json_last_error_msg());
    }
} catch (Exception $e) {
    echo "ERREUR lors du chargement de la configuration: " . $e->getMessage() . "\n";
    exit(1);
}

echo "Configuration chargée avec succès.\n\n";
echo "Paramètres de connexion:\n";
echo "- Hôte: " . $config['host'] . "\n";
echo "- Base de données: " . $config['db_name'] . "\n";
echo "- Utilisateur: " . $config['username'] . "\n";
echo "- Mot de passe: " . (empty($config['password']) ? "MANQUANT" : "PRÉSENT") . "\n\n";

// Test de connexion MySQLi
echo "=== TEST AVEC MYSQLI ===\n";
try {
    $mysqli = new mysqli($config['host'], $config['username'], $config['password'], $config['db_name']);
    
    if ($mysqli->connect_error) {
        echo "ÉCHEC: Erreur de connexion MySQLi: " . $mysqli->connect_error . "\n";
    } else {
        echo "SUCCÈS: Connexion MySQLi établie!\n";
        echo "- Version serveur: " . $mysqli->server_info . "\n";
        
        // Vérifier la connexion avec une requête simple
        if ($result = $mysqli->query("SHOW TABLES")) {
            echo "- Tables dans la base de données:\n";
            if ($result->num_rows > 0) {
                while ($row = $result->fetch_array()) {
                    echo "  • " . $row[0] . "\n";
                }
            } else {
                echo "  • Aucune table trouvée.\n";
            }
            $result->free();
        }
        
        $mysqli->close();
    }
} catch (Exception $e) {
    echo "EXCEPTION MySQLi: " . $e->getMessage() . "\n";
}

// Test de connexion PDO
echo "\n=== TEST AVEC PDO ===\n";
try {
    $dsn = "mysql:host=" . $config['host'] . ";dbname=" . $config['db_name'] . ";charset=utf8mb4";
    $pdo = new PDO($dsn, $config['username'], $config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "SUCCÈS: Connexion PDO établie!\n";
    
    // Vérifier la version MySQL
    $stmt = $pdo->query("SELECT VERSION() AS version");
    $version = $stmt->fetchColumn();
    echo "- Version MySQL: " . $version . "\n";
    
    // Vérifier les options de connexion
    echo "- Jeu de caractères: " . $pdo->query('SELECT @@character_set_database')->fetchColumn() . "\n";
    echo "- Collation: " . $pdo->query('SELECT @@collation_database')->fetchColumn() . "\n";
    
    // Lister les tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "- Tables disponibles: " . count($tables) . "\n";
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

echo "\n=== TEST DE PERMISSIONS FICHIERS ===\n";
$important_files = [
    __DIR__ . '/.htaccess' => 'Configuration Apache',
    __DIR__ . '/.user.ini' => 'Configuration PHP',
    __DIR__ . '/api/.htaccess' => 'Configuration API',
    __DIR__ . '/api/config/db_config.json' => 'Configuration BD'
];

foreach ($important_files as $file => $description) {
    if (file_exists($file)) {
        $perms = fileperms($file);
        $mode = substr(sprintf('%o', $perms), -4);
        $owner = function_exists('posix_getpwuid') ? posix_getpwuid(fileowner($file))['name'] : 'inconnu';
        $group = function_exists('posix_getgrgid') ? posix_getgrgid(filegroup($file))['name'] : 'inconnu';
        
        echo "$file ($description):\n";
        echo "  - Permissions: $mode\n";
        echo "  - Propriétaire: $owner:$group\n";
        
        if ($file === __DIR__ . '/api/config/db_config.json') {
            // Vérifier les permissions du répertoire parent aussi
            $dir = dirname($file);
            $dir_perms = substr(sprintf('%o', fileperms($dir)), -4);
            echo "  - Permissions du répertoire parent: $dir_perms\n";
        }
    } else {
        echo "$file ($description): MANQUANT\n";
    }
}

// Test d'écriture pour vérifier les permissions
$test_file = __DIR__ . '/ssh-write-test-' . time() . '.tmp';
try {
    if (file_put_contents($test_file, "Test d'écriture") !== false) {
        echo "\nTest d'écriture réussi: $test_file\n";
        unlink($test_file);  // Supprimer après le test
    } else {
        echo "\nÉchec du test d'écriture!\n";
    }
} catch (Exception $e) {
    echo "\nErreur lors du test d'écriture: " . $e->getMessage() . "\n";
}

echo "\n=== VÉRIFICATION DES EXTENSIONS PHP ===\n";
$required_extensions = ['mysqli', 'pdo_mysql', 'json', 'openssl', 'curl', 'mbstring'];
foreach ($required_extensions as $ext) {
    echo "$ext: " . (extension_loaded($ext) ? "Chargée ✓" : "Non chargée ✗") . "\n";
}

echo "\n=== FIN DU TEST ===\n";
?>
