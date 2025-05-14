
#!/bin/bash
# Script pour créer les dossiers nécessaires sur Infomaniak

echo "Création des dossiers nécessaires pour le projet..."

# Création des dossiers principaux et sous-dossiers
mkdir -p api/config
mkdir -p api/controllers
mkdir -p api/models
mkdir -p api/middleware
mkdir -p api/operations
mkdir -p api/utils
mkdir -p assets
mkdir -p public/lovable-uploads
mkdir -p .github/workflows

# Définir les permissions appropriées
chmod 755 api
chmod 755 api/config
chmod 755 api/controllers
chmod 755 api/models
chmod 755 api/middleware
chmod 755 api/operations
chmod 755 api/utils
chmod 755 assets
chmod 755 public
chmod 755 public/lovable-uploads
chmod 755 .github
chmod 755 .github/workflows

echo "✅ Dossiers créés avec succès"
echo "Structure actuelle:"
find . -type d -maxdepth 2 | sort

# Vérification du fichier .htaccess dans api
if [ ! -f "api/.htaccess" ]; then
    echo "⚠️ Le fichier api/.htaccess est manquant, création..."
    
    cat > api/.htaccess <<EOF
# Activer la réécriture d'URL
RewriteEngine On

# Définir les types MIME corrects
AddType application/javascript .js
AddType application/javascript .mjs
AddType application/javascript .es.js
AddType text/css .css
AddType application/json .json

# Gérer les requêtes OPTIONS pour CORS
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Configuration CORS et types MIME
<IfModule mod_headers.c>
    # Force le bon type MIME pour les JavaScript modules
    <FilesMatch "\.(m?js|es\.js)$">
        Header set Content-Type "application/javascript"
        Header set X-Content-Type-Options "nosniff"
    </FilesMatch>
    
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    
    # Eviter la mise en cache
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</IfModule>

# Permettre l'accès direct aux fichiers PHP spécifiques
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule \.(php)$ - [L]

# Rediriger toutes les requêtes vers l'index.php sauf pour les fichiers existants
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Forcer PHP à utiliser le bon encodage
<IfModule mod_php.c>
    php_value default_charset "UTF-8"
    php_flag display_errors off
    php_value error_log "php_errors.log"
    php_flag log_errors on
    php_value upload_max_filesize "16M"
    php_value post_max_size "16M"
    php_value memory_limit "128M"
    php_value max_execution_time 300
</IfModule>

# Définition d'une page d'erreur JSON personnalisée pour les erreurs
ErrorDocument 500 '{"status":"error","message":"Erreur interne du serveur","code":500}'
ErrorDocument 404 '{"status":"error","message":"Ressource non trouvée","code":404}'
ErrorDocument 403 '{"status":"error","message":"Accès interdit","code":403}'
EOF
    
    echo "✅ Fichier api/.htaccess créé"
fi

echo "Vérification terminée!"
