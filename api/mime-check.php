
<?php
header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérification des types MIME</title>
    <style>
        body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; }
        .section { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Vérification des types MIME</h1>
    
    <div class="section">
        <h2>Informations serveur</h2>
        <p>Serveur: <?php echo $_SERVER['SERVER_SOFTWARE']; ?></p>
        <p>PHP Version: <?php echo phpversion(); ?></p>
    </div>

    <div class="section">
        <h2>Test des types MIME</h2>
        <?php
        // Vérifier un fichier JS existant
        $js_files = glob('../assets/*.js');
        if (!empty($js_files)) {
            $test_file = $js_files[0];
            $file_info = pathinfo($test_file);
            $filename = $file_info['basename'];
            
            echo "<p>Fichier JS test: <code>{$filename}</code></p>";
            
            // Obtenir le type MIME à partir du système
            $mime_type = mime_content_type($test_file);
            echo "<p>Type MIME détecté par le système: <code>{$mime_type}</code></p>";
            
            // Vérifier les types MIME corrects
            if ($mime_type === 'application/javascript' || $mime_type === 'text/javascript') {
                echo "<p class='success'>Le type MIME est correctement configuré !</p>";
            } else {
                echo "<p class='error'>Le type MIME n'est pas correctement configuré. Devrait être 'application/javascript'.</p>";
                
                echo "<p>Types MIME recommandés dans .htaccess:</p>";
                echo "<pre>AddType application/javascript .js
AddType application/javascript .mjs</pre>";
            }
            
        } else {
            echo "<p class='error'>Aucun fichier JavaScript trouvé dans le répertoire assets pour tester.</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Configuration des en-têtes</h2>
        <p>Lien vers le test client: <a href="/mime-test.html" target="_blank">Tester le chargement de module</a></p>
        <p>Pour vérifier les en-têtes d'un fichier JavaScript, utilisez l'outil de développement de votre navigateur (F12) sous l'onglet "Réseau".</p>
    </div>
    
    <div class="section">
        <h2>Solution recommandée</h2>
        <p>Assurez-vous que votre serveur est configuré pour servir les fichiers JavaScript avec le type MIME correct:</p>
        <pre>
# Dans .htaccess
AddType application/javascript .js
AddType application/javascript .mjs

# Ou avec des en-têtes
&lt;FilesMatch "\.js$"&gt;
    Header set Content-Type "application/javascript; charset=UTF-8"
&lt;/FilesMatch&gt;
&lt;FilesMatch "\.mjs$"&gt;
    Header set Content-Type "application/javascript; charset=UTF-8"
&lt;/FilesMatch&gt;
        </pre>
    </div>
</body>
</html>
