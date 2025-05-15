
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test des chemins du fichier env.php</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { color: blue; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .result { margin: 10px 0; padding: 10px; border-left: 4px solid #ccc; }
    </style>
</head>
<body>
    <h1>Test des chemins du fichier env.php</h1>
    
    <?php
    // Liste des chemins possibles pour env.php
    $possible_paths = [
        './api/config/env.php',
        '/api/config/env.php',
        'api/config/env.php',
        $_SERVER['DOCUMENT_ROOT'] . '/api/config/env.php',
        dirname(__DIR__) . '/api/config/env.php',
        dirname(__DIR__) . '/config/env.php',
        dirname(dirname(__DIR__)) . '/api/config/env.php',
        __DIR__ . '/api/config/env.php',
        __DIR__ . '/config/env.php',
        '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch/api/config/env.php'
    ];
    
    echo "<h2>Informations sur les chemins du serveur</h2>";
    echo "<div class='result info'>";
    echo "<p>Document Root: " . htmlspecialchars($_SERVER['DOCUMENT_ROOT']) . "</p>";
    echo "<p>Chemin du script actuel: " . htmlspecialchars(__FILE__) . "</p>";
    echo "<p>Répertoire du script actuel: " . htmlspecialchars(__DIR__) . "</p>";
    echo "<p>Répertoire parent: " . htmlspecialchars(dirname(__DIR__)) . "</p>";
    echo "<p>Chemin réel du script: " . htmlspecialchars(realpath(__FILE__)) . "</p>";
    echo "</div>";
    
    echo "<h2>Test des chemins possibles pour env.php</h2>";
    $found = false;
    
    foreach ($possible_paths as $path) {
        echo "<div class='result'>";
        echo "<p>Test du chemin: <code>" . htmlspecialchars($path) . "</code></p>";
        
        if (file_exists($path)) {
            echo "<p class='success'>✓ Le fichier existe à ce chemin!</p>";
            echo "<p>Chemin absolu: <code>" . htmlspecialchars(realpath($path)) . "</code></p>";
            
            // Test d'inclusion
            try {
                ob_start();
                include_once $path;
                $output = ob_get_clean();
                
                if (defined('DB_HOST') && defined('DB_USER') && defined('DB_PASS') && defined('DB_NAME')) {
                    echo "<p class='success'>✓ Fichier correctement chargé, les constantes sont définies:</p>";
                    echo "<ul>";
                    echo "<li>DB_HOST: " . DB_HOST . "</li>";
                    echo "<li>DB_NAME: " . DB_NAME . "</li>";
                    echo "<li>DB_USER: " . DB_USER . "</li>";
                    echo "<li>DB_PASS: ********</li>";
                    echo "</ul>";
                } else {
                    echo "<p class='error'>✗ Le fichier a été inclus mais les constantes ne sont pas définies.</p>";
                }
                
                if (!empty($output)) {
                    echo "<p class='error'>Le fichier a généré une sortie (ce qui peut causer des problèmes d'en-têtes):</p>";
                    echo "<pre>" . htmlspecialchars($output) . "</pre>";
                }
                
            } catch (Exception $e) {
                echo "<p class='error'>✗ Erreur lors de l'inclusion du fichier: " . htmlspecialchars($e->getMessage()) . "</p>";
            }
            
            // Lecture du contenu
            $content = file_get_contents($path);
            echo "<p>Contenu du fichier:</p>";
            echo "<pre>" . htmlspecialchars($content) . "</pre>";
            
            $found = true;
        } else {
            echo "<p class='error'>✗ Le fichier n'existe pas à ce chemin.</p>";
        }
        
        echo "</div>";
    }
    
    if (!$found) {
        echo "<div class='result error'>";
        echo "<h3>Aucun fichier env.php trouvé!</h3>";
        echo "<p>Créer un fichier env.php dans le dossier api/config/ avec le contenu suivant:</p>";
        
        $env_sample = <<<EOT
<?php
// Configuration des variables d'environnement pour Infomaniak
define('DB_HOST', 'p71x6d.myd.infomaniak.com');
define('DB_NAME', 'p71x6d_richard');
define('DB_USER', 'p71x6d_richard');
define('DB_PASS', 'Trottinette43!');
define('API_BASE_URL', '/api');
define('APP_ENV', 'production');

// Fonction d'aide pour récupérer les variables d'environnement
function get_env(\$key, \$default = null) {
    \$const_name = strtoupper(\$key);
    if (defined(\$const_name)) {
        return constant(\$const_name);
    }
    return \$default;
}

// Alias pour compatibilité avec différentes syntaxes
if (!function_exists('env')) {
    function env(\$key, \$default = null) {
        return get_env(\$key, \$default);
    }
}
?>
EOT;
        
        echo "<pre>" . htmlspecialchars($env_sample) . "</pre>";
        echo "</div>";
    }
    
    echo "<h2>Test de connexion à la base de données</h2>";
    echo "<div class='result'>";
    
    if (file_exists('./api/config/db_config.json')) {
        echo "<p class='success'>✓ Fichier db_config.json trouvé!</p>";
        $db_config = json_decode(file_get_contents('./api/config/db_config.json'), true);
        
        try {
            $dsn = "mysql:host=" . $db_config['host'] . ";dbname=" . $db_config['db_name'];
            $pdo = new PDO($dsn, $db_config['username'], $db_config['password']);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            echo "<p class='success'>✓ Connexion à la base de données réussie!</p>";
            
            $stmt = $pdo->query("SELECT COUNT(*) FROM utilisateurs");
            $count = $stmt->fetchColumn();
            
            echo "<p>Nombre d'utilisateurs dans la table: " . $count . "</p>";
        } catch (PDOException $e) {
            echo "<p class='error'>✗ Erreur de connexion à la base de données: " . htmlspecialchars($e->getMessage()) . "</p>";
        }
    } else {
        echo "<p class='error'>✗ Fichier db_config.json non trouvé.</p>";
    }
    
    echo "</div>";
    
    // Résumé et recommandations
    echo "<h2>Résumé et recommandations</h2>";
    echo "<div class='result'>";
    
    if ($found) {
        echo "<p class='success'>✓ Le fichier env.php a été trouvé.</p>";
        echo "<p>Pour résoudre les problèmes d'inclusion:</p>";
        echo "<ol>";
        echo "<li>Vérifiez que les chemins d'inclusion dans vos fichiers PHP sont corrects</li>";
        echo "<li>Utilisez toujours des chemins relatifs au document root ou des chemins absolus</li>";
        echo "<li>Vérifiez que les fichiers ont les permissions appropriées (644 pour les fichiers, 755 pour les dossiers)</li>";
        echo "</ol>";
    } else {
        echo "<p class='error'>✗ Le fichier env.php n'a pas été trouvé.</p>";
        echo "<p>Actions recommandées:</p>";
        echo "<ol>";
        echo "<li>Créez le fichier env.php dans le dossier api/config/</li>";
        echo "<li>Assurez-vous que les permissions sont correctement configurées</li>";
        echo "<li>Vérifiez la structure des dossiers de votre application</li>";
        echo "</ol>";
    }
    
    echo "</div>";
    ?>
</body>
</html>
