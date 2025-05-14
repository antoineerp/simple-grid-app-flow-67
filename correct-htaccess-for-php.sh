
#!/bin/bash
# Script pour corriger la configuration .htaccess pour l'exécution PHP sur Infomaniak
# Exécutez avec: bash correct-htaccess-for-php.sh

echo "=== CORRECTION DES FICHIERS DE CONFIGURATION POUR PHP ==="
echo "Date d'exécution: $(date)"
echo

# Chemin vers les fichiers
HTACCESS=".htaccess"
USER_INI=".user.ini"
API_HTACCESS="api/.htaccess"

# Création ou mise à jour du fichier .htaccess principal
echo "Mise à jour du fichier .htaccess principal..."
cat > "$HTACCESS" << 'EOT'
# Activer le moteur de réécriture
RewriteEngine On

# Force l'interprétation des fichiers .php par le moteur PHP
AddHandler application/x-httpd-php .php
<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

# Configuration des types MIME
AddType text/css .css
AddType application/javascript .js
AddType application/javascript .mjs

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

# Rediriger toutes les requêtes vers index.html sauf les fichiers physiques, dossiers ou API
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(?!api/)(.*)$ /index.html [L]

# Désactiver l'indexation des répertoires
Options -Indexes

# Protection contre le MIME-sniffing
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
</IfModule>

# Force PHP pour tous les fichiers .php
<Files *.php>
    SetHandler application/x-httpd-php
</Files>
EOT

# Création ou mise à jour du fichier .user.ini
echo "Mise à jour du fichier .user.ini..."
cat > "$USER_INI" << 'EOT'
; Configuration PHP pour Infomaniak
display_errors = On
log_errors = On
error_log = /tmp/php-errors.log
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
max_execution_time = 120
memory_limit = 256M
upload_max_filesize = 64M
post_max_size = 64M
default_charset = "UTF-8"
EOT

# Création du répertoire api s'il n'existe pas
if [ ! -d "api" ]; then
    mkdir -p api
    echo "Répertoire api créé."
fi

# Création ou mise à jour du fichier api/.htaccess
echo "Mise à jour du fichier api/.htaccess..."
cat > "$API_HTACCESS" << 'EOT'
# Configuration pour le dossier API sur Infomaniak
AddHandler application/x-httpd-php .php

# Activer la réécriture d'URL
RewriteEngine On

# Définir les types MIME corrects
AddType application/javascript .js
AddType application/json .json
AddType text/css .css

# Gérer les requêtes OPTIONS pour CORS
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Force PHP pour tous les fichiers .php
<Files *.php>
    SetHandler application/x-httpd-php
</Files>

# Configuration CORS et types MIME
<IfModule mod_headers.c>
    # Force le bon type MIME pour les JavaScript
    <FilesMatch "\.js$">
        Header set Content-Type "application/javascript"
        Header set X-Content-Type-Options "nosniff"
    </FilesMatch>
    
    # Configuration CORS
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    
    # Éviter la mise en cache des réponses API
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</IfModule>

# Rediriger toutes les requêtes vers l'index.php sauf pour les fichiers existants
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
EOT

# Définir les permissions correctes pour les fichiers
chmod 644 "$HTACCESS"
chmod 644 "$USER_INI"
chmod 644 "$API_HTACCESS"

echo
echo "=== FICHIERS DE CONFIGURATION MIS À JOUR ==="
echo "Fichier .htaccess: OK"
echo "Fichier .user.ini: OK"
echo "Fichier api/.htaccess: OK"
echo
echo "Pensez à contacter le support Infomaniak si l'exécution PHP ne fonctionne toujours pas."
echo "Vous pouvez utiliser le script ssh-db-test.php pour tester la connexion à la base de données en SSH."
