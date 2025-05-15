
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des chemins Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2 { color: #333; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .section { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Correction des chemins Infomaniak pour FormaCert</h1>
    
    <div class="section">
        <h2>Informations sur le serveur</h2>
        <?php
        echo "<p>PHP Version: " . phpversion() . "</p>";
        echo "<p>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
        echo "<p>Script Filename: " . $_SERVER['SCRIPT_FILENAME'] . "</p>";
        echo "<p>Répertoire courant: " . getcwd() . "</p>";
        ?>
    </div>
    
    <div class="section">
        <h2>Test des chemins Infomaniak</h2>
        <?php
        // Chemins à tester
        $paths = [
            '/home/clients/df8dceff557ccc0605d45e1581aa661b' => 'Chemin client Infomaniak',
            '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites' => 'Dossier sites',
            '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch' => 'Dossier qualiopi.ch',
            '/sites' => 'Dossier sites (racine)',
            '/sites/qualiopi.ch' => 'Dossier qualiopi.ch (racine)'
        ];
        
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Chemin</th><th>Description</th><th>Statut</th></tr>";
        
        foreach ($paths as $path => $desc) {
            echo "<tr>";
            echo "<td>$path</td>";
            echo "<td>$desc</td>";
            echo "<td>";
            if (is_dir($path)) {
                echo "<span class='success'>Existe</span>";
                // Lister quelques fichiers
                $files = scandir($path);
                echo " (" . (count($files) - 2) . " éléments)";
            } else {
                echo "<span class='error'>N'existe pas</span>";
            }
            echo "</td></tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>Création d'un fichier index.php de redirection</h2>
        <?php
        // Créer un fichier index.php qui redirige vers index.html si nécessaire
        if (!file_exists('index.php')) {
            $content = '<?php
// Redirection vers la page principale
header("Location: index.html");
exit;
?>';
            
            if (file_put_contents('index.php', $content)) {
                echo "<p class='success'>Fichier index.php créé avec succès pour rediriger vers index.html</p>";
            } else {
                echo "<p class='error'>Impossible de créer le fichier index.php</p>";
            }
        } else {
            echo "<p>Le fichier index.php existe déjà.</p>";
            echo "<pre>" . htmlspecialchars(file_get_contents('index.php')) . "</pre>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Vérification de la base de données</h2>
        <?php
        $db_config_file = 'api/config/db_config.json';
        
        if (file_exists($db_config_file)) {
            echo "<p class='success'>Fichier de configuration de la base de données trouvé</p>";
            
            $db_config = json_decode(file_get_contents($db_config_file), true);
            if ($db_config && isset($db_config['host'])) {
                echo "<p>Configuration trouvée pour le serveur: " . $db_config['host'] . "</p>";
                
                try {
                    $dsn = "mysql:host={$db_config['host']};dbname={$db_config['db_name']}";
                    $pdo = new PDO($dsn, $db_config['username'], $db_config['password']);
                    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                    
                    echo "<p class='success'>Connexion à la base de données réussie!</p>";
                } catch (PDOException $e) {
                    echo "<p class='error'>Erreur de connexion à la base de données: " . $e->getMessage() . "</p>";
                }
            } else {
                echo "<p class='error'>Fichier de configuration invalide ou incomplet</p>";
            }
        } else {
            echo "<p class='error'>Fichier de configuration de la base de données non trouvé</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Test d'accès aux fichiers clés</h2>
        <?php
        $key_files = [
            'index.html' => 'Page principale',
            'assets/index.js' => 'JavaScript principal',
            'api/index.php' => 'Point d\'entrée API',
            'api/login.php' => 'API de connexion',
            '.htaccess' => 'Configuration Apache'
        ];
        
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Fichier</th><th>Description</th><th>Statut</th></tr>";
        
        foreach ($key_files as $file => $desc) {
            echo "<tr>";
            echo "<td>$file</td>";
            echo "<td>$desc</td>";
            echo "<td>";
            if (file_exists($file)) {
                echo "<span class='success'>Existe</span> (" . filesize($file) . " octets)";
            } else {
                echo "<span class='error'>N'existe pas</span>";
            }
            echo "</td></tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>Actions</h2>
        <p>Voici les actions que vous pouvez effectuer:</p>
        <ul>
            <li><a href="php-test.php">Exécuter le test PHP simple</a></li>
            <li><a href="phpinfo.php">Voir les informations PHP</a></li>
            <li><a href="api/phpinfo.php">Voir les informations PHP (dossier API)</a></li>
            <li><a href="index.html">Aller à la page principale</a></li>
        </ul>
    </div>
</body>
</html>
