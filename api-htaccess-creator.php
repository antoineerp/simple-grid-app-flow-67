
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Création du fichier .htaccess pour l'API</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f9; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .button { background: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Création du fichier .htaccess pour l'API</h1>
    
    <?php
    $htaccess_content = <<<'EOT'
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
EOT;

    $file_path = 'api/.htaccess';
    $success = false;
    $message = '';
    
    // Créer le fichier
    if (isset($_POST['create'])) {
        // Vérifier que le dossier api existe
        if (!is_dir('api')) {
            mkdir('api', 0755, true);
            $message .= "Le dossier api a été créé. ";
        }
        
        if (file_put_contents($file_path, $htaccess_content)) {
            chmod($file_path, 0644); // Permissions standards pour un fichier .htaccess
            $success = true;
            $message = "Le fichier .htaccess a été créé avec succès.";
        } else {
            $message = "Erreur lors de la création du fichier. Vérifiez les permissions.";
        }
    }
    
    // Vérifier si le fichier existe déjà
    if (file_exists($file_path)) {
        echo "<p class='success'>Le fichier api/.htaccess existe déjà.</p>";
        echo "<h2>Contenu actuel:</h2>";
        echo "<pre>" . htmlspecialchars(file_get_contents($file_path)) . "</pre>";
    } else {
        echo "<p>Le fichier api/.htaccess n'existe pas encore.</p>";
        echo "<form method='post'>";
        echo "<input type='hidden' name='create' value='1'>";
        echo "<input type='submit' value='Créer le fichier api/.htaccess' class='button'>";
        echo "</form>";
        
        echo "<h2>Contenu qui sera créé:</h2>";
        echo "<pre>" . htmlspecialchars($htaccess_content) . "</pre>";
    }
    
    if ($message) {
        echo "<p class='" . ($success ? 'success' : 'error') . "'>$message</p>";
    }
    ?>
    
    <p><a href="create-mkdir-script.php" style="margin-right: 10px;">Retour à la création du script mkdir</a></p>
</body>
</html>
