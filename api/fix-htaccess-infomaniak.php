
<?php
// Script pour créer un .htaccess adapté à Infomaniak
header('Content-Type: text/html; charset=UTF-8');

// Chemins spécifiques
$client_path = '/home/clients/df8dceff557ccc0605d45e1581aa661b';
$site_path = $client_path . '/sites/qualiopi.ch';
$api_path = $site_path . '/api';

// Contenu du .htaccess principal
$main_htaccess = <<<EOT
# Activer le moteur de réécriture
RewriteEngine On

# Configuration spécifique pour Infomaniak
Options -MultiViews
Options +FollowSymLinks

# Activer l'exécution des fichiers PHP
AddHandler application/x-httpd-php .php
AddHandler php8-fcgi .php
AddType application/x-httpd-php .php

# Forcer PHP à être traité
<FilesMatch "\.php\$">
    SetHandler application/x-httpd-php
</FilesMatch>

# Définir le point d'entrée principal
DirectoryIndex index.html index.php

# Définir les types MIME corrects
AddType application/javascript .js
AddType application/javascript .mjs
AddType text/css .css
AddType application/json .json

# Rediriger les erreurs PHP vers une page personnalisée
ErrorDocument 500 /api/error-diagnostic.php

# Permettre l'accès aux assets
<FilesMatch "\.(js|mjs|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map|tsx?)\$">
    Order Allow,Deny
    Allow from all
</FilesMatch>

# Règle spécifique pour rediriger /api vers le dossier api/index.php
RewriteRule ^api\$ api/index.php [L]

# Règle pour traiter les requêtes d'API avec des sous-chemins
RewriteRule ^api/([^/]+)\$ api/\$1.php [QSA,L]

# Règle pour autres requêtes API
RewriteRule ^api/(.*)\$ api/\$1 [QSA,L]

# Permettre l'accès direct aux assets dans leur dossier
RewriteCond %{REQUEST_URI} ^/assets/
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# Rediriger toutes les autres requêtes vers index.html pour React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule ^(.*)\$ index.html [QSA,L]

# Configuration de sécurité et CORS
<IfModule mod_headers.c>
    # Headers pour les assets statiques
    <FilesMatch "\.(js|mjs|css|json)\$">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
        Header set Expires "0"
        Header set Access-Control-Allow-Origin "*"
    </FilesMatch>
</IfModule>
EOT;

// Contenu du .htaccess API
$api_htaccess = <<<EOT
# Forcer PHP à s'exécuter dans ce répertoire
AddHandler application/x-httpd-php .php
AddHandler php8-fcgi .php

# Forcer explicitement PHP pour tous les fichiers .php
<FilesMatch "\.php\$">
    SetHandler application/x-httpd-php
    SetHandler php8-fcgi
</FilesMatch>

# Activer la réécriture d'URL
RewriteEngine On

# Gérer les requêtes OPTIONS pour CORS
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)\$ \$1 [R=200,L]

# Permettre l'accès direct aux fichiers PHP spécifiques
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule \.(php)\$ - [L]

# Configuration des en-têtes pour tous les fichiers PHP
<Files *.php>
    Order Allow,Deny
    Allow from all
    
    # En-têtes CORS pour les API
    <IfModule mod_headers.c>
        Header set Access-Control-Allow-Origin "*"
        Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
        Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
        
        # Désactiver le cache pour les réponses API
        Header set Cache-Control "no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
        Header set Expires 0
    </IfModule>
</Files>
EOT;

?>
<!DOCTYPE html>
<html>
<head>
    <title>Création de .htaccess pour Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .box { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Création de .htaccess pour Infomaniak</h1>
    
    <div class="box">
        <h2>Chemins détectés</h2>
        <p>Chemin client: <?php echo $client_path; ?></p>
        <p>Chemin site: <?php echo $site_path; ?></p>
        <p>Chemin API: <?php echo $api_path; ?></p>
    </div>
    
    <?php
    // Tentative de création des fichiers .htaccess
    $main_created = false;
    $api_created = false;
    
    try {
        // Essayer de créer le .htaccess principal
        $main_file = $site_path . '/.htaccess-new';
        $main_created = file_put_contents($main_file, $main_htaccess);
        
        // Essayer de créer le .htaccess pour l'API
        $api_file = $api_path . '/.htaccess-new';
        $api_created = file_put_contents($api_file, $api_htaccess);
    } catch (Exception $e) {
        echo "<div class='box'><p class='error'>Erreur: " . $e->getMessage() . "</p></div>";
    }
    ?>
    
    <div class="box">
        <h2>Résultats</h2>
        <p>Création du .htaccess principal: 
            <?php echo $main_created ? "<span class='success'>Succès!</span>" : "<span class='error'>Échec</span>"; ?>
            <?php echo $main_created ? " (Fichier créé: $main_file)" : ""; ?>
        </p>
        
        <p>Création du .htaccess API: 
            <?php echo $api_created ? "<span class='success'>Succès!</span>" : "<span class='error'>Échec</span>"; ?>
            <?php echo $api_created ? " (Fichier créé: $api_file)" : ""; ?>
        </p>
    </div>
    
    <div class="box">
        <h2>Contenu du .htaccess principal</h2>
        <pre><?php echo htmlspecialchars($main_htaccess); ?></pre>
    </div>
    
    <div class="box">
        <h2>Contenu du .htaccess API</h2>
        <pre><?php echo htmlspecialchars($api_htaccess); ?></pre>
    </div>
    
    <div class="box">
        <h2>Étapes suivantes</h2>
        <ol>
            <li>Connectez-vous à votre serveur Infomaniak via SSH</li>
            <li>Si les fichiers ont été créés avec succès, renommez-les:
                <pre>mv <?php echo $site_path; ?>/.htaccess-new <?php echo $site_path; ?>/.htaccess
mv <?php echo $api_path; ?>/.htaccess-new <?php echo $api_path; ?>/.htaccess</pre>
            </li>
            <li>Si les fichiers n'ont pas pu être créés, utilisez les commandes SSH suivantes:
                <pre>cat > <?php echo $site_path; ?>/.htaccess << 'EOF'
<?php echo $main_htaccess; ?>
EOF

cat > <?php echo $api_path; ?>/.htaccess << 'EOF'
<?php echo $api_htaccess; ?>
EOF</pre>
            </li>
            <li>Vérifiez que PHP est activé dans le panneau d'administration Infomaniak pour votre site</li>
        </ol>
    </div>
</body>
</html>
