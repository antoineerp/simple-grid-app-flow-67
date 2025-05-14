
<?php
// Script de test de connexion à la base de données via SSH
// Pour utiliser ce script, exécutez-le en SSH avec: php ssh-db-test.php

if (php_sapi_name() !== 'cli') {
    echo "Ce script doit être exécuté via SSH avec la commande: php ssh-db-test.php\n";
    exit(1);
}

echo "=== TEST DE CONNEXION À LA BASE DE DONNÉES INFOMANIAK ===\n\n";
echo "Date et heure: " . date('Y-m-d H:i:s') . "\n";
echo "Version PHP: " . phpversion() . "\n\n";

// Configuration de la base de données
$config_file = __DIR__ . '/api/config/db_config.json';
echo "Vérification du fichier de configuration: $config_file\n";

if (!file_exists($config_file)) {
    echo "ERREUR: Le fichier de configuration n'existe pas.\n";
    exit(1);
}

try {
    $config = json_decode(file_get_contents($config_file), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Erreur de parsing JSON: " . json_last_error_msg());
    }
    
    echo "Configuration chargée avec succès.\n";
    echo "Hôte: " . $config['host'] . "\n";
    echo "Base de données: " . $config['db_name'] . "\n";
    echo "Utilisateur: " . $config['username'] . "\n";
    echo "Mot de passe: " . (empty($config['password']) ? "Non défini" : "********") . "\n\n";

    // Tentative de connexion
    echo "Tentative de connexion à la base de données...\n";
    $start_time = microtime(true);
    
    $dsn = "mysql:host=" . $config['host'] . ";dbname=" . $config['db_name'] . ";charset=utf8mb4";
    $pdo = new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
    
    $time_taken = round(microtime(true) - $start_time, 3);
    echo "✓ Connexion établie avec succès! (en $time_taken secondes)\n";
    
    // Test d'une requête simple
    echo "\nExécution d'une requête de test...\n";
    $stmt = $pdo->query("SELECT NOW() AS current_time, VERSION() AS mysql_version");
    $row = $stmt->fetch();
    
    echo "Heure du serveur MySQL: " . $row['current_time'] . "\n";
    echo "Version MySQL: " . $row['mysql_version'] . "\n";
    
    // Liste des tables
    echo "\nListe des tables disponibles:\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($tables)) {
        echo "Aucune table trouvée dans la base de données.\n";
    } else {
        foreach ($tables as $index => $table) {
            echo ($index + 1) . ". $table\n";
        }
        
        // Vérifier la table users si elle existe
        if (in_array('users', $tables)) {
            echo "\nVérification de la table 'users'...\n";
            $stmt = $pdo->query("SELECT COUNT(*) AS total FROM users");
            $count = $stmt->fetch();
            echo "Nombre d'utilisateurs: " . $count['total'] . "\n";
            
            if ($count['total'] > 0) {
                $stmt = $pdo->query("SELECT id, nom, prenom, email FROM users LIMIT 5");
                echo "Premiers utilisateurs:\n";
                while ($user = $stmt->fetch()) {
                    echo "- ID: " . $user['id'] . ", Nom: " . $user['nom'] . " " . $user['prenom'] . ", Email: " . $user['email'] . "\n";
                }
            }
        }
    }
    
    echo "\n=== TEST TERMINÉ AVEC SUCCÈS ===\n";
    
} catch (Exception $e) {
    echo "ERREUR: " . $e->getMessage() . "\n";
    
    // Informations de diagnostic supplémentaires
    echo "\nInformations de diagnostic:\n";
    echo "- PDO est " . (extension_loaded('pdo') ? 'activé' : 'NON activé') . "\n";
    echo "- PDO MySQL est " . (extension_loaded('pdo_mysql') ? 'activé' : 'NON activé') . "\n";
    
    if (function_exists('mysqli_connect')) {
        // Tentative alternative avec MySQLi
        echo "\nTentative avec MySQLi...\n";
        $mysqli = @mysqli_connect($config['host'], $config['username'], $config['password'], $config['db_name']);
        if ($mysqli) {
            echo "✓ Connexion MySQLi réussie!\n";
            mysqli_close($mysqli);
        } else {
            echo "✗ Échec de connexion MySQLi: " . mysqli_connect_error() . "\n";
        }
    }
    
    echo "\nVérifiez vos paramètres de connexion et assurez-vous que:\n";
    echo "1. Le serveur MySQL d'Infomaniak est accessible\n";
    echo "2. Le nom de la base de données est correct\n";
    echo "3. Le nom d'utilisateur et le mot de passe sont valides\n";
    echo "4. L'adresse IP du serveur est autorisée à se connecter\n";
    exit(1);
}
?>
