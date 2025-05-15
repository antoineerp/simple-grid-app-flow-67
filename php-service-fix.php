
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic 503 Service Unavailable</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .fix-btn { display: inline-block; background: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Diagnostic et Correction 503 Service Unavailable</h1>
    
    <div class="section">
        <h2>Informations du serveur</h2>
        <?php
        echo "<p>Date et heure: " . date('Y-m-d H:i:s') . "</p>";
        echo "<p>Version PHP: " . phpversion() . "</p>";
        echo "<p>Serveur: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible') . "</p>";
        
        // Vérifier si nous sommes sur Infomaniak
        $is_infomaniak = false;
        if (strpos($_SERVER['DOCUMENT_ROOT'] ?? '', '/home/clients') !== false) {
            $is_infomaniak = true;
            echo "<p class='success'>Environnement Infomaniak détecté</p>";
        } else {
            echo "<p class='warning'>Environnement Infomaniak non détecté</p>";
        }
        ?>
    </div>
    
    <?php
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        echo "<div class='section'>";
        echo "<h2>Actions effectuées</h2>";
        
        // Réparer .htaccess
        if (isset($_POST['fix_htaccess'])) {
            $htaccess_content = "# Activer le moteur de réécriture
RewriteEngine On

# Force l'interprétation des fichiers .php par le moteur PHP
AddHandler application/x-httpd-php .php
AddType application/x-httpd-php .php
<FilesMatch \"\\.php$\">
    SetHandler application/x-httpd-php
</FilesMatch>

# Configuration des types MIME
AddType text/css .css
AddType application/javascript .js
AddType application/javascript .mjs

# Force le type MIME pour CSS avec le charset UTF-8
<FilesMatch \"\\.css$\">
    ForceType text/css
    Header set Content-Type \"text/css; charset=utf-8\"
</FilesMatch>

# Force le type MIME pour JavaScript avec le charset UTF-8
<FilesMatch \"\\.js$\">
    ForceType application/javascript
    Header set Content-Type \"application/javascript; charset=utf-8\"
</FilesMatch>

# Rediriger toutes les requêtes vers index.html sauf les fichiers physiques, dossiers ou API
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(?!api/)(.*)$ /index.html [L]

# Désactiver l'indexation des répertoires
Options -Indexes

# Protection contre le MIME-sniffing
<IfModule mod_headers.c>
    Header set X-Content-Type-Options \"nosniff\"
</IfModule>

# Force PHP pour tous les fichiers .php
<Files *.php>
    SetHandler application/x-httpd-php
</Files>";
            
            if (file_put_contents('.htaccess', $htaccess_content)) {
                echo "<p class='success'>Fichier .htaccess créé/mis à jour avec succès</p>";
            } else {
                echo "<p class='error'>Impossible de créer/mettre à jour le fichier .htaccess</p>";
            }
        }
        
        // Réparer .user.ini
        if (isset($_POST['fix_user_ini'])) {
            $user_ini_content = "; Configuration PHP pour Infomaniak
display_errors = On
log_errors = On
error_log = php_errors.log
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
max_execution_time = 120
memory_limit = 256M
upload_max_filesize = 64M
post_max_size = 64M
default_charset = \"UTF-8\"";
            
            if (file_put_contents('.user.ini', $user_ini_content)) {
                echo "<p class='success'>Fichier .user.ini créé/mis à jour avec succès</p>";
            } else {
                echo "<p class='error'>Impossible de créer/mettre à jour le fichier .user.ini</p>";
            }
        }
        
        // Réparer api/.htaccess
        if (isset($_POST['fix_api_htaccess'])) {
            if (!is_dir('api')) {
                mkdir('api', 0755);
                echo "<p class='success'>Dossier api créé</p>";
            }
            
            $api_htaccess_content = "# Configuration pour le dossier API sur Infomaniak
AddHandler application/x-httpd-php .php
AddType application/x-httpd-php .php
<FilesMatch \"\\.php$\">
    SetHandler application/x-httpd-php
</FilesMatch>

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
    <FilesMatch \"\\.js$\">
        Header set Content-Type \"application/javascript\"
        Header set X-Content-Type-Options \"nosniff\"
    </FilesMatch>
    
    # Configuration CORS standardisée
    Header always set Access-Control-Allow-Origin \"*\"
    Header always set Access-Control-Allow-Methods \"GET, POST, OPTIONS, PUT, DELETE\"
    Header always set Access-Control-Allow-Headers \"Content-Type, Authorization, X-Requested-With, X-Device-ID\"
    
    # Éviter la mise en cache des réponses API
    Header set Cache-Control \"no-cache, no-store, must-revalidate\"
    Header set Pragma \"no-cache\"
    Header set Expires 0
</IfModule>";
            
            if (file_put_contents('api/.htaccess', $api_htaccess_content)) {
                echo "<p class='success'>Fichier api/.htaccess créé/mis à jour avec succès</p>";
            } else {
                echo "<p class='error'>Impossible de créer/mettre à jour le fichier api/.htaccess</p>";
            }
        }
        
        // Créer un fichier PHP de test
        if (isset($_POST['create_test_file'])) {
            $test_content = "<?php
header('Content-Type: text/plain');
echo \"PHP FONCTIONNE CORRECTEMENT SUR INFOMANIAK!\";
echo \"\\n\\nDate et heure: \" . date('Y-m-d H:i:s');
echo \"\\nVersion PHP: \" . phpversion();
echo \"\\nMode d'exécution PHP: \" . php_sapi_name();
echo \"\\nDossier courant: \" . getcwd();
?>";
            
            if (file_put_contents('php-test.php', $test_content)) {
                echo "<p class='success'>Fichier de test php-test.php créé avec succès</p>";
                echo "<p>Test disponible ici: <a href='php-test.php' target='_blank'>php-test.php</a></p>";
            } else {
                echo "<p class='error'>Impossible de créer le fichier de test</p>";
            }
        }
        
        // Contacter Infomaniak
        if (isset($_POST['contact_infomaniak'])) {
            echo "<p class='warning'>Important: Veuillez contacter le support Infomaniak avec ces informations:</p>";
            echo "<pre>
Objet: Erreur 503 Service Unavailable sur mon hébergement

Message:
Bonjour,

Je rencontre une erreur 503 Service Unavailable sur mon site qualiopi.ch.
Les commandes SSH montrent qu'aucun processus PHP-FPM n'est en cours d'exécution.

Informations:
- Nom de domaine: qualiopi.ch
- Version PHP: " . phpversion() . "
- Serveur: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible') . "
- Date et heure: " . date('Y-m-d H:i:s') . "

Pourriez-vous vérifier et redémarrer le service PHP-FPM pour mon hébergement?

Merci d'avance,
</pre>";
        }
        
        echo "</div>";
    }
    ?>
    
    <div class="section">
        <h2>Solutions possibles</h2>
        <form method="post">
            <p>Le problème 503 Service Unavailable est généralement causé par un service PHP-FPM qui ne fonctionne pas correctement. Sélectionnez les actions à effectuer:</p>
            
            <button type="submit" name="fix_htaccess" class="fix-btn">1. Réparer .htaccess</button><br>
            <button type="submit" name="fix_user_ini" class="fix-btn">2. Réparer .user.ini</button><br>
            <button type="submit" name="fix_api_htaccess" class="fix-btn">3. Réparer api/.htaccess</button><br>
            <button type="submit" name="create_test_file" class="fix-btn">4. Créer un fichier PHP de test</button><br>
            <button type="submit" name="contact_infomaniak" class="fix-btn">5. Générer un message pour le support Infomaniak</button>
        </form>
        
        <div style="margin-top: 20px; padding: 10px; border-left: 4px solid #3498db; background-color: #ebf5fb;">
            <h3>Recommandations</h3>
            <ol>
                <li>Essayez d'abord de réparer les fichiers de configuration (.htaccess et .user.ini)</li>
                <li>Testez si PHP fonctionne avec le fichier de test</li>
                <li>Si le problème persiste, contactez le support Infomaniak en leur indiquant que:
                    <ul>
                        <li>Votre site renvoie une erreur 503 Service Unavailable</li>
                        <li>Les commandes SSH ne montrent aucun processus PHP-FPM en cours d'exécution</li>
                        <li>Vous avez besoin qu'ils vérifient et redémarrent le service PHP-FPM pour votre hébergement</li>
                    </ul>
                </li>
            </ol>
        </div>
    </div>
</body>
</html>
