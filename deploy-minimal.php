
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Déploiement Minimal</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; padding: 10px; background-color: #f0fff0; border-left: 4px solid green; }
        .error { color: red; padding: 10px; background-color: #fff0f0; border-left: 4px solid red; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Déploiement Minimal des Fichiers Critiques</h1>
        
        <?php
        $criticalFiles = [
            '.htaccess' => 'Configuration Apache principale',
            '.user.ini' => 'Configuration PHP',
            'api/.htaccess' => 'Configuration API',
            'assets/.htaccess' => 'Configuration Assets',
            'index.php' => 'Redirection PHP',
            'phpinfo.php' => 'Test PHP Info',
            'php-test-minimal.php' => 'Test PHP minimal'
        ];
        
        $missingFiles = [];
        
        // Vérifier les fichiers
        foreach ($criticalFiles as $file => $description) {
            if (!file_exists($file)) {
                $missingFiles[$file] = $description;
            }
        }
        
        // Créer les fichiers manquants si nécessaire
        if (!empty($missingFiles)) {
            echo "<div class='card'>";
            echo "<h2>Fichiers manquants détectés</h2>";
            
            foreach ($missingFiles as $file => $description) {
                $dir = dirname($file);
                if (!is_dir($dir)) {
                    mkdir($dir, 0755, true);
                    echo "<p>Dossier créé: <strong>$dir</strong></p>";
                }
                
                $content = "";
                
                // Contenu spécifique selon le fichier
                if ($file === '.htaccess') {
                    $content = "# Configuration Apache principale
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Ne pas rediriger les fichiers ou dossiers existants
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    
    # Pour les fichiers PHP existants, permettre l'accès direct
    RewriteCond %{REQUEST_FILENAME} \.php$
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteRule ^ - [L]
    
    # Pour les fichiers dans /api/, permettre l'accès PHP
    RewriteRule ^api/ - [L]
    
    # Pour les assets statiques, ne pas rediriger
    RewriteRule ^assets/ - [L]
    
    # Rediriger tout le reste vers index.html
    RewriteRule . /index.html [L]
</IfModule>

# Définir le type MIME correct pour les fichiers CSS et JS
AddType text/css .css
AddType application/javascript .js
AddType application/javascript .mjs

# Configuration CORS
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
</IfModule>
";
                } else if ($file === '.user.ini') {
                    $content = "; Configuration PHP pour Infomaniak
display_errors = Off
log_errors = On
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
max_execution_time = 60
memory_limit = 256M
upload_max_filesize = 32M
post_max_size = 32M
date.timezone = Europe/Zurich
";
                } else if ($file === 'api/.htaccess') {
                    $content = "# Configuration API
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Définir les types MIME corrects
    AddType application/javascript .js
    AddType application/javascript .mjs
    AddType text/css .css
    AddType application/json .json
    
    # Configuration CORS
    <IfModule mod_headers.c>
        Header set Access-Control-Allow-Origin "*"
        Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
        Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    </IfModule>
    
    # Permettre l'accès direct aux fichiers PHP
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteRule \.(php)$ - [L]
    
    # Rediriger le reste vers index.php
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>
";
                } else if ($file === 'assets/.htaccess') {
                    $content = "# Configuration des assets
AddType text/css .css
AddType application/javascript .js
AddType application/javascript .mjs
AddType image/svg+xml .svg

# Force le type MIME pour CSS
<FilesMatch \"\.css$\">
    ForceType text/css
    Header set Content-Type \"text/css; charset=utf-8\"
</FilesMatch>

# Force le type MIME pour JavaScript
<FilesMatch \"\.js$\">
    ForceType application/javascript
    Header set Content-Type \"application/javascript; charset=utf-8\"
</FilesMatch>

# Activer la mise en cache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css \"access plus 1 week\"
  ExpiresByType application/javascript \"access plus 1 week\"
</IfModule>
";
                } else if ($file === 'index.php') {
                    $content = "<?php
// Redirection vers index.html
header('Location: index.html');
exit;
?>
";
                } else if ($file === 'phpinfo.php') {
                    $content = "<?php
// Afficher les informations sur PHP
phpinfo();
?>
";
                } else if ($file === 'php-test-minimal.php') {
                    $content = "<?php
// Test PHP minimal pour confirmer l'exécution du moteur PHP
header('Content-Type: text/plain');
echo \"PHP FONCTIONNE CORRECTEMENT!\";
?>
";
                }
                
                // Écrire le contenu dans le fichier
                if (file_put_contents($file, $content)) {
                    echo "<p class='success'>Fichier créé: <strong>$file</strong> - $description</p>";
                } else {
                    echo "<p class='error'>Impossible de créer le fichier: <strong>$file</strong></p>";
                }
            }
            
            echo "</div>";
            
            echo "<div class='success'>";
            echo "<h3>Fichiers critiques créés avec succès!</h3>";
            echo "<p>Tous les fichiers manquants ont été créés. Votre site devrait maintenant fonctionner correctement.</p>";
            echo "</div>";
        } else {
            echo "<div class='success'>";
            echo "<h3>Tous les fichiers critiques sont déjà présents!</h3>";
            echo "<p>Votre configuration semble complète et correcte.</p>";
            echo "</div>";
        }
        ?>
        
        <div class="card">
            <h2>Instructions pour le déploiement GitHub</h2>
            <ol>
                <li>Assurez-vous que les secrets GitHub suivants sont configurés dans votre dépôt :
                    <ul>
                        <li><strong>FTP_SERVER</strong> - Le serveur FTP d'Infomaniak</li>
                        <li><strong>FTP_USERNAME</strong> - Votre nom d'utilisateur FTP</li>
                        <li><strong>FTP_PASSWORD</strong> - Votre mot de passe FTP</li>
                    </ul>
                </li>
                <li>Vérifiez que le workflow <code>.github/workflows/deploy-optimized.yml</code> est bien configuré</li>
                <li>Déclenchez un déploiement manuel depuis l'onglet Actions de GitHub ou faites un push sur la branche main</li>
            </ol>
        </div>
    </div>
</body>
</html>
