
<?php
// Script d'urgence pour corriger l'exécution PHP sur Infomaniak
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction d'exécution PHP FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; max-width: 1000px; margin: 0 auto; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .container { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; border-radius: 5px; }
        button { background: #4CAF50; color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Réparation d'urgence de l'exécution PHP - FormaCert</h1>
    
    <div class="container">
        <h2>État actuel</h2>
        <?php if(function_exists('phpinfo')): ?>
            <p><span class="success">✓ PHP est bien exécuté dans ce fichier</span></p>
            <p>Version PHP: <?php echo phpversion(); ?></p>
            <p>API serveur: <?php echo php_sapi_name(); ?></p>
        <?php else: ?>
            <p><span class="error">✗ PHP ne fonctionne pas correctement</span></p>
        <?php endif; ?>
    </div>
    
    <?php
    // Fonction pour écrire dans un fichier
    function writeFile($path, $content) {
        try {
            $result = file_put_contents($path, $content);
            return $result !== false;
        } catch (Exception $e) {
            return false;
        }
    }
    
    // Contenu des fichiers à créer/mettre à jour
    $files = [
        '.htaccess' => '# Crucial configuration for PHP execution
AddHandler application/x-httpd-php .php
AddType application/x-httpd-php .php

<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

<IfModule mod_php.c>
    php_flag engine on
</IfModule>

# Enable overrides
AllowOverride All

<IfModule mod_rewrite.c>
    RewriteEngine On
    # API requests
    RewriteRule ^api/ - [L]
    # PHP files
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteRule \.(php)$ - [L]
</IfModule>',

        'api/.htaccess' => '# Critical API .htaccess
AddHandler application/x-httpd-php .php
AddType application/x-httpd-php .php

<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

<IfModule mod_php.c>
    php_flag engine on
    php_value display_errors On
</IfModule>

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)\.php$ - [L]
</IfModule>',

        '.user.ini' => '; Enable PHP execution
engine = On
display_errors = On',

        'api/.user.ini' => '; Enable PHP execution in API
engine = On
display_errors = On'
    ];
    
    // Si demande de réparation
    if (isset($_POST['repair'])) {
        echo "<div class='container'>";
        echo "<h2>Résultats de la réparation</h2>";
        echo "<ul>";
        
        foreach ($files as $path => $content) {
            $result = writeFile($path, $content);
            echo "<li>". $path .": ". ($result ? "<span class='success'>Réussi</span>" : "<span class='error'>Échec</span>") ."</li>";
        }
        
        echo "</ul>";
        echo "<p>Création d'un fichier de test PHP pour vérification...</p>";
        
        // Créer un fichier de test
        $testContent = "<?php\nheader('Content-Type: application/json');\necho json_encode(['status' => 'success', 'php_works' => true, 'time' => date('Y-m-d H:i:s')]);\n?>";
        $testResult = writeFile('api/test-fixed.php', $testContent);
        
        echo $testResult ? 
            "<p><span class='success'>Fichier de test créé</span>. Vérifiez-le à <a href='api/test-fixed.php' target='_blank'>api/test-fixed.php</a></p>" : 
            "<p><span class='error'>Échec de la création du fichier de test</span></p>";
            
        echo "<p class='warning'>Important: Il peut être nécessaire de contacteur l'administrateur de votre hébergement Infomaniak pour activer l'exécution PHP dans votre dossier.</p>";
        
        echo "</div>";
    }
    ?>
    
    <div class="container">
        <h2>Actions de réparation</h2>
        <p>Cette action va créer ou mettre à jour les fichiers de configuration essentiels pour l'exécution PHP:</p>
        <ul>
            <li>.htaccess (racine)</li>
            <li>api/.htaccess</li>
            <li>.user.ini</li>
            <li>api/.user.ini</li>
        </ul>
        <form method="post">
            <button type="submit" name="repair">Appliquer les corrections</button>
        </form>
    </div>
    
    <div class="container">
        <h2>Instructions pour Infomaniak</h2>
        <ol>
            <li>Connectez-vous au <a href="https://manager.infomaniak.com" target="_blank">Manager Infomaniak</a></li>
            <li>Allez dans "Hébergement Web > Votre hébergement > Configuration"</li>
            <li>Vérifiez que PHP est activé pour votre hébergement</li>
            <li>Dans "Restrictions par répertoire", ajoutez une exception pour le dossier "api" pour s'assurer que PHP est explicitement activé</li>
            <li>Activez les fichiers .htaccess dans les paramètres du site</li>
            <li>Vérifiez les logs d'erreur dans "Hébergement Web > Votre hébergement > Logs"</li>
        </ol>
    </div>
    
    <p><a href="/">Retour à l'application</a> | <a href="api/phpinfo.php">Voir la configuration PHP</a></p>
</body>
</html>
