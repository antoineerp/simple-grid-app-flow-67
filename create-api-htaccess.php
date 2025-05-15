
<?php
header('Content-Type: text/html; charset=utf-8');

$api_dir = 'api';
$htaccess_file = $api_dir . '/.htaccess';
$message = '';
$status = '';

// Créer le dossier api s'il n'existe pas
if (!is_dir($api_dir)) {
    if (mkdir($api_dir, 0755)) {
        $message .= "Dossier api créé. ";
    } else {
        $message .= "Impossible de créer le dossier api. ";
        $status = 'error';
    }
}

// Contenu pour api/.htaccess
$htaccess_content = '# Configuration pour le dossier API sur Infomaniak

# Activer la réécriture d\'URL
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

# Permettre l\'accès direct aux fichiers PHP spécifiques
<FilesMatch "^(phpinfo|db-test|check|phpinfo-test|diagnostic)\.php$">
    # Aucune réécriture pour ces fichiers
</FilesMatch>

# Rediriger toutes les requêtes vers l\'index.php sauf pour les fichiers existants
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

# Définition d\'une page d\'erreur JSON personnalisée pour les erreurs
ErrorDocument 500 \'{"status":"error","message":"Erreur interne du serveur","code":500}\'
ErrorDocument 404 \'{"status":"error","message":"Ressource non trouvée","code":404}\'
ErrorDocument 403 \'{"status":"error","message":"Accès interdit","code":403}\'
';

// Créer ou mettre à jour le fichier .htaccess dans api/
if (file_put_contents($htaccess_file, $htaccess_content)) {
    $message .= "Fichier api/.htaccess créé ou mis à jour avec succès.";
    $status = 'success';
} else {
    $message .= "Impossible de créer ou mettre à jour le fichier api/.htaccess.";
    $status = 'error';
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Création/Mise à jour du fichier api/.htaccess</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Création/Mise à jour du fichier api/.htaccess</h1>
    
    <p class="<?php echo $status ?: 'success'; ?>"><?php echo $message; ?></p>
    
    <p><a href="check-infomaniak.php">Retour à la vérification</a></p>
</body>
</html>
