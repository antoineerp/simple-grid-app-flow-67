
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Déploiement manuel sur Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2 { color: #333; }
        .section { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>Déploiement manuel sur Infomaniak</h1>
    
    <div class="section">
        <h2>Étape 1: Vérification des chemins</h2>
        <?php
        echo "<p>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
        echo "<p>Répertoire courant: " . getcwd() . "</p>";
        
        // Vérifier les chemins Infomaniak
        $client_path = '/home/clients/df8dceff557ccc0605d45e1581aa661b';
        $site_path = '/sites/qualiopi.ch';
        
        echo "<p>Chemin client Infomaniak: " . (is_dir($client_path) ? '<span class="success">Existe</span>' : '<span class="error">N\'existe pas</span>') . "</p>";
        echo "<p>Chemin site (absolu): " . (is_dir($site_path) ? '<span class="success">Existe</span>' : '<span class="error">N\'existe pas</span>') . "</p>";
        ?>
    </div>
    
    <div class="section">
        <h2>Étape 2: Création/mise à jour du fichier index.php</h2>
        <?php
        $index_php_content = '<?php
// Redirection vers le script de déploiement
header(\'Location: deploy-on-infomaniak.php\');
exit;
?>
';
        
        if (file_put_contents('index.php', $index_php_content)) {
            echo "<p class='success'>Fichier index.php créé avec succès</p>";
        } else {
            echo "<p class='error'>Impossible de créer le fichier index.php</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Étape 3: Vérification des fichiers essentiels</h2>
        <?php
        $essential_files = [
            'index.html' => 'Page principale',
            'assets/index.js' => 'JavaScript principal',
            'api/index.php' => 'Point d\'entrée API',
            'api/phpinfo.php' => 'Informations PHP API',
            'phpinfo.php' => 'Informations PHP',
            '.htaccess' => 'Configuration Apache'
        ];
        
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Fichier</th><th>Description</th><th>Statut</th></tr>";
        
        foreach ($essential_files as $file => $desc) {
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
        <h2>Étape 4: Vérification de la configuration API</h2>
        <?php
        $api_config_file = 'api/config/db_config.json';
        
        if (file_exists($api_config_file)) {
            echo "<p class='success'>Fichier de configuration API trouvé</p>";
            
            $config = json_decode(file_get_contents($api_config_file), true);
            if ($config && isset($config['host'])) {
                echo "<p>Configuration pour l'hôte: " . $config['host'] . "</p>";
                
                if ($config['host'] === 'p71x6d.myd.infomaniak.com') {
                    echo "<p class='success'>Configuration correcte pour Infomaniak</p>";
                } else {
                    echo "<p class='error'>La configuration ne correspond pas à Infomaniak</p>";
                    
                    // Mise à jour de la configuration
                    $config['host'] = 'p71x6d.myd.infomaniak.com';
                    $config['db_name'] = 'p71x6d_richard';
                    $config['username'] = 'p71x6d_richard';
                    $config['password'] = 'Trottinette43!';
                    
                    if (file_put_contents($api_config_file, json_encode($config, JSON_PRETTY_PRINT))) {
                        echo "<p class='success'>Configuration mise à jour pour Infomaniak</p>";
                    } else {
                        echo "<p class='error'>Impossible de mettre à jour la configuration</p>";
                    }
                }
            } else {
                echo "<p class='error'>Fichier de configuration invalide</p>";
            }
        } else {
            echo "<p class='error'>Fichier de configuration API non trouvé</p>";
            
            // Création du répertoire si nécessaire
            if (!is_dir('api/config')) {
                mkdir('api/config', 0755, true);
                echo "<p>Répertoire api/config créé</p>";
            }
            
            // Création du fichier de configuration
            $config = [
                'host' => 'p71x6d.myd.infomaniak.com',
                'db_name' => 'p71x6d_richard',
                'username' => 'p71x6d_richard',
                'password' => 'Trottinette43!'
            ];
            
            if (file_put_contents($api_config_file, json_encode($config, JSON_PRETTY_PRINT))) {
                echo "<p class='success'>Fichier de configuration API créé</p>";
            } else {
                echo "<p class='error'>Impossible de créer le fichier de configuration API</p>";
            }
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Étape 5: Test de l'exécution PHP</h2>
        <p>Vérifiez que PHP s'exécute correctement en accédant à ces fichiers:</p>
        <ul>
            <li><a href="phpinfo.php" target="_blank">phpinfo.php</a> - Informations PHP</li>
            <li><a href="api/phpinfo.php" target="_blank">api/phpinfo.php</a> - Informations PHP (dossier API)</li>
            <li><a href="php-test.php" target="_blank">php-test.php</a> - Test simple PHP</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Étape 6: Actions</h2>
        <p>Voici les actions recommandées:</p>
        <ol>
            <li>Vérifiez que PHP s'exécute correctement en accédant aux liens ci-dessus</li>
            <li>Vérifiez la connexion à la base de données en accédant à <a href="api/db-test.php" target="_blank">api/db-test.php</a></li>
            <li>Accédez à l'application principale via <a href="index.html">index.html</a></li>
        </ol>
    </div>
</body>
</html>
