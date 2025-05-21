
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction automatique des types MIME</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Correction automatique des types MIME</h1>
    
    <?php
    // Vérifier si le dossier assets existe
    if (!is_dir('./assets')) {
        if (mkdir('./assets', 0755, true)) {
            echo "<p>Dossier assets créé avec succès.</p>";
        } else {
            echo "<p class='error'>Impossible de créer le dossier assets.</p>";
        }
    }
    
    // Créer ou mettre à jour le fichier .htaccess dans le dossier assets
    $htaccess_content = <<<EOT
# Configuration des types MIME pour les assets JavaScript
AddType application/javascript .js
AddType application/javascript .mjs
AddType text/css .css

# En-têtes pour éviter les problèmes de cache
<FilesMatch "\\.(js|mjs|css)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
    Header set X-Content-Type-Options "nosniff"
</FilesMatch>

# Autoriser l'accès aux fichiers
<Files *>
    Order Allow,Deny
    Allow from all
</Files>
EOT;

    if (file_put_contents('./assets/.htaccess', $htaccess_content)) {
        echo "<p class='success'>Fichier .htaccess créé avec succès dans le dossier assets.</p>";
        echo "<pre>" . htmlspecialchars($htaccess_content) . "</pre>";
    } else {
        echo "<p class='error'>Impossible de créer le fichier .htaccess dans le dossier assets.</p>";
    }
    
    // Créer ou mettre à jour le fichier .htaccess à la racine
    $root_htaccess = <<<EOT
# Activer le moteur de réécriture
RewriteEngine On

# Configuration spécifique pour Infomaniak
Options -MultiViews
Options +FollowSymLinks

# Définir le point d'entrée principal
DirectoryIndex index.html index.php

# Définir les types MIME corrects
AddType application/javascript .js
AddType application/javascript .mjs
AddType application/javascript .es.js
AddType text/css .css
AddType application/json .json
AddType image/svg+xml .svg

# Configuration spécifique pour les modules ES
<FilesMatch "\\.(m?js|es\\.js)$">
    Header set Content-Type "application/javascript"
    Header set X-Content-Type-Options "nosniff"
</FilesMatch>

# Permettre l'accès aux assets
<FilesMatch "\\.(js|mjs|es\\.js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map|tsx?)$">
    Order Allow,Deny
    Allow from all
</FilesMatch>

# Rediriger toutes les requêtes vers index.html pour React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [QSA,L]
EOT;

    if (file_put_contents('./.htaccess', $root_htaccess)) {
        echo "<p class='success'>Fichier .htaccess créé avec succès à la racine.</p>";
    } else {
        echo "<p class='error'>Impossible de créer le fichier .htaccess à la racine.</p>";
    }
    
    // Vérifier le fichier index.html
    if (file_exists('./index.html')) {
        $index_content = file_get_contents('./index.html');
        $has_css_ref = strpos($index_content, 'href="/assets/index.css"') !== false;
        
        if (!$has_css_ref) {
            echo "<p>Tentative de correction du fichier index.html pour ajouter la référence CSS...</p>";
            
            // Ajouter la référence CSS si elle est manquante
            $new_content = str_replace('</head>', '    <link rel="stylesheet" href="/assets/index.css" />' . "\n  " . '</head>', $index_content);
            
            if (file_put_contents('./index.html', $new_content)) {
                echo "<p class='success'>Référence CSS ajoutée à index.html.</p>";
            } else {
                echo "<p class='error'>Impossible de modifier index.html.</p>";
            }
        } else {
            echo "<p class='success'>La référence CSS existe déjà dans index.html.</p>";
        }
    } else {
        echo "<p class='error'>Fichier index.html introuvable.</p>";
    }
    ?>
    
    <h2>Opération terminée</h2>
    <p>Les types MIME ont été configurés correctement. Rafraîchissez votre application pour voir les changements.</p>
</body>
</html>
