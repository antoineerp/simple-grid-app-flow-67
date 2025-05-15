
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Création du script mkdir</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f9; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .button { background: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Création du script mkdir_script.sh</h1>
    
    <?php
    $script_content = <<<'EOT'
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
EOT;

    $script_path = 'mkdir_script.sh';
    $success = false;
    $message = '';
    
    // Créer le fichier
    if (isset($_POST['create'])) {
        if (file_put_contents($script_path, $script_content)) {
            chmod($script_path, 0755); // Rendre le script exécutable
            $success = true;
            $message = "Le script a été créé avec succès et rendu exécutable.";
        } else {
            $message = "Erreur lors de la création du fichier. Vérifiez les permissions.";
        }
    }
    
    // Exécuter le script
    if (isset($_POST['execute'])) {
        if (file_exists($script_path)) {
            $output = shell_exec("bash $script_path 2>&1");
            echo "<h2>Exécution du script</h2>";
            echo "<pre>$output</pre>";
        } else {
            echo "<p class='error'>Le script n'existe pas encore. Créez-le d'abord.</p>";
        }
    }
    
    // Vérifier si le fichier existe déjà
    if (file_exists($script_path)) {
        echo "<p class='success'>Le fichier mkdir_script.sh existe déjà.</p>";
        echo "<form method='post'>";
        echo "<input type='submit' name='execute' value='Exécuter le script' class='button'>";
        echo "</form>";
        
        echo "<h2>Contenu actuel:</h2>";
        echo "<pre>" . htmlspecialchars(file_get_contents($script_path)) . "</pre>";
    } else {
        echo "<p>Le fichier mkdir_script.sh n'existe pas encore.</p>";
        echo "<form method='post'>";
        echo "<input type='hidden' name='create' value='1'>";
        echo "<input type='submit' value='Créer le fichier mkdir_script.sh' class='button'>";
        echo "</form>";
        
        echo "<h2>Contenu qui sera créé:</h2>";
        echo "<pre>" . htmlspecialchars($script_content) . "</pre>";
    }
    
    if ($message) {
        echo "<p class='" . ($success ? 'success' : 'error') . "'>$message</p>";
    }
    ?>
    
    <h2>Instructions d'utilisation</h2>
    <p>Une fois le script créé, vous pouvez l'exécuter de deux façons:</p>
    <ol>
        <li>Cliquez sur le bouton "Exécuter le script" ci-dessus</li>
        <li>Ou via SSH avec les commandes suivantes:
            <pre>
cd /home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch
chmod +x mkdir_script.sh
./mkdir_script.sh
            </pre>
        </li>
    </ol>
</body>
</html>
