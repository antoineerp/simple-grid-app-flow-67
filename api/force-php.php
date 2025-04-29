
<?php
// Ce fichier tente de forcer l'exécution PHP même sur des serveurs mal configurés

// Activer l'affichage des erreurs pour ce fichier uniquement
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Définir explicitement le type de contenu
header("Content-Type: text/html; charset=UTF-8");

// Fonction pour tenter de modifier .htaccess
function updateHtaccess($file, $content) {
    if (!file_exists($file)) {
        return @file_put_contents($file, $content);
    }
    
    $current = @file_get_contents($file);
    if ($current === false) return false;
    
    // Ne pas écraser s'il contient déjà les configurations essentielles
    if (strpos($current, 'SetHandler application/x-httpd-php') !== false && 
        strpos($current, 'php_flag engine on') !== false) {
        return true;
    }
    
    // Ajouter à la fin du fichier existant
    return @file_put_contents($file, $current . "\n\n# Added by force-php.php\n" . $content);
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction forcée PHP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Correction forcée des problèmes d'exécution PHP</h1>
    
    <div class="section">
        <h2>État actuel</h2>
        <?php if(function_exists('phpinfo')): ?>
            <p><span class="success">✓ PHP est exécuté correctement dans ce fichier</span></p>
            <p>Version PHP: <?php echo phpversion(); ?></p>
            <p>Mode SAPI: <?php echo php_sapi_name(); ?></p>
        <?php else: ?>
            <p><span class="error">✗ PHP ne fonctionne pas dans ce fichier</span></p>
        <?php endif; ?>
    </div>
    
    <?php
    // Actions de correction si demandées
    if (isset($_POST['fix_htaccess'])) {
        $htaccess_api = <<<EOT
# Force PHP pour tous les fichiers .php - MULTIPLE MÉTHODES DE COMPATIBILITÉ
AddHandler application/x-httpd-php .php
AddType application/x-httpd-php .php

# Force PHP pour tous les fichiers .php
<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

# Force l'interpréteur PHP pour tous les fichiers PHP
<FilesMatch "\.php$">
    <IfModule mod_mime.c>
        ForceType application/x-httpd-php
    </IfModule>
</FilesMatch>

# Ensure PHP is activated
<IfModule mod_php.c>
    php_flag engine on
    php_value display_errors on
    php_value error_reporting E_ALL
</IfModule>

# Support pour FastCGI
<IfModule mod_fcgid.c>
    <FilesMatch "\.php$">
        SetHandler fcgid-script
    </FilesMatch>
</IfModule>

# Support pour FPM
<IfModule mod_proxy_fcgi.c>
    <FilesMatch "\.php$">
        SetHandler "proxy:unix:/var/run/php-fpm.sock|fcgi://localhost"
    </FilesMatch>
</IfModule>

# Set correct MIME types
AddType application/javascript .js
AddType text/css .css
AddType application/json .json

# CORS headers
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Cache-Control "no-cache, no-store, must-revalidate"
</IfModule>

# Allow direct access to PHP files
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule \.(php)$ - [L]
EOT;

        $htaccess_root = <<<EOT
# Force PHP execution and handles routing

# Enable rewrite engine
RewriteEngine On

# Set PHP handler explicitly - THIS IS CRITICAL!
AddHandler application/x-httpd-php .php
AddType application/x-httpd-php .php

# Force PHP for all .php files
<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

# Force PHP interpreter for all PHP files
<FilesMatch "\.php$">
    <IfModule mod_mime.c>
        ForceType application/x-httpd-php
    </IfModule>
</FilesMatch>

# Enable PHP engine explicitly
<IfModule mod_php.c>
    php_flag engine on
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
    Header set Access-Control-Allow-Origin "*"
</IfModule>

# Set correct MIME types
AddType application/javascript .js
AddType application/javascript .mjs
AddType text/css .css
AddType application/json .json

# API requests should not be redirected
RewriteRule ^api/ - [L]

# PHP files should be processed directly
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule \.(php)$ - [L]

# Redirect all other requests to index.html for client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [QSA,L]
EOT;

        $user_ini_content = <<<EOT
; User configuration for PHP

; Force PHP engine activation
engine = On

; Configuration minimale
display_errors = On
error_reporting = E_ALL
log_errors = On
error_log = php_errors.log

; Type MIME
default_mimetype = "text/html"
default_charset = "UTF-8"
EOT;

        // Tenter de mettre à jour les fichiers
        $result_api_htaccess = updateHtaccess('./.htaccess', $htaccess_api);
        $result_root_htaccess = updateHtaccess('../.htaccess', $htaccess_root);
        $result_api_user_ini = @file_put_contents('./.user.ini', $user_ini_content);
        $result_root_user_ini = @file_put_contents('../.user.ini', $user_ini_content);
        
        // Créer phpinfo.php pour tests
        $phpinfo_content = "<?php\nphpinfo();\n?>";
        $result_phpinfo = @file_put_contents('./phpinfo.php', $phpinfo_content);
        $result_root_phpinfo = @file_put_contents('../phpinfo.php', $phpinfo_content);
        
        echo "<div class='section'>";
        echo "<h2>Résultats des corrections</h2>";
        echo "<ul>";
        echo "<li>API .htaccess: " . ($result_api_htaccess ? '<span class="success">Mise à jour réussie</span>' : '<span class="error">Échec</span>') . "</li>";
        echo "<li>Root .htaccess: " . ($result_root_htaccess ? '<span class="success">Mise à jour réussie</span>' : '<span class="error">Échec</span>') . "</li>";
        echo "<li>API .user.ini: " . ($result_api_user_ini ? '<span class="success">Mise à jour réussie</span>' : '<span class="error">Échec</span>') . "</li>";
        echo "<li>Root .user.ini: " . ($result_root_user_ini ? '<span class="success">Mise à jour réussie</span>' : '<span class="error">Échec</span>') . "</li>";
        echo "<li>phpinfo.php: " . ($result_phpinfo ? '<span class="success">Créé</span>' : '<span class="error">Échec</span>') . "</li>";
        echo "<li>Root phpinfo.php: " . ($result_root_phpinfo ? '<span class="success">Créé</span>' : '<span class="error">Échec</span>') . "</li>";
        echo "</ul>";
        
        echo "<p><strong>Attention:</strong> Les modifications des fichiers de configuration peuvent prendre quelques minutes pour être prises en compte par le serveur.</p>";
        
        echo "<p>Testez si PHP fonctionne maintenant:</p>";
        echo "<ul>";
        echo "<li><a href='/phpinfo.php' target='_blank'>/phpinfo.php</a> - Doit afficher la configuration PHP</li>";
        echo "<li><a href='/api/phpinfo.php' target='_blank'>/api/phpinfo.php</a> - Version API</li>";
        echo "<li><a href='/api/info.php' target='_blank'>/api/info.php</a> - Test d'API JSON</li>";
        echo "</ul>";
        echo "</div>";
    }
    ?>
    
    <div class="section">
        <h2>Actions disponibles</h2>
        <form method="post">
            <p>Cette fonction va tenter de corriger les problèmes d'exécution PHP en:</p>
            <ul>
                <li>Mettant à jour les fichiers .htaccess avec plusieurs méthodes de compatibilité</li>
                <li>Créant ou mettant à jour les fichiers .user.ini</li>
                <li>Créant des fichiers de test phpinfo.php</li>
            </ul>
            
            <p><strong>Attention:</strong> Cette opération modifiera certains fichiers de configuration. Assurez-vous d'avoir des sauvegardes.</p>
            
            <button type="submit" name="fix_htaccess" class="fix-button">Appliquer les corrections forcées</button>
        </form>
    </div>
    
    <div class="section">
        <h2>Recommandations pour Infomaniak</h2>
        <p>Si vous êtes sur un hébergement Infomaniak et que PHP ne s'exécute pas correctement:</p>
        <ol>
            <li>Connectez-vous au <a href="https://manager.infomaniak.com" target="_blank">Manager Infomaniak</a></li>
            <li>Accédez à votre hébergement web</li>
            <li>Allez dans "Configuration > PHP"</li>
            <li>Vérifiez que PHP est activé pour le site et tous les dossiers</li>
            <li>Dans la section "Restrictions par répertoire", assurez-vous que les dossiers <code>/api</code> et <code>/</code> sont configurés pour exécuter PHP</li>
            <li>Vérifiez que la version PHP sélectionnée n'est pas obsolète (utilisez PHP 7.4 ou plus récent)</li>
        </ol>
    </div>
    
    <p><a href="/">Retour à l'accueil</a> | <a href="/api/check-php-execution.php">Diagnostic complet</a></p>
</body>
</html>
