
#!/bin/bash
# Script complet de diagnostic et correction pour PHP sur Infomaniak
# Exécutez avec: bash infomaniak-php-fix.sh

echo "================================================================"
echo "        DIAGNOSTIC ET CORRECTION PHP POUR INFOMANIAK"
echo "================================================================"
echo "Date d'exécution: $(date)"
echo "Répertoire: $(pwd)"
echo

# Définir les chemins des fichiers de configuration
HTACCESS=".htaccess"
USER_INI=".user.ini"
API_HTACCESS="api/.htaccess"
API_DIR="api"
TEST_PHP="test-php-execution.php"
PHPINFO="phpinfo.php"
API_PHPINFO="api/phpinfo.php"

# Fonction pour créer un séparateur visuel
separator() {
  echo
  echo "----------------------------------------------------------------"
  echo "$1"
  echo "----------------------------------------------------------------"
}

# Vérifier si nous sommes sur Infomaniak
IS_INFOMANIAK=false
if [[ "$(pwd)" == *"/home/clients/"* && "$(pwd)" == *"/sites/"* ]]; then
  IS_INFOMANIAK=true
  echo "✓ Environnement Infomaniak détecté"
else
  echo "⚠️ Environnement Infomaniak non détecté, certaines fonctionnalités pourraient ne pas fonctionner"
fi

# ÉTAPE 1: Diagnostic préliminaire
separator "1. DIAGNOSTIC PRÉLIMINAIRE"

echo "Vérification des fichiers essentiels:"
for file in $HTACCESS $USER_INI $API_HTACCESS; do
  if [ -f "$file" ]; then
    echo "✓ $file existe ($(wc -l < "$file") lignes)"
  else
    echo "✗ $file manquant"
  fi
done

echo
echo "Version PHP: $(php -v | head -n 1)"
echo "Mode d'exécution PHP: $(php -r 'echo php_sapi_name();')"

# ÉTAPE 2: Correction des fichiers de configuration
separator "2. MISE À JOUR DES FICHIERS DE CONFIGURATION"

echo "Mise à jour du fichier .htaccess principal..."
cat > "$HTACCESS" << 'EOT'
# Activer le moteur de réécriture
RewriteEngine On

# Forcer l'interprétation des fichiers .php par le moteur PHP
AddHandler application/x-httpd-php .php
AddType application/x-httpd-php .php
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
EOT
echo "✓ .htaccess mis à jour"

echo "Mise à jour du fichier .user.ini..."
cat > "$USER_INI" << 'EOT'
; Configuration PHP pour Infomaniak
display_errors = On
log_errors = On
error_log = /tmp/php_errors.log
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
max_execution_time = 120
memory_limit = 256M
upload_max_filesize = 64M
post_max_size = 64M
default_charset = "UTF-8"
EOT
echo "✓ .user.ini mis à jour"

# Création du répertoire api s'il n'existe pas
if [ ! -d "$API_DIR" ]; then
  mkdir -p "$API_DIR"
  echo "✓ Répertoire api créé"
fi

echo "Mise à jour du fichier api/.htaccess..."
cat > "$API_HTACCESS" << 'EOT'
# Configuration pour le dossier API sur Infomaniak

# Forcer PHP pour tous les fichiers .php
AddHandler application/x-httpd-php .php
AddType application/x-httpd-php .php

# Activer la réécriture d'URL
RewriteEngine On

# Définir les types MIME corrects
AddType application/javascript .js
AddType application/json .json
AddType text/css .css

# Gérer les requêtes OPTIONS pour CORS
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

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

# Forcer PHP à utiliser le bon encodage
<IfModule mod_php.c>
    php_value default_charset "UTF-8"
</IfModule>
EOT
echo "✓ api/.htaccess mis à jour"

# ÉTAPE 3: Création des fichiers de test
separator "3. CRÉATION DES FICHIERS DE TEST PHP"

echo "Création de phpinfo.php à la racine..."
cat > "$PHPINFO" << 'EOT'
<?php
// Afficher toutes les informations PHP
header('Content-Type: text/html; charset=UTF-8');
phpinfo();
?>
EOT
chmod 644 "$PHPINFO"
echo "✓ phpinfo.php créé"

echo "Création de phpinfo.php dans api/..."
cat > "$API_PHPINFO" << 'EOT'
<?php
// Afficher toutes les informations PHP pour le dossier API
header('Content-Type: text/html; charset=UTF-8');
phpinfo();
?>
EOT
chmod 644 "$API_PHPINFO"
echo "✓ api/phpinfo.php créé"

echo "Création du fichier de test PHP..."
cat > "$TEST_PHP" << 'EOT'
<?php
header("Content-Type: text/html; charset=utf-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test d'exécution PHP</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { background: #f4f4f4; padding: 15px; border-radius: 5px; }
        .api-test { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px; }
    </style>
</head>
<body>
    <h1>Test d'exécution PHP</h1>
    
    <div class="success">
        <p>PHP fonctionne correctement sur ce serveur!</p>
        <p>Date et heure: <?php echo date("Y-m-d H:i:s"); ?></p>
    </div>
    
    <div class="info">
        <h2>Informations sur l'environnement</h2>
        <p>Version PHP: <?php echo phpversion(); ?></p>
        <p>SAPI: <?php echo php_sapi_name(); ?></p>
        <p>Serveur: <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'; ?></p>
        <p>Document Root: <?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible'; ?></p>
    </div>
    
    <h2>Extensions PHP chargées</h2>
    <ul>
        <?php 
        $extensions = get_loaded_extensions();
        sort($extensions);
        foreach (array_slice($extensions, 0, 15) as $ext) {
            echo "<li>$ext</li>";
        }
        if (count($extensions) > 15) {
            echo "<li>... et " . (count($extensions) - 15) . " autres</li>";
        }
        ?>
    </ul>
    
    <div class="api-test">
        <h2>Test d'accès à l'API</h2>
        <p>Pour tester le dossier API: <a href="/api/phpinfo.php">Voir API phpinfo</a></p>
    </div>
    
    <h2>Liens utiles</h2>
    <ul>
        <li><a href="/phpinfo.php">Informations PHP complètes</a></li>
        <li><a href="/index.php">Page d'accueil PHP</a></li>
        <li><a href="/index.html">Page d'accueil HTML</a></li>
    </ul>
</body>
</html>
EOT
chmod 644 "$TEST_PHP"
echo "✓ test-php-execution.php créé"

# ÉTAPE 4: Création du fichier index.php de redirection
separator "4. CRÉATION DU FICHIER INDEX.PHP"

echo "Création du fichier index.php..."
cat > "index.php" << 'EOT'
<?php
// Redirection vers index.html
header('Location: index.html');
exit;
?>
EOT
chmod 644 "index.php"
echo "✓ index.php créé"

# ÉTAPE 5: Validation et test
separator "5. VALIDATION ET TEST"

echo "Vérification des permissions des fichiers..."
for file in $HTACCESS $USER_INI $API_HTACCESS $PHPINFO $API_PHPINFO $TEST_PHP "index.php"; do
  if [ -f "$file" ]; then
    chmod 644 "$file"
    echo "✓ Permissions pour $file: 644"
  fi
done

# ÉTAPE 6: Rapport final
separator "6. RAPPORT FINAL"

echo "Les fichiers suivants ont été créés ou mis à jour:"
echo "✓ .htaccess - Configuration Apache principale"
echo "✓ .user.ini - Configuration PHP utilisateur"
echo "✓ api/.htaccess - Configuration API"
echo "✓ phpinfo.php - Informations PHP"
echo "✓ api/phpinfo.php - Informations PHP pour API"
echo "✓ test-php-execution.php - Test d'exécution PHP"
echo "✓ index.php - Redirection vers index.html"

echo
echo "Pour vérifier que PHP fonctionne correctement, accédez à:"
echo "https://qualiopi.ch/test-php-execution.php"
echo
echo "Pour consulter les informations complètes de PHP, accédez à:"
echo "https://qualiopi.ch/phpinfo.php"
echo
echo "Pour consulter les informations de PHP dans l'API, accédez à:"
echo "https://qualiopi.ch/api/phpinfo.php"

separator "DIAGNOSTIC TERMINÉ"
echo "Si les problèmes persistent, contactez le support d'Infomaniak"
echo "en mentionnant que vous avez besoin d'aide pour l'interprétation PHP."
echo "================================================================"
