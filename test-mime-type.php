
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test MIME Type pour JavaScript Modules</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 3px; overflow-x: auto; }
        .button { background: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>Test MIME Type pour JavaScript Modules</h1>
    
    <div class="test-section">
        <h2>Environnement serveur</h2>
        <p>Serveur: <?php echo $_SERVER['SERVER_SOFTWARE']; ?></p>
        <p>PHP version: <?php echo phpversion(); ?></p>
        
        <?php
        // Vérifier si mod_mime et mod_headers sont chargés
        $mod_mime = function_exists('apache_get_modules') ? in_array('mod_mime', apache_get_modules()) : 'Non détectable';
        $mod_headers = function_exists('apache_get_modules') ? in_array('mod_headers', apache_get_modules()) : 'Non détectable';
        ?>
        
        <p>mod_mime: <?php echo is_bool($mod_mime) ? ($mod_mime ? '<span class="success">Activé</span>' : '<span class="error">Désactivé</span>') : $mod_mime; ?></p>
        <p>mod_headers: <?php echo is_bool($mod_headers) ? ($mod_headers ? '<span class="success">Activé</span>' : '<span class="error">Désactivé</span>') : $mod_headers; ?></p>
    </div>
    
    <div class="test-section">
        <h2>Test de fichier JavaScript</h2>
        <?php
        // Créer un fichier JS de test si nécessaire
        $js_test_file = 'assets/test-module.js';
        $js_content = "// Module JavaScript de test\nexport function hello() {\n  return 'Module JavaScript fonctionnel!';\n}\n";
        
        if (!is_dir('assets')) {
            mkdir('assets', 0755, true);
            echo "<p>Dossier assets créé</p>";
        }
        
        if (!file_exists($js_test_file)) {
            file_put_contents($js_test_file, $js_content);
            echo "<p>Fichier de test créé: $js_test_file</p>";
        }
        
        // Tester le MIME type du fichier
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $js_test_file);
        finfo_close($finfo);
        
        $mime_status = ($mime === 'application/javascript' || $mime === 'text/javascript') ? 'success' : 'error';
        ?>
        
        <p>Fichier: <?php echo $js_test_file; ?></p>
        <p>MIME type local: <span class="<?php echo $mime_status; ?>"><?php echo $mime; ?></span></p>
        
        <?php
        // Tester l'en-tête HTTP
        $js_url = 'http' . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 's' : '') . 
                '://' . $_SERVER['HTTP_HOST'] . '/' . $js_test_file;
        
        $headers = @get_headers($js_url, 1);
        $content_type = isset($headers['Content-Type']) ? $headers['Content-Type'] : 'Non détecté';
        $content_type_status = (strpos($content_type, 'javascript') !== false) ? 'success' : 'error';
        ?>
        
        <p>En-tête HTTP Content-Type: <span class="<?php echo $content_type_status; ?>"><?php echo $content_type; ?></span></p>
    </div>
    
    <div class="test-section">
        <h2>Test de chargement de module</h2>
        <div id="module-test-result">Chargement...</div>
        
        <script type="module">
            try {
                import('/assets/test-module.js').then(module => {
                    document.getElementById('module-test-result').innerHTML = 
                        '<span class="success">✓ Module JavaScript chargé avec succès: ' + module.hello() + '</span>';
                }).catch(error => {
                    document.getElementById('module-test-result').innerHTML = 
                        '<span class="error">✗ Erreur de chargement du module: ' + error.message + '</span>';
                });
            } catch (error) {
                document.getElementById('module-test-result').innerHTML = 
                    '<span class="error">✗ Erreur lors de l\'import: ' + error.message + '</span>';
            }
        </script>
    </div>
    
    <div class="test-section">
        <h2>Vérification du .htaccess</h2>
        <?php
        $htaccess_path = '.htaccess';
        if (file_exists($htaccess_path)) {
            $htaccess_content = file_get_contents($htaccess_path);
            $has_js_mime = strpos($htaccess_content, 'AddType application/javascript .js') !== false;
            $has_force_type = strpos($htaccess_content, 'ForceType application/javascript') !== false;
            $has_content_type_header = strpos($htaccess_content, 'Content-Type "application/javascript') !== false;
            
            echo "<p>Directive AddType pour JavaScript: " . ($has_js_mime ? '<span class="success">Présente</span>' : '<span class="error">Manquante</span>') . "</p>";
            echo "<p>Directive ForceType pour JavaScript: " . ($has_force_type ? '<span class="success">Présente</span>' : '<span class="error">Manquante</span>') . "</p>";
            echo "<p>En-tête Content-Type pour JavaScript: " . ($has_content_type_header ? '<span class="success">Présent</span>' : '<span class="error">Manquant</span>') . "</p>";
        } else {
            echo "<p><span class='error'>Fichier .htaccess introuvable</span></p>";
        }
        ?>
        
        <?php if (isset($_POST['fix_htaccess'])): ?>
            <?php
            $htaccess_fixed = false;
            $htaccess_content = <<<EOT
# Activer le moteur de réécriture
RewriteEngine On

# Définir les types MIME corrects pour JavaScript modules
AddType application/javascript .js
AddType application/javascript .mjs
AddType application/javascript .es.js

# Force le type MIME pour JavaScript
<FilesMatch "\.(m?js|es\.js)$">
    ForceType application/javascript
    Header set Content-Type "application/javascript; charset=utf-8"
    Header set X-Content-Type-Options "nosniff"
</FilesMatch>

# Force le type MIME pour CSS
<FilesMatch "\.css$">
    ForceType text/css
    Header set Content-Type "text/css; charset=utf-8"
    Header set X-Content-Type-Options "nosniff"
</FilesMatch>

# Permettre les modules JavaScript
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
</IfModule>

# Rediriger vers index.html pour SPA
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]
EOT;
            
            if (file_put_contents($htaccess_path, $htaccess_content) !== false) {
                $htaccess_fixed = true;
                echo "<p><span class='success'>Fichier .htaccess mis à jour avec succès!</span></p>";
            } else {
                echo "<p><span class='error'>Impossible de mettre à jour le fichier .htaccess</span></p>";
            }
            
            if ($htaccess_fixed) {
                echo "<p>Veuillez vider le cache de votre navigateur et rafraîchir la page.</p>";
            }
            ?>
        <?php else: ?>
            <form method="post">
                <button type="submit" name="fix_htaccess" class="button">Corriger le .htaccess</button>
            </form>
        <?php endif; ?>
    </div>
    
    <div class="test-section">
        <h2>Solutions alternatives</h2>
        <p>Si les problèmes persistent après avoir corrigé le .htaccess, essayez ces solutions:</p>
        <ol>
            <li>Utilisez l'attribut <code>nomodule</code> pour fournir un fallback pour les navigateurs qui ne supportent pas les modules ES6</li>
            <li>Ajoutez explicitement <code>type="module"</code> aux balises script</li>
            <li>Contactez votre hébergeur (Infomaniak) pour vérifier que les modules JavaScript sont correctement configurés sur votre hébergement</li>
            <li>Essayez de servir les fichiers statiques via un CDN qui configure automatiquement les types MIME corrects</li>
        </ol>
        
        <p>Exemple de script avec fallback:</p>
        <pre>&lt;script type="module" src="/assets/app.js"&gt;&lt;/script&gt;
&lt;script nomodule src="/assets/app-legacy.js"&gt;&lt;/script&gt;</pre>
    </div>
    
    <a href="/" class="button">Retour à l'accueil</a>
</body>
</html>
