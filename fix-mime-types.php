
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des Types MIME</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .section { margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Diagnostic et correction des types MIME</h1>
    
    <?php
    $htaccess_root = file_exists('.htaccess');
    $htaccess_api = file_exists('api/.htaccess');
    ?>
    
    <h2>Vérification des fichiers .htaccess</h2>
    <p>Fichier .htaccess racine: <?= $htaccess_root ? '<span class="success">EXISTE</span>' : '<span class="error">INTROUVABLE</span>' ?></p>
    <p>Fichier .htaccess API: <?= $htaccess_api ? '<span class="success">EXISTE</span>' : '<span class="error">INTROUVABLE</span>' ?></p>
    
    <?php
    function checkMimeType($directory) {
        echo "<h3>Vérification des types MIME dans $directory</h3>";
        
        if (!file_exists($directory)) {
            echo "<p><span class='error'>Répertoire '$directory' introuvable</span></p>";
            return;
        }
        
        $jsFiles = glob("$directory/*.js");
        
        if (empty($jsFiles)) {
            echo "<p><span class='warning'>Aucun fichier JavaScript trouvé dans $directory</span></p>";
            return;
        }
        
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>
              <tr><th>Fichier</th><th>Type MIME</th><th>Status</th></tr>";
        
        foreach ($jsFiles as $file) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = finfo_file($finfo, $file);
            finfo_close($finfo);
            
            $status = ($mime === 'application/javascript' || $mime === 'text/javascript') 
                ? '<span class="success">OK</span>' 
                : '<span class="error">INCORRECT</span>';
            
            echo "<tr>
                  <td>" . basename($file) . "</td>
                  <td>$mime</td>
                  <td>$status</td>
                  </tr>";
        }
        
        echo "</table>";
    }
    
    // Vérifier les répertoires assets et potentiellement d'autres emplacements
    checkMimeType('assets');
    checkMimeType('dist/assets');
    ?>
    
    <div class="section">
        <h2>Test de chargement de module</h2>
        <div id="module-test">Test de chargement de module JavaScript...</div>
        
        <script type="module">
            document.getElementById('module-test').innerHTML = '<span class="success">Le chargement de module JavaScript fonctionne correctement!</span>';
        </script>
    </div>
    
    <div class="section">
        <h2>Vérification des scripts dans index.html</h2>
        <?php
        if (file_exists('index.html')) {
            $content = file_get_contents('index.html');
            $has_module_script = preg_match('/<script[^>]*type=["\']module["\'][^>]*>/i', $content);
            $has_js_script = preg_match('/<script[^>]*src=["\'][^"\']*\.js["\'][^>]*>/i', $content);
            
            echo "<p>Script avec type=\"module\": " . ($has_module_script ? '<span class="success">TROUVÉ</span>' : '<span class="warning">NON TROUVÉ</span>') . "</p>";
            echo "<p>Script JavaScript: " . ($has_js_script ? '<span class="success">TROUVÉ</span>' : '<span class="warning">NON TROUVÉ</span>') . "</p>";
            
            if (!$has_module_script && $has_js_script) {
                echo "<p class='warning'>Le script JavaScript doit avoir l'attribut type=\"module\" pour être chargé comme un module ES.</p>";
            }
        } else {
            echo "<p><span class='error'>Fichier index.html introuvable</span></p>";
        }
        ?>
    </div>
    
    <h2>Recommandations</h2>
    <ol>
        <li>Assurez-vous que les fichiers .htaccess sont correctement déployés à la racine et dans le dossier API</li>
        <li>Vérifiez que les directives AddType et Header sont actives sur votre serveur</li>
        <li>Si vous utilisez un CDN ou un proxy, assurez-vous qu'il n'écrase pas les en-têtes HTTP</li>
        <li>En cas de problème persistant, contactez votre hébergeur pour vérifier la configuration du serveur</li>
        <li>Assurez-vous que tous les scripts de module dans index.html ont l'attribut <code>type="module"</code></li>
    </ol>
    
    <h2>Configuration .htaccess recommandée</h2>
    <pre>
AddType application/javascript .js
AddType application/javascript .mjs
AddType application/javascript .es.js
AddType text/css .css
AddType application/json .json

&lt;IfModule mod_headers.c&gt;
    &lt;FilesMatch "\.(m?js|es\.js)$"&gt;
        Header set Content-Type "application/javascript"
        Header set X-Content-Type-Options "nosniff"
    &lt;/FilesMatch&gt;
&lt;/IfModule&gt;
    </pre>
</body>
</html>
