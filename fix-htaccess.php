
<?php
header('Content-Type: text/html; charset=utf-8');

// Fonction pour vérifier et corriger .htaccess
function checkAndFixHtaccess() {
    $htaccess_path = './.htaccess';
    $results = [
        'existing' => file_exists($htaccess_path),
        'readable' => is_readable($htaccess_path),
        'writable' => is_writable($htaccess_path),
        'content' => '',
        'changes' => [],
        'php_rule_added' => false
    ];
    
    // Lire le contenu existant
    if ($results['existing'] && $results['readable']) {
        $results['content'] = file_get_contents($htaccess_path);
    }
    
    // Créer un nouveau .htaccess optimisé
    $new_htaccess = <<<EOT
# Activer le moteur de réécriture
RewriteEngine On

# Forcer l'exécution des fichiers PHP
AddHandler application/x-httpd-php .php
<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

# Configuration de base
Options +FollowSymLinks
Options -MultiViews

# Définir le point d'entrée principal
DirectoryIndex index.html index.php

# Définir les types MIME
AddType application/javascript .js
AddType application/javascript .mjs
AddType text/css .css

# Permettre l'accès direct aux ressources statiques et PHP
RewriteCond %{REQUEST_URI} \.(js|mjs|css|png|jpe?g|gif|svg|ico|webp|woff2?|ttf|eot|map|tsx?|json)$
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# Traitement spécial pour les fichiers PHP
RewriteCond %{REQUEST_FILENAME} -f
RewriteCond %{REQUEST_URI} \.php$
RewriteRule ^ - [L]

# Redirection du dossier /api vers les scripts PHP
RewriteRule ^api/(.*)$ api/$1 [QSA,L]

# Pour les requêtes qui ne correspondent pas à des fichiers réels
RewriteCond %{REQUEST_FILENAME} !-f
# Pour les requêtes qui ne correspondent pas à des répertoires réels
RewriteCond %{REQUEST_FILENAME} !-d
# Et qui ne commencent pas par /api
RewriteCond %{REQUEST_URI} !^/api/
# Rediriger vers index.html
RewriteCond %{ENV:REDIRECT_STATUS} ^$
RewriteRule ^(.*)$ index.html [QSA,L]

# Configuration CORS
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, X-Forced-DB-User, X-User-Prefix"
</IfModule>

# Gestion des erreurs
ErrorDocument 404 /index.html
EOT;
    
    // Tentative d'écriture du nouveau .htaccess
    if ($results['writable'] || !$results['existing']) {
        // Sauvegarde
        if ($results['existing']) {
            copy($htaccess_path, $htaccess_path . '.bak');
            $results['changes'][] = 'Sauvegarde de l\'ancien .htaccess créée';
        }
        
        if (file_put_contents($htaccess_path, $new_htaccess)) {
            $results['changes'][] = 'Nouveau fichier .htaccess optimisé créé';
            $results['php_rule_added'] = true;
        } else {
            $results['changes'][] = 'Échec de l\'écriture du nouveau .htaccess';
        }
    } else {
        $results['changes'][] = '.htaccess n\'est pas modifiable';
    }
    
    return $results;
}

// Créer un .htaccess pour le dossier API
function createApiHtaccess() {
    $api_htaccess_path = './api/.htaccess';
    $api_htaccess = <<<EOT
# Activer le moteur de réécriture
RewriteEngine On

# S'assurer que le serveur exécute les fichiers PHP
AddHandler application/x-httpd-php .php

# Définir le type MIME pour JavaScript et CSS
AddType application/javascript .js
AddType application/javascript .mjs
AddType text/css .css

# Force PHP errors to show
php_flag display_errors on
php_value error_reporting E_ALL

# CORS Headers
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Forced-DB-User, X-User-Prefix"
    
    # Caching headers for API endpoints
    <FilesMatch "\.(php)$">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
        Header set Expires 0
    </FilesMatch>
</IfModule>

# Gérer la requête OPTIONS pour CORS preflight
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Vérifier que les fichiers PHP existent
<Files *.php>
    Order Allow,Deny
    Allow from all
</Files>

# Force PHP execution
<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>
EOT;

    if (file_put_contents($api_htaccess_path, $api_htaccess)) {
        return ['success' => true, 'message' => 'Fichier .htaccess pour le dossier API créé avec succès'];
    } else {
        return ['success' => false, 'message' => 'Impossible de créer le fichier .htaccess pour le dossier API'];
    }
}

// Exécuter les actions
$fix_results = checkAndFixHtaccess();
$api_results = createApiHtaccess();

// Créer un fichier PHP.ini local
$php_ini_content = <<<EOT
; Configuration PHP locale
display_errors = On
error_reporting = E_ALL
default_charset = "UTF-8"
date.timezone = "Europe/Zurich"

; Limites de téléchargement et de mémoire
post_max_size = 32M
upload_max_filesize = 16M
memory_limit = 256M
max_execution_time = 300

; Assurer que PHP fonctionne correctement
engine = On
EOT;

$php_ini_result = file_put_contents('./php.ini', $php_ini_content);
$api_php_ini_result = file_put_contents('./api/.user.ini', $php_ini_content);
?>

<!DOCTYPE html>
<html>
<head>
    <title>Correction des Configurations</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .button { 
            display: inline-block; 
            background: #4CAF50; 
            color: white; 
            padding: 10px 15px; 
            text-decoration: none; 
            border-radius: 4px; 
            margin-top: 10px; 
        }
    </style>
</head>
<body>
    <h1>Correction des Configurations</h1>
    
    <div class="section">
        <h2>Correction du fichier .htaccess principal</h2>
        <p>État du fichier:</p>
        <ul>
            <li>Existe: <span class="<?php echo $fix_results['existing'] ? 'success' : 'error'; ?>"><?php echo $fix_results['existing'] ? 'Oui' : 'Non'; ?></span></li>
            <?php if ($fix_results['existing']): ?>
                <li>Lisible: <span class="<?php echo $fix_results['readable'] ? 'success' : 'error'; ?>"><?php echo $fix_results['readable'] ? 'Oui' : 'Non'; ?></span></li>
                <li>Modifiable: <span class="<?php echo $fix_results['writable'] ? 'success' : 'error'; ?>"><?php echo $fix_results['writable'] ? 'Oui' : 'Non'; ?></span></li>
            <?php endif; ?>
        </ul>
        
        <h3>Modifications:</h3>
        <ul>
            <?php foreach ($fix_results['changes'] as $change): ?>
                <li><?php echo htmlspecialchars($change); ?></li>
            <?php endforeach; ?>
        </ul>
    </div>
    
    <div class="section">
        <h2>Correction du fichier .htaccess du dossier API</h2>
        <p class="<?php echo $api_results['success'] ? 'success' : 'error'; ?>">
            <?php echo htmlspecialchars($api_results['message']); ?>
        </p>
    </div>
    
    <div class="section">
        <h2>Création des fichiers PHP.ini</h2>
        <p>Fichier PHP.ini principal: <span class="<?php echo $php_ini_result ? 'success' : 'error'; ?>"><?php echo $php_ini_result ? 'Créé avec succès' : 'Échec de la création'; ?></span></p>
        <p>Fichier .user.ini du dossier API: <span class="<?php echo $api_php_ini_result ? 'success' : 'error'; ?>"><?php echo $api_php_ini_result ? 'Créé avec succès' : 'Échec de la création'; ?></span></p>
    </div>
    
    <div class="section">
        <h2>Étapes suivantes</h2>
        <p>Pour vérifier que PHP fonctionne correctement, suivez ces étapes:</p>
        <ol>
            <li>Cliquez sur <a href="php-fix.php">ce lien</a> pour exécuter le diagnostic PHP</li>
            <li>Vérifiez que le fichier PHP s'exécute et n'affiche pas de code source PHP</li>
            <li>Si vous voyez du code PHP brut, contactez votre hébergeur pour vous assurer que PHP est correctement configuré</li>
            <li>Vérifiez également le dossier API en cliquant sur <a href="api/fix-php.php">ce lien</a></li>
        </ol>
        
        <p><a href="api/test.php" class="button">Tester l'API</a></p>
    </div>
    
    <div class="section">
        <h2>Résolution avancée des problèmes</h2>
        <p>Si les problèmes persistent:</p>
        <ol>
            <li>Assurez-vous que le module PHP est activé sur votre serveur</li>
            <li>Vérifiez que les fichiers .htaccess sont pris en compte (AllowOverride doit être activé)</li>
            <li>Redémarrez le serveur web si vous avez accès à cette fonctionnalité</li>
            <li>Contactez votre hébergeur pour obtenir de l'aide sur la configuration PHP</li>
        </ol>
    </div>
    
    <p><a href="/">Retour à l'application</a></p>
</body>
</html>
