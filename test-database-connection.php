
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test de la classe DatabaseConnection</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; background-color: #f0fff0; padding: 10px; border-left: 4px solid green; }
        .error { color: red; font-weight: bold; background-color: #fff0f0; padding: 10px; border-left: 4px solid red; }
        .warning { color: orange; font-weight: bold; background-color: #fffaf0; padding: 10px; border-left: 4px solid orange; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Test de la classe DatabaseConnection</h1>
    
    <?php
    // Activer l'affichage des erreurs
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
    
    // Essayer de charger env.php directement
    $env_loaded = false;
    $env_paths = [
        './api/config/env.php',
        'api/config/env.php',
        '/api/config/env.php',
        __DIR__ . '/api/config/env.php',
        dirname(__DIR__) . '/api/config/env.php'
    ];
    
    foreach ($env_paths as $path) {
        if (file_exists($path)) {
            echo "<p>Tentative de chargement de env.php depuis: " . htmlspecialchars($path) . "</p>";
            include_once $path;
            if (defined('DB_HOST')) {
                echo "<div class='success'>env.php chargé avec succès depuis " . htmlspecialchars($path) . "</div>";
                $env_loaded = true;
                break;
            }
        }
    }
    
    if (!$env_loaded) {
        echo "<div class='error'>Impossible de charger env.php depuis aucun des chemins testés.</div>";
        
        // Définir les constantes manuellement
        echo "<div class='warning'>Définition manuelle des constantes de base de données...</div>";
        define('DB_HOST', 'p71x6d.myd.infomaniak.com');
        define('DB_NAME', 'p71x6d_richard');
        define('DB_USER', 'p71x6d_richard');
        define('DB_PASS', 'Trottinette43!');
    }
    
    // Essayer de charger DatabaseConfig et DatabaseConnection
    try {
        if (file_exists('./api/config/DatabaseConfig.php')) {
            require_once './api/config/DatabaseConfig.php';
        } elseif (file_exists('api/config/DatabaseConfig.php')) {
            require_once 'api/config/DatabaseConfig.php';
        } else {
            throw new Exception("Fichier DatabaseConfig.php non trouvé");
        }
        
        if (file_exists('./api/config/DatabaseConnection.php')) {
            require_once './api/config/DatabaseConnection.php';
        } elseif (file_exists('api/config/DatabaseConnection.php')) {
            require_once 'api/config/DatabaseConnection.php';
        } else {
            throw new Exception("Fichier DatabaseConnection.php non trouvé");
        }
        
        echo "<div class='success'>Classes chargées avec succès</div>";
        
        // Essayer d'instancier les classes
        $config = new DatabaseConfig();
        echo "<div class='success'>DatabaseConfig instanciée avec succès</div>";
        
        $connection = new DatabaseConnection($config, 'direct_test');
        echo "<div class='success'>DatabaseConnection instanciée avec succès</div>";
        
        // Tester la connexion
        $pdo = $connection->connect(true);
        
        if ($pdo instanceof PDO) {
            echo "<div class='success'>Connexion à la base de données réussie!</div>";
            
            // Exécuter une requête simple
            $stmt = $pdo->query("SELECT VERSION() as version");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo "<p>Version MySQL: " . htmlspecialchars($result['version']) . "</p>";
        } else {
            echo "<div class='error'>La connexion n'est pas un objet PDO valide</div>";
        }
        
    } catch (Exception $e) {
        echo "<div class='error'>Exception: " . htmlspecialchars($e->getMessage()) . "</div>";
        echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
    }
    ?>
    
    <h2>Liens utiles</h2>
    <ul>
        <li><a href="fix-env-path.php">Revenir à la correction des chemins</a></li>
        <li><a href="verify-php-files.php">Vérifier les fichiers PHP</a></li>
        <li><a href="test-env-paths.php">Tester les chemins du fichier env.php</a></li>
        <li><a href="api/test.php">Tester l'API</a></li>
    </ul>
</body>
</html>
