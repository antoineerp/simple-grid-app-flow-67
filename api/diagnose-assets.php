
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic des Assets</title>
    <style>
        body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { color: blue; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        h2 { margin-top: 0; }
    </style>
</head>
<body>
    <h1>Diagnostic de Déploiement FormaCert</h1>
    
    <div class="section">
        <h2>Informations Serveur</h2>
        <p>Serveur: <?php echo $_SERVER['SERVER_SOFTWARE']; ?></p>
        <p>PHP Version: <?php echo phpversion(); ?></p>
        <p>Document Root: <?php echo $_SERVER['DOCUMENT_ROOT']; ?></p>
        <p>Répertoire Courant: <?php echo getcwd(); ?></p>
    </div>
    
    <div class="section">
        <h2>Structure des Fichiers</h2>
        <?php
        $directories = [
            '../assets' => 'Dossier des assets JS/CSS',
            '../public' => 'Dossier des fichiers publics',
            '../public/lovable-uploads' => 'Dossier des uploads',
            '../api' => 'Dossier API'
        ];
        
        foreach ($directories as $dir => $description) {
            echo "<p>$description ($dir): ";
            if (file_exists($dir)) {
                echo "<span class='success'>Existe</span>";
                $files = scandir($dir);
                $fileCount = count($files) - 2; // Moins . et ..
                echo " ($fileCount fichiers)";
            } else {
                echo "<span class='error'>N'existe pas</span>";
            }
            echo "</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Fichiers Clés</h2>
        <?php
        $key_files = [
            '../index.html' => 'Page d\'accueil',
            '../.htaccess' => 'Configuration Apache',
        ];
        
        // Vérification du fichier JavaScript principal (index.js ou main-*.js)
        $js_file_exists = false;
        $js_file_name = "";
        
        if (file_exists('../assets/index.js')) {
            $js_file_exists = true;
            $js_file_name = '../assets/index.js';
        } else {
            // Chercher un fichier main-*.js s'il n'y a pas d'index.js
            $main_js_files = glob('../assets/main-*.js');
            if (!empty($main_js_files)) {
                $js_file_exists = true;
                $js_file_name = $main_js_files[0];
            }
        }
        
        $key_files[$js_file_name] = 'JavaScript principal';
        
        foreach ($key_files as $file => $description) {
            echo "<p>$description ($file): ";
            if (file_exists($file)) {
                echo "<span class='success'>Existe</span>";
                echo " (" . filesize($file) . " octets)";
            } else {
                echo "<span class='error'>N'existe pas</span>";
            }
            echo "</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Test d'Inclusion JavaScript</h2>
        <div id="js-test">Test JavaScript...</div>
        
        <script>
            document.getElementById('js-test').textContent = 'JavaScript fonctionne correctement!';
            document.getElementById('js-test').style.color = 'green';
        </script>
    </div>
    
    <div class="section">
        <h2>Instructions de Déploiement</h2>
        <ol>
            <li>Assurez-vous que le contenu du répertoire <code>dist</code> est copié à la racine du site</li>
            <li>Vérifiez que le fichier <code>index.html</code> pointe vers le bon fichier JavaScript (soit <code>/assets/index.js</code> soit <code>/assets/main-*.js</code>)</li>
            <li>Assurez-vous que le fichier <code>.htaccess</code> est présent à la racine</li>
            <li>Vérifiez que le répertoire <code>assets</code> contient les fichiers JS compilés</li>
        </ol>
    </div>
    
    <p><a href="/">Retour à l'application</a> | <a href="../php-test.php">Diagnostic PHP complet</a></p>
</body>
</html>
