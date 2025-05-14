
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification de la Compilation et du Déploiement</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Vérification de la Compilation et du Déploiement</h1>
        
        <div class="card">
            <h2>1. Vérification des fichiers assets</h2>
            <?php
            $assets_path = './assets';
            $js_files = glob("$assets_path/*.js");
            $css_files = glob("$assets_path/*.css");
            
            echo "<p>Fichiers JavaScript: ";
            if (count($js_files) > 0) {
                echo "<span class='success'>" . count($js_files) . " trouvés</span></p><ul>";
                foreach ($js_files as $file) {
                    $filename = basename($file);
                    $filesize = filesize($file);
                    $modified = date("Y-m-d H:i:s", filemtime($file));
                    echo "<li>$filename - $filesize octets (modifié: $modified)</li>";
                }
                echo "</ul>";
            } else {
                echo "<span class='error'>Aucun fichier JS trouvé</span></p>";
            }
            
            echo "<p>Fichiers CSS: ";
            if (count($css_files) > 0) {
                echo "<span class='success'>" . count($css_files) . " trouvés</span></p><ul>";
                foreach ($css_files as $file) {
                    $filename = basename($file);
                    $filesize = filesize($file);
                    $modified = date("Y-m-d H:i:s", filemtime($file));
                    echo "<li>$filename - $filesize octets (modifié: $modified)</li>";
                }
                echo "</ul>";
            } else {
                echo "<span class='error'>Aucun fichier CSS trouvé</span></p>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>2. Vérification du fichier index.html</h2>
            <?php
            if (file_exists('index.html')) {
                $index_content = file_get_contents('index.html');
                echo "<p><span class='success'>Fichier index.html trouvé</span></p>";
                
                // Vérifier les références CSS
                if (preg_match('/<link[^>]*href=["\']([^"\']*\.css)["\']/i', $index_content, $css_matches)) {
                    $css_ref = $css_matches[1];
                    $css_path = '.' . $css_ref;
                    if (file_exists($css_path)) {
                        echo "<p>Référence CSS: <span class='success'>$css_ref (fichier existe)</span></p>";
                    } else {
                        echo "<p>Référence CSS: <span class='error'>$css_ref (fichier n'existe pas!)</span></p>";
                    }
                } else {
                    echo "<p><span class='error'>Aucune référence CSS trouvée dans index.html</span></p>";
                }
                
                // Vérifier les références JS
                if (preg_match('/<script[^>]*src=["\']([^"\']*\.js)["\']/i', $index_content, $js_matches)) {
                    $js_ref = $js_matches[1];
                    $js_path = '.' . $js_ref;
                    if (file_exists($js_path)) {
                        echo "<p>Référence JS: <span class='success'>$js_ref (fichier existe)</span></p>";
                    } else {
                        echo "<p>Référence JS: <span class='error'>$js_ref (fichier n'existe pas!)</span></p>";
                    }
                } else {
                    echo "<p><span class='error'>Aucune référence JS trouvée dans index.html</span></p>";
                }
                
                echo "<p>Contenu de index.html:</p>";
                echo "<pre>" . htmlspecialchars($index_content) . "</pre>";
            } else {
                echo "<p><span class='error'>Fichier index.html non trouvé!</span></p>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>3. Test des types MIME</h2>
            <?php
            function check_mime_type($url) {
                $ch = curl_init($url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HEADER, true);
                curl_setopt($ch, CURLOPT_NOBODY, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                curl_exec($ch);
                $content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
                $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                return ['mime' => $content_type, 'code' => $http_code];
            }
            
            $base_url = "http" . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "s" : "") . "://" . $_SERVER['HTTP_HOST'];
            
            if (count($css_files) > 0) {
                $test_css = $base_url . '/assets/' . basename($css_files[0]);
                $css_mime = check_mime_type($test_css);
                echo "<p>Test MIME pour CSS ($test_css): ";
                if (strpos($css_mime['mime'], 'text/css') !== false) {
                    echo "<span class='success'>OK - " . $css_mime['mime'] . "</span>";
                } else {
                    echo "<span class='error'>INCORRECT - " . $css_mime['mime'] . " (devrait être text/css)</span>";
                }
                echo " (code HTTP: " . $css_mime['code'] . ")</p>";
            }
            
            if (count($js_files) > 0) {
                $test_js = $base_url . '/assets/' . basename($js_files[0]);
                $js_mime = check_mime_type($test_js);
                echo "<p>Test MIME pour JS ($test_js): ";
                if (strpos($js_mime['mime'], 'javascript') !== false || strpos($js_mime['mime'], 'js') !== false) {
                    echo "<span class='success'>OK - " . $js_mime['mime'] . "</span>";
                } else {
                    echo "<span class='error'>INCORRECT - " . $js_mime['mime'] . " (devrait être application/javascript)</span>";
                }
                echo " (code HTTP: " . $js_mime['code'] . ")</p>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>4. Vérification des fichiers de configuration</h2>
            <?php
            $config_files = [
                '.htaccess' => 'Configuration Apache principale',
                'assets/.htaccess' => 'Configuration MIME types pour assets',
                '.user.ini' => 'Configuration PHP'
            ];
            
            foreach ($config_files as $file => $description) {
                echo "<h3>$description ($file)</h3>";
                if (file_exists($file)) {
                    $content = file_get_contents($file);
                    echo "<p><span class='success'>Fichier trouvé</span></p>";
                    echo "<pre>" . htmlspecialchars($content) . "</pre>";
                } else {
                    echo "<p><span class='error'>Fichier non trouvé!</span></p>";
                }
            }
            ?>
        </div>
        
        <div class="card">
            <h2>5. Solution pour problèmes de MIME type</h2>
            
            <?php if (isset($_POST['fix_configs'])): ?>
                <h3>Résultats des corrections</h3>
                <?php
                // Vérifier/créer le .htaccess principal
                $main_htaccess = ".htaccess";
                $main_htaccess_content = <<<EOT
# Activer le moteur de réécriture
RewriteEngine On

# Rediriger toutes les requêtes vers index.html sauf les fichiers physiques et les dossiers
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Configuration explicite des types MIME
AddType text/css .css
AddType application/javascript .js
AddType application/javascript .mjs
AddType image/svg+xml .svg

# Force le type MIME pour CSS avec le charset UTF-8
<FilesMatch "\.css$">
    ForceType text/css
    Header set Content-Type "text/css; charset=utf-8"
</FilesMatch>

# Force le type MIME pour JavaScript avec le charset UTF-8
<FilesMatch "\.js$">
    ForceType application/javascript
    Header set Content-Type "application/javascript; charset=utf-8"
</FilesMatch>

# Cache pour les fichiers statiques
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
</IfModule>

# Désactiver l'indexation des répertoires
Options -Indexes

# Protection contre le MIME-sniffing
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
</IfModule>
EOT;

                if (file_put_contents($main_htaccess, $main_htaccess_content)) {
                    echo "<p>.htaccess principal: <span class='success'>Mis à jour avec succès</span></p>";
                } else {
                    echo "<p>.htaccess principal: <span class='error'>Échec de la mise à jour</span></p>";
                }
                
                // Créer/Mettre à jour le .htaccess pour les assets
                $assets_dir = "assets";
                if (!is_dir($assets_dir)) {
                    if (mkdir($assets_dir, 0755)) {
                        echo "<p>Dossier assets: <span class='success'>Créé avec succès</span></p>";
                    } else {
                        echo "<p>Dossier assets: <span class='error'>Échec de la création</span></p>";
                    }
                }
                
                $assets_htaccess = "assets/.htaccess";
                $assets_htaccess_content = <<<EOT
# Configuration explicite des types MIME pour les assets
AddType text/css .css
AddType application/javascript .js
AddType application/javascript .mjs
AddType image/svg+xml .svg
AddType font/ttf .ttf
AddType font/woff .woff
AddType font/woff2 .woff2

# Force le type MIME pour CSS
<FilesMatch "\.css$">
    ForceType text/css
    Header set Content-Type "text/css; charset=utf-8"
</FilesMatch>

# Force le type MIME pour JavaScript
<FilesMatch "\.js$">
    ForceType application/javascript
    Header set Content-Type "application/javascript; charset=utf-8"
</FilesMatch>

# Activer la mise en cache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Désactiver le MIME-sniffing
Header set X-Content-Type-Options "nosniff"

# Autoriser l'accès aux fichiers
<Files *>
    Order Allow,Deny
    Allow from all
</Files>
EOT;

                if (file_put_contents($assets_htaccess, $assets_htaccess_content)) {
                    echo "<p>.htaccess assets: <span class='success'>Mis à jour avec succès</span></p>";
                } else {
                    echo "<p>.htaccess assets: <span class='error'>Échec de la mise à jour</span></p>";
                }
                
                // Créer/Mettre à jour le .user.ini
                $user_ini = ".user.ini";
                $user_ini_content = <<<EOT
; Configuration PHP pour Infomaniak
display_errors = Off
log_errors = On
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
max_execution_time = 120
memory_limit = 256M
upload_max_filesize = 64M
post_max_size = 64M
EOT;

                if (file_put_contents($user_ini, $user_ini_content)) {
                    echo "<p>.user.ini: <span class='success'>Mis à jour avec succès</span></p>";
                } else {
                    echo "<p>.user.ini: <span class='error'>Échec de la mise à jour</span></p>";
                }
                
                echo "<p><strong>Configurations mises à jour. Veuillez recharger votre page principale pour vérifier que les problèmes sont résolus.</strong></p>";
                
            else:
            ?>
                <p>Si vous rencontrez des problèmes de type MIME ou de configuration, vous pouvez utiliser ce script pour corriger automatiquement les fichiers de configuration:</p>
                
                <form method="post">
                    <button type="submit" name="fix_configs" style="background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">
                        Corriger les configurations
                    </button>
                </form>
                
                <p><strong>Actions qui seront effectuées:</strong></p>
                <ul>
                    <li>Création/mise à jour du fichier <code>.htaccess</code> principal</li>
                    <li>Création/mise à jour du fichier <code>assets/.htaccess</code> spécifique aux assets</li>
                    <li>Création/mise à jour du fichier <code>.user.ini</code> pour la configuration PHP</li>
                </ul>
                
                <p><strong>Note:</strong> Ces corrections seront écrasées lors du prochain déploiement si elles ne sont pas également apportées aux fichiers source dans votre dépôt GitHub.</p>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
