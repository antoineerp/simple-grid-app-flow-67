
<?php
header('Content-Type: text/html; charset=utf-8');

function diagnostiquer_probleme_php() {
    $resultats = [];
    
    // Vérifier la version PHP
    $resultats['version_php'] = phpversion();
    
    // Vérifier le mode d'exécution PHP
    $resultats['sapi'] = php_sapi_name();
    
    // Vérifier les modules Apache chargés si applicable
    if (function_exists('apache_get_modules')) {
        $resultats['apache_modules'] = apache_get_modules();
        $resultats['mod_php_present'] = in_array('mod_php7', $resultats['apache_modules']) || 
                                       in_array('mod_php', $resultats['apache_modules']);
    } else {
        $resultats['apache_modules'] = "Non disponible (probablement en mode CGI/FastCGI)";
        $resultats['mod_php_present'] = false;
    }
    
    // Vérifier les permissions des fichiers PHP
    $script_actuel = $_SERVER['SCRIPT_FILENAME'];
    $permissions = fileperms($script_actuel);
    $resultats['permissions_script_actuel'] = sprintf('%o', $permissions & 0777);
    
    // Vérifier si .htaccess existe et ses permissions
    $htaccess_path = dirname($_SERVER['SCRIPT_FILENAME']) . '/.htaccess';
    $resultats['htaccess_existe'] = file_exists($htaccess_path);
    $resultats['htaccess_permissions'] = $resultats['htaccess_existe'] ? 
                                        sprintf('%o', fileperms($htaccess_path) & 0777) : 'N/A';
    
    // Vérifier .user.ini
    $user_ini_path = dirname($_SERVER['SCRIPT_FILENAME']) . '/.user.ini';
    $resultats['user_ini_existe'] = file_exists($user_ini_path);
    $resultats['user_ini_permissions'] = $resultats['user_ini_existe'] ? 
                                       sprintf('%o', fileperms($user_ini_path) & 0777) : 'N/A';
    
    // Vérifier les directives PHP importantes
    $directives = ['display_errors', 'log_errors', 'error_reporting', 'short_open_tag', 
                  'upload_max_filesize', 'post_max_size', 'memory_limit'];
    $resultats['directives_php'] = [];
    foreach ($directives as $directive) {
        $resultats['directives_php'][$directive] = ini_get($directive);
    }
    
    // Vérifier le propriétaire des fichiers
    if (function_exists('posix_getpwuid')) {
        $owner_info = posix_getpwuid(fileowner($script_actuel));
        $resultats['proprietaire_script'] = $owner_info['name'];
    } else {
        $resultats['proprietaire_script'] = 'Fonction posix_getpwuid non disponible';
    }
    
    return $resultats;
}

function creer_htaccess() {
    $htaccess_content = <<<EOT
# Activer le moteur de réécriture
RewriteEngine On

# Configuration explicite pour exécuter PHP
<Files *.php>
    SetHandler application/x-httpd-php
</Files>

# Désactiver toutes les limites qui pourraient bloquer PHP
<IfModule mod_php.c>
    php_flag engine on
</IfModule>

# Rediriger toutes les requêtes vers index.html sauf pour PHP et fichiers existants
RewriteCond %{REQUEST_FILENAME} !\.php$
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(?!api/)(.*)$ /index.html [L]

# Configuration explicite des types MIME
AddType text/css .css
AddType application/javascript .js
AddType application/javascript .mjs
AddType image/svg+xml .svg
EOT;

    return file_put_contents('.htaccess', $htaccess_content);
}

function creer_user_ini() {
    $user_ini_content = <<<EOT
; Configuration PHP pour Infomaniak
display_errors = On
log_errors = On
error_reporting = E_ALL
short_open_tag = On
max_execution_time = 300
memory_limit = 256M
upload_max_filesize = 64M
post_max_size = 64M
EOT;

    return file_put_contents('.user.ini', $user_ini_content);
}

function creer_phpinfo() {
    $phpinfo_content = <<<EOT
<?php
// Afficher les informations complètes sur PHP
phpinfo();
?>
EOT;

    return file_put_contents('phpinfo-complet.php', $phpinfo_content);
}

function creer_test_minimal() {
    $test_minimal = <<<EOT
<?php echo 'PHP fonctionne!'; ?>
EOT;

    return file_put_contents('php-test-minimal.php', $test_minimal);
}

// Effectuer le diagnostic
$diagnostic = diagnostiquer_probleme_php();
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réparation d'urgence PHP</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; }
        h1, h2 { color: #333; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .success { color: green; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .actions { margin-top: 20px; }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin: 5px; }
    </style>
</head>
<body>
    <h1>Réparation d'urgence PHP sur Infomaniak</h1>
    
    <div class="section">
        <h2>Diagnostic du système</h2>
        <p><strong>Version PHP:</strong> <?php echo $diagnostic['version_php']; ?></p>
        <p><strong>Mode d'exécution (SAPI):</strong> <?php echo $diagnostic['sapi']; ?></p>
        <p><strong>Permissions de ce script:</strong> <?php echo $diagnostic['permissions_script_actuel']; ?></p>
        <p><strong>Propriétaire du script:</strong> <?php echo $diagnostic['proprietaire_script']; ?></p>
        
        <h3>Fichiers de configuration</h3>
        <p><strong>.htaccess:</strong> <?php echo $diagnostic['htaccess_existe'] ? 
            'Existe (permissions: ' . $diagnostic['htaccess_permissions'] . ')' : 
            '<span class="warning">Manquant</span>'; ?></p>
        <p><strong>.user.ini:</strong> <?php echo $diagnostic['user_ini_existe'] ? 
            'Existe (permissions: ' . $diagnostic['user_ini_permissions'] . ')' : 
            '<span class="warning">Manquant</span>'; ?></p>
    </div>
    
    <div class="section">
        <h2>Actions de réparation</h2>
        <?php
        $actions_effectuees = [];
        $erreurs = [];
        
        if (isset($_POST['fix_htaccess'])) {
            if (creer_htaccess()) {
                $actions_effectuees[] = "Fichier .htaccess créé ou mis à jour";
            } else {
                $erreurs[] = "Impossible de créer ou mettre à jour le fichier .htaccess";
            }
        }
        
        if (isset($_POST['fix_user_ini'])) {
            if (creer_user_ini()) {
                $actions_effectuees[] = "Fichier .user.ini créé ou mis à jour";
            } else {
                $erreurs[] = "Impossible de créer ou mettre à jour le fichier .user.ini";
            }
        }
        
        if (isset($_POST['create_phpinfo'])) {
            if (creer_phpinfo()) {
                $actions_effectuees[] = "Fichier phpinfo-complet.php créé";
            } else {
                $erreurs[] = "Impossible de créer le fichier phpinfo-complet.php";
            }
        }
        
        if (isset($_POST['create_test_minimal'])) {
            if (creer_test_minimal()) {
                $actions_effectuees[] = "Fichier php-test-minimal.php créé";
            } else {
                $erreurs[] = "Impossible de créer le fichier php-test-minimal.php";
            }
        }
        
        if (!empty($actions_effectuees)) {
            echo '<div style="background: #d4edda; padding: 10px; margin-bottom: 15px; border-radius: 5px;">';
            echo '<h3 style="color: #155724;">Actions réalisées :</h3><ul>';
            foreach ($actions_effectuees as $action) {
                echo '<li>' . $action . '</li>';
            }
            echo '</ul></div>';
        }
        
        if (!empty($erreurs)) {
            echo '<div style="background: #f8d7da; padding: 10px; margin-bottom: 15px; border-radius: 5px;">';
            echo '<h3 style="color: #721c24;">Erreurs :</h3><ul>';
            foreach ($erreurs as $erreur) {
                echo '<li>' . $erreur . '</li>';
            }
            echo '</ul></div>';
        }
        ?>
        
        <form method="post">
            <p>Sélectionnez les actions à effectuer :</p>
            <div class="actions">
                <button type="submit" name="fix_htaccess" class="button">Créer/Corriger .htaccess</button>
                <button type="submit" name="fix_user_ini" class="button">Créer/Corriger .user.ini</button>
                <button type="submit" name="create_phpinfo" class="button">Créer phpinfo-complet.php</button>
                <button type="submit" name="create_test_minimal" class="button">Créer test PHP minimal</button>
            </div>
        </form>
    </div>
    
    <div class="section">
        <h2>Conseils pour Infomaniak</h2>
        <ol>
            <li>Assurez-vous que PHP est activé pour votre hébergement dans l'interface Infomaniak.</li>
            <li>Si les fichiers PHP ne s'exécutent toujours pas, contactez le support Infomaniak.</li>
            <li>Vérifiez les droits d'accès des répertoires (755) et fichiers (644).</li>
            <li>Pour les utilisateurs avancés, vérifiez si FPM est correctement configuré.</li>
        </ol>
    </div>
    
    <div class="section">
        <h2>Tests après réparation</h2>
        <p>Après avoir appliqué les corrections, testez avec ces liens :</p>
        <ul>
            <li><a href="php-test-minimal.php" target="_blank">Test PHP minimal</a> (devrait simplement afficher "PHP fonctionne!")</li>
            <li><a href="phpinfo-complet.php" target="_blank">PHPInfo complet</a> (informations détaillées sur PHP)</li>
            <li><a href="test-php-execution.php" target="_blank">Test d'exécution PHP</a> (test plus complet)</li>
        </ul>
    </div>
</body>
</html>
