
<?php
// Script pour générer les fichiers de configuration PHP corrects

// En-têtes
header("Content-Type: text/html; charset=UTF-8");

// Fonction pour écrire un fichier avec vérification
function writeConfigFile($path, $content) {
    $result = @file_put_contents($path, $content);
    return [
        'success' => $result !== false,
        'path' => $path,
        'bytes' => $result,
        'exists' => file_exists($path)
    ];
}

// Fonction pour vérifier les permissions
function checkPermissions($path) {
    return [
        'exists' => file_exists($path),
        'readable' => is_readable($path),
        'writable' => is_writable($path),
        'permissions' => file_exists($path) ? substr(sprintf('%o', fileperms($path)), -4) : 'n/a'
    ];
}

// Contenu des fichiers de configuration
$htaccess_api = <<<EOT
# API .htaccess - Ensures PHP execution in the API directory

# Enable URL rewriting
RewriteEngine On

# Force PHP for all .php files - MULTIPLE METHODS FOR COMPATIBILITY
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

# Ensure PHP is activated
<IfModule mod_php.c>
    php_flag engine on
    php_value display_errors on
    php_value error_reporting E_ALL
</IfModule>

# Support for FastCGI
<IfModule mod_fcgid.c>
    <FilesMatch "\.php$">
        SetHandler fcgid-script
    </FilesMatch>
</IfModule>

# Support for FPM
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
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    
    # Prevent caching
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</IfModule>

# Allow direct access to PHP files
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule \.(php)$ - [L]

# Route all other requests to index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
EOT;

$htaccess_root = <<<EOT
# Main .htaccess - Forces PHP execution and handles routing

# Enable rewrite engine
RewriteEngine On

# Set PHP handler explicitly - THIS IS CRITICAL!
AddHandler application/x-httpd-php .php
AddType application/x-httpd-php .php

# Force PHP for all .php files - Multiple methods for different server configurations
<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

# Force PHP interpreter for all PHP files
<FilesMatch "\.php$">
    <IfModule mod_mime.c>
        ForceType application/x-httpd-php
    </IfModule>
</FilesMatch>

# FastCGI configuration if available
<IfModule mod_fastcgi.c>
    <FilesMatch "\.php$">
        SetHandler php-fcgi
    </FilesMatch>
</IfModule>

# Enable PHP engine explicitly
<IfModule mod_php.c>
    php_flag engine on
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# Set correct MIME types
AddType application/javascript .js
AddType application/javascript .mjs
AddType text/css .css
AddType application/json .json
AddType image/svg+xml .svg

# API requests should not be redirected
RewriteRule ^api/ - [L]

# PHP files should be processed directly
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule \.(php)$ - [L]

# For service workers
<Files "sync-service-worker.js">
    Header set Content-Type "application/javascript"
    Header set Service-Worker-Allowed "/"
</Files>

# Redirect all other requests to index.html for client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [QSA,L]
EOT;

$user_ini_api = <<<EOT
; API .user.ini - PHP configuration settings
display_errors = On
error_reporting = E_ALL
log_errors = On
error_log = api/php_errors.log

; Force PHP engine activation
engine = On

; Configuration minimale
allow_url_fopen = On
upload_max_filesize = 10M
post_max_size = 10M
memory_limit = 256M

; Type MIME
default_mimetype = "text/html"
default_charset = "UTF-8"
EOT;

$user_ini_root = <<<EOT
; Root .user.ini - PHP configuration settings
display_errors = On
error_reporting = E_ALL
log_errors = On
error_log = php_errors.log

; Force PHP engine activation
engine = On

; Configuration minimale
allow_url_fopen = On
upload_max_filesize = 10M
post_max_size = 10M
memory_limit = 256M

; Type MIME
default_mimetype = "text/html"
default_charset = "UTF-8"
EOT;

$phpinfo_content = <<<EOT
<?php
// Fichier de diagnostic affichant les informations complètes de configuration PHP
// Utile pour vérifier que PHP fonctionne et voir sa configuration

// En-têtes pour éviter la mise en cache
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Afficher toutes les informations PHP (configuration, modules, etc.)
phpinfo();
?>
EOT;

$php_test_content = <<<EOT
<?php
// Simple test file to verify PHP execution
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

// Extra debug information
\$debug = [
    'php_version' => phpversion(),
    'server_software' => \$_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'document_root' => \$_SERVER['DOCUMENT_ROOT'],
    'script_filename' => \$_SERVER['SCRIPT_FILENAME'],
    'hostname' => gethostname(),
    'current_dir' => getcwd(),
    'timestamp' => date('Y-m-d H:i:s')
];

echo json_encode([
    'success' => true,
    'message' => 'PHP is executing correctly',
    'debug' => \$debug
], JSON_PRETTY_PRINT);
?>
EOT;

// Action de génération des fichiers
$results = [];
$was_action_taken = false;

if (isset($_POST['generate_files'])) {
    $was_action_taken = true;
    
    // Écrire les fichiers htaccess
    $results['htaccess_api'] = writeConfigFile('../api/.htaccess', $htaccess_api);
    $results['htaccess_root'] = writeConfigFile('../.htaccess', $htaccess_root);
    
    // Écrire les fichiers user.ini
    $results['user_ini_api'] = writeConfigFile('../api/.user.ini', $user_ini_api);
    $results['user_ini_root'] = writeConfigFile('../.user.ini', $user_ini_root);
    
    // Écrire les fichiers de test
    $results['phpinfo_api'] = writeConfigFile('../api/phpinfo.php', $phpinfo_content);
    $results['phpinfo_root'] = writeConfigFile('../phpinfo.php', $phpinfo_content);
    $results['test_php'] = writeConfigFile('../api/test.php', $php_test_content);
}

// Diagnostiquer les permissions des dossiers
$dir_permissions = [
    'api_dir' => checkPermissions('../api'),
    'root_dir' => checkPermissions('..'),
    'assets_dir' => checkPermissions('../assets')
];

// Vérifier l'existence des fichiers importants
$file_checks = [
    'htaccess_api' => checkPermissions('../api/.htaccess'),
    'htaccess_root' => checkPermissions('../.htaccess'),
    'user_ini_api' => checkPermissions('../api/.user.ini'),
    'user_ini_root' => checkPermissions('../.user.ini')
];

?>
<!DOCTYPE html>
<html>
<head>
    <title>Configuration PHP Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; max-width: 1000px; margin: 0 auto; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 4px; }
        .info-block { background: #e6f7ff; padding: 10px; border-left: 4px solid #1890ff; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Configuration PHP pour Infomaniak</h1>
    
    <?php if ($was_action_taken): ?>
    <div class="section">
        <h2>Résultats de la génération des fichiers</h2>
        <table>
            <tr>
                <th>Fichier</th>
                <th>Résultat</th>
                <th>Taille</th>
                <th>Existe</th>
            </tr>
            <?php foreach ($results as $name => $result): ?>
            <tr>
                <td><?php echo $result['path']; ?></td>
                <td><?php echo $result['success'] ? '<span class="success">Réussi</span>' : '<span class="error">Échec</span>'; ?></td>
                <td><?php echo $result['bytes']; ?> octets</td>
                <td><?php echo $result['exists'] ? '<span class="success">Oui</span>' : '<span class="error">Non</span>'; ?></td>
            </tr>
            <?php endforeach; ?>
        </table>
        
        <h3>Que faire maintenant?</h3>
        <ol>
            <li>Vérifier que les fichiers ont été correctement générés</li>
            <li>Tester l'exécution PHP avec les liens ci-dessous</li>
            <li>Si ça ne fonctionne toujours pas, vérifier la configuration dans le Manager Infomaniak</li>
        </ol>
        
        <p>Testez si PHP fonctionne maintenant:</p>
        <ul>
            <li><a href="/phpinfo.php" target="_blank">/phpinfo.php</a> - Doit afficher la configuration PHP</li>
            <li><a href="/api/phpinfo.php" target="_blank">/api/phpinfo.php</a> - Version dans le dossier API</li>
            <li><a href="/api/test.php" target="_blank">/api/test.php</a> - Test JSON simple</li>
        </ul>
    </div>
    <?php endif; ?>
    
    <div class="section">
        <h2>Actions disponibles</h2>
        
        <div class="info-block">
            <p><strong>Important:</strong> Ces actions vont générer ou remplacer des fichiers de configuration critiques pour le bon fonctionnement de PHP:</p>
            <ul>
                <li>Fichiers .htaccess (racine et dossier API)</li>
                <li>Fichiers .user.ini (racine et dossier API)</li>
                <li>Fichiers de test PHP</li>
            </ul>
            <p>Ces fichiers sont essentiels pour assurer une exécution correcte de PHP sur l'hébergement Infomaniak.</p>
        </div>
        
        <form method="post">
            <p>Cliquez sur le bouton ci-dessous pour générer tous les fichiers de configuration nécessaires:</p>
            <button type="submit" name="generate_files" class="fix-button">Générer les fichiers de configuration</button>
        </form>
    </div>
    
    <div class="section">
        <h2>Diagnostics du système</h2>
        
        <h3>Permissions des répertoires:</h3>
        <table>
            <tr>
                <th>Répertoire</th>
                <th>Existe</th>
                <th>Lecture</th>
                <th>Écriture</th>
                <th>Permissions</th>
            </tr>
            <?php foreach ($dir_permissions as $name => $perm): ?>
            <tr>
                <td><?php echo $name; ?></td>
                <td><?php echo $perm['exists'] ? '<span class="success">Oui</span>' : '<span class="error">Non</span>'; ?></td>
                <td><?php echo $perm['readable'] ? '<span class="success">Oui</span>' : '<span class="error">Non</span>'; ?></td>
                <td><?php echo $perm['writable'] ? '<span class="success">Oui</span>' : '<span class="error">Non</span>'; ?></td>
                <td><?php echo $perm['permissions']; ?></td>
            </tr>
            <?php endforeach; ?>
        </table>
        
        <h3>Vérification des fichiers importants:</h3>
        <table>
            <tr>
                <th>Fichier</th>
                <th>Existe</th>
                <th>Lecture</th>
                <th>Écriture</th>
                <th>Permissions</th>
            </tr>
            <?php foreach ($file_checks as $name => $perm): ?>
            <tr>
                <td><?php echo $name; ?></td>
                <td><?php echo $perm['exists'] ? '<span class="success">Oui</span>' : '<span class="error">Non</span>'; ?></td>
                <td><?php echo $perm['readable'] ? '<span class="success">Oui</span>' : '<span class="error">Non</span>'; ?></td>
                <td><?php echo $perm['writable'] ? '<span class="success">Oui</span>' : '<span class="error">Non</span>'; ?></td>
                <td><?php echo $perm['permissions']; ?></td>
            </tr>
            <?php endforeach; ?>
        </table>
    </div>
    
    <div class="section">
        <h2>Configuration d'Infomaniak</h2>
        
        <div class="info-block">
            <p><strong>ATTENTION:</strong> Infomaniak nécessite également une configuration via le Manager en plus des fichiers .htaccess et .user.ini.</p>
        </div>
        
        <h3>Étapes à suivre dans le Manager Infomaniak:</h3>
        <ol>
            <li>Connectez-vous au <a href="https://manager.infomaniak.com" target="_blank">Manager Infomaniak</a></li>
            <li>Accédez à votre hébergement web</li>
            <li>Allez dans "Configuration > PHP"</li>
            <li>Assurez-vous que PHP est activé pour le site</li>
            <li>Dans la section "Restrictions par répertoire":
                <ul>
                    <li>Vérifiez que le dossier <strong>/api</strong> est configuré pour exécuter PHP</li>
                    <li>Si ce n'est pas le cas, ajoutez-le avec les options "Exécuter les scripts PHP" activée</li>
                </ul>
            </li>
            <li>Sélectionnez une version PHP récente (PHP 7.4 ou plus récente)</li>
            <li>Enregistrez les modifications et attendez quelques minutes pour qu'elles soient appliquées</li>
        </ol>
        
        <div class="info-block">
            <p><strong>Note:</strong> Il peut être nécessaire de contacter le support Infomaniak si les problèmes persistent après avoir suivi ces étapes.</p>
        </div>
    </div>
    
    <div class="section">
        <h2>Contenu des fichiers de configuration</h2>
        
        <h3>.htaccess pour le dossier API:</h3>
        <pre><?php echo htmlspecialchars($htaccess_api); ?></pre>
        
        <h3>.htaccess pour la racine:</h3>
        <pre><?php echo htmlspecialchars($htaccess_root); ?></pre>
        
        <h3>.user.ini pour le dossier API:</h3>
        <pre><?php echo htmlspecialchars($user_ini_api); ?></pre>
        
        <h3>.user.ini pour la racine:</h3>
        <pre><?php echo htmlspecialchars($user_ini_root); ?></pre>
    </div>
    
    <p><a href="/">Retour à l'accueil</a> | <a href="/api/check-php-execution.php">Diagnostic complet</a></p>
</body>
</html>
