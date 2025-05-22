
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Correction de la Configuration PHP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .section { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Correction de la Configuration PHP</h1>
    
    <div class="section">
        <h2>1. Vérification de la configuration PHP</h2>
        <?php
        // Vérifier si PHP s'exécute
        echo "<p>PHP version " . phpversion() . " est en cours d'exécution.</p>";
        
        // Vérifier si mod_rewrite est activé
        if(function_exists('apache_get_modules')) {
            $modules = apache_get_modules();
            $mod_rewrite = in_array('mod_rewrite', $modules);
            echo "<p>mod_rewrite: " . ($mod_rewrite ? "<span class='success'>Activé</span>" : "<span class='error'>Non activé</span>") . "</p>";
        } else {
            echo "<p>Impossible de vérifier les modules Apache.</p>";
        }
        
        // Vérifier l'existence des fichiers .htaccess
        $root_htaccess = file_exists('../.htaccess');
        $api_htaccess = file_exists('.htaccess');
        
        echo "<p>Fichier .htaccess racine: " . ($root_htaccess ? "<span class='success'>Existe</span>" : "<span class='error'>N'existe pas</span>") . "</p>";
        echo "<p>Fichier .htaccess API: " . ($api_htaccess ? "<span class='success'>Existe</span>" : "<span class='error'>N'existe pas</span>") . "</p>";
        ?>
    </div>
    
    <div class="section">
        <h2>2. Test d'exécution PHP</h2>
        <?php
        // Essayer de créer un fichier de test temporaire
        $test_file = 'php-test-output.json';
        $test_content = json_encode(['test' => true, 'time' => time()]);
        
        if(file_put_contents($test_file, $test_content)) {
            echo "<p class='success'>Fichier de test créé avec succès.</p>";
            echo "<p>Contenu: " . htmlspecialchars($test_content) . "</p>";
            
            // Essayer de lire le fichier
            if(file_exists($test_file)) {
                $content = file_get_contents($test_file);
                echo "<p class='success'>Fichier de test lu avec succès.</p>";
                echo "<p>Contenu lu: " . htmlspecialchars($content) . "</p>";
                
                // Supprimer le fichier de test
                if(unlink($test_file)) {
                    echo "<p class='success'>Fichier de test supprimé avec succès.</p>";
                } else {
                    echo "<p class='error'>Impossible de supprimer le fichier de test.</p>";
                }
            } else {
                echo "<p class='error'>Impossible de lire le fichier de test.</p>";
            }
        } else {
            echo "<p class='error'>Impossible de créer un fichier de test. Vérifiez les permissions.</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>3. Vérification des handlers PHP</h2>
        <p>Handler PHP actuel: <?php echo php_sapi_name(); ?></p>
        <p>Headers déjà envoyés: <?php echo headers_sent() ? "<span class='error'>Oui</span>" : "<span class='success'>Non</span>"; ?></p>
        <p>Output buffering: <?php echo ob_get_level() > 0 ? "<span class='success'>Activé (niveau " . ob_get_level() . ")</span>" : "<span class='error'>Désactivé</span>"; ?></p>
        
        <h3>Test d'un en-tête JSON:</h3>
        <?php
        // Tester si les en-têtes peuvent être envoyés
        $can_send_headers = !headers_sent();
        if($can_send_headers) {
            echo "<p class='success'>Les en-têtes peuvent être envoyés.</p>";
        } else {
            echo "<p class='error'>Les en-têtes ne peuvent pas être envoyés. Une sortie a déjà été générée.</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>4. Actions correctives</h2>
        <p>Pour corriger les problèmes d'exécution PHP:</p>
        <ol>
            <li>Vérifiez que le module PHP est correctement installé sur votre serveur.</li>
            <li>Assurez-vous que les fichiers .htaccess sont correctement déployés.</li>
            <li>Vérifiez les permissions des fichiers PHP (644 ou 755).</li>
            <li>Testez l'exécution PHP avec le fichier <a href="php-execution-test.php" target="_blank">php-execution-test.php</a>.</li>
            <li>Si nécessaire, contactez votre hébergeur pour vérifier la configuration du serveur.</li>
        </ol>
        
        <p><a href="php-execution-test.php" target="_blank" style="display: inline-block; background: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Tester l'exécution PHP</a></p>
    </div>
    
    <div class="section">
        <h2>5. Informations supplémentaires</h2>
        <p>Document root: <?php echo $_SERVER['DOCUMENT_ROOT']; ?></p>
        <p>Script filename: <?php echo $_SERVER['SCRIPT_FILENAME']; ?></p>
        <p>Server software: <?php echo $_SERVER['SERVER_SOFTWARE']; ?></p>
        
        <h3>Variables de serveur importantes:</h3>
        <pre>
REQUEST_URI: <?php echo $_SERVER['REQUEST_URI']; ?>
SCRIPT_NAME: <?php echo $_SERVER['SCRIPT_NAME']; ?>
PHP_SELF: <?php echo $_SERVER['PHP_SELF']; ?>
        </pre>
    </div>
</body>
</html>
