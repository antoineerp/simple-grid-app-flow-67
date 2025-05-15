<?php
// Assurez-vous qu'il n'y a aucun espace ou sortie avant cette ligne
ob_start(); // Démarrer la mise en tampon de sortie
header("Content-Type: text/html; charset=utf-8");

// Fonctions de diagnostic et réparation
function diagnostiquer_probleme_php() {
    $diagnostic = [];
    
    // Version PHP
    $diagnostic["version_php"] = phpversion();
    $diagnostic["sapi"] = php_sapi_name();
    
    // Permissions
    $diagnostic["permission_script"] = sprintf("%o", fileperms(__FILE__) & 0777);
    $diagnostic["owner"] = function_exists("posix_getpwuid") ? posix_getpwuid(fileowner(__FILE__))["name"] : "inconnu";
    
    // Fichiers de configuration
    $diagnostic["htaccess_exists"] = file_exists(".htaccess");
    if ($diagnostic["htaccess_exists"]) {
        $diagnostic["htaccess_permissions"] = sprintf("%o", fileperms(".htaccess") & 0777);
    }
    
    $diagnostic["user_ini_exists"] = file_exists(".user.ini");
    if ($diagnostic["user_ini_exists"]) {
        $diagnostic["user_ini_permissions"] = sprintf("%o", fileperms(".user.ini") & 0777);
    }
    
    return $diagnostic;
}

function creer_htaccess() {
    $contenu = <<<EOT
# Activer le moteur de réécriture
RewriteEngine On

# Rediriger HTTP vers HTTPS (commenter si non applicable)
# RewriteCond %{HTTPS} off
# RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Forcer l'utilisation de l'interpréteur PHP
AddType application/x-httpd-php .php
<FilesMatch "\\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

# Pour les fichiers CSS
AddType text/css .css
<FilesMatch "\\.css$">
    ForceType text/css
</FilesMatch>

# Pour les fichiers JavaScript
AddType application/javascript .js .mjs
<FilesMatch "\\.(js|mjs)$">
    ForceType application/javascript
</FilesMatch>

# Configuration API REST
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Redirection de l'index.php vers index.html
    RewriteCond %{THE_REQUEST} ^[A-Z]{3,9}\\ /index\\.php [NC]
    RewriteRule ^index\\.php$ / [R=301,L]
    
    # Traiter toutes les requêtes qui ne correspondent pas à un fichier réel
    # via l'API ou le router front-end
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ api/index.php [L]
    RewriteRule ^(.*)$ index.html [L]
</IfModule>

# Protection des fichiers sensibles
<FilesMatch "^\\.(htaccess|htpasswd|user\\.ini|php\\.ini)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>

# Désactiver l'affichage du contenu des répertoires
Options -Indexes
EOT;

    return file_put_contents(".htaccess", $contenu) !== false;
}

function creer_user_ini() {
    $contenu = <<<EOT
; Configuration PHP pour Infomaniak
display_errors = Off
log_errors = On
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
max_execution_time = 120
memory_limit = 256M
upload_max_filesize = 64M
post_max_size = 64M
default_charset = "UTF-8"
EOT;

    return file_put_contents(".user.ini", $contenu) !== false;
}

function creer_phpinfo() {
    $contenu = <<<EOT
<?php
// Afficher les informations détaillées sur PHP
header('Content-Type: text/html; charset=utf-8');
phpinfo();
?>
EOT;

    return file_put_contents("phpinfo-complet.php", $contenu) !== false;
}

function creer_test_minimal() {
    $contenu = <<<EOT
<?php
header('Content-Type: text/plain');
echo "PHP fonctionne!";
?>
EOT;

    return file_put_contents("php-test-minimal.php", $contenu) !== false;
}

// Effectuer le diagnostic
$diagnostic = diagnostiquer_probleme_php();

// Traitement des actions
$actions_effectuees = [];
$erreurs = [];

// Vérifier si c'est un accès web ou ligne de commande
$is_cli = (php_sapi_name() === 'cli');
$is_post_request = !$is_cli && isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST';

// Gestion des actions en fonction du contexte
if ($is_cli) {
    // Mode CLI: créer automatiquement tous les fichiers
    if (creer_htaccess()) {
        $actions_effectuees[] = "Fichier .htaccess créé ou mis à jour";
    } else {
        $erreurs[] = "Impossible de créer ou mettre à jour le fichier .htaccess";
    }
    
    if (creer_user_ini()) {
        $actions_effectuees[] = "Fichier .user.ini créé ou mis à jour";
    } else {
        $erreurs[] = "Impossible de créer ou mettre à jour le fichier .user.ini";
    }
    
    if (creer_phpinfo()) {
        $actions_effectuees[] = "Fichier phpinfo-complet.php créé";
    } else {
        $erreurs[] = "Impossible de créer le fichier phpinfo-complet.php";
    }
    
    if (creer_test_minimal()) {
        $actions_effectuees[] = "Fichier php-test-minimal.php créé";
    } else {
        $erreurs[] = "Impossible de créer le fichier php-test-minimal.php";
    }
} elseif ($is_post_request) {
    // Mode web avec formulaire POST
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
}

// S'assurer que les fichiers critiques existent toujours
if (!file_exists("test-php-execution.php")) {
    $test_php_content = <<<EOT
<?php
header("Content-Type: text/html; charset=utf-8");
echo "<h1>Test d'exécution PHP</h1>";
echo "<p>Si vous voyez ce message, PHP fonctionne correctement via le web.</p>";
echo "<p>Date et heure: " . date("Y-m-d H:i:s") . "</p>";
echo "<p>Version PHP: " . phpversion() . "</p>";
echo "<p>Extensions chargées: " . implode(", ", array_slice(get_loaded_extensions(), 0, 10)) . "...</p>";
?>
EOT;
    file_put_contents("test-php-execution.php", $test_php_content);
    $actions_effectuees[] = "Fichier test-php-execution.php créé (manquant)";
}

// Vider le tampon de sortie pour éviter les erreurs "headers already sent"
ob_end_flush();

// Si mode CLI, afficher directement les résultats
if ($is_cli) {
    echo "=== RÉPARATION D'URGENCE PHP ===\n\n";
    echo "Version PHP: " . $diagnostic["version_php"] . "\n";
    echo "Mode d'exécution: " . $diagnostic["sapi"] . "\n\n";
    
    echo "=== ACTIONS RÉALISÉES ===\n";
    foreach ($actions_effectuees as $action) {
        echo "✓ $action\n";
    }
    
    if (!empty($erreurs)) {
        echo "\n=== ERREURS RENCONTRÉES ===\n";
        foreach ($erreurs as $erreur) {
            echo "✗ $erreur\n";
        }
    }
    
    echo "\nFichiers créés avec succès. Vous pouvez maintenant accéder à ces fichiers via votre navigateur.\n";
    exit;
}
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
        <p><strong>Version PHP:</strong> <?php echo $diagnostic["version_php"]; ?></p>
        <p><strong>Mode d'exécution (SAPI):</strong> <?php echo $diagnostic["sapi"]; ?></p>
        <p><strong>Permissions de ce script:</strong> <?php echo $diagnostic["permission_script"]; ?></p>
        <p><strong>Propriétaire du script:</strong> <?php echo $diagnostic["owner"]; ?></p>
        
        <h3>Fichiers de configuration</h3>
        <p><strong>.htaccess:</strong> <?php echo $diagnostic["htaccess_exists"] ? "Existe (permissions: {$diagnostic["htaccess_permissions"]})" : "Manquant"; ?></p>
        <p><strong>.user.ini:</strong> <?php echo $diagnostic["user_ini_exists"] ? "Existe (permissions: {$diagnostic["user_ini_permissions"]})" : "Manquant"; ?></p>
    </div>
    
    <div class="section">
        <h2>Actions de réparation</h2>
        <?php
        if (!empty($actions_effectuees)) {
            echo '<div style="background: #d4edda; padding: 10px; margin-bottom: 15px; border-radius: 5px;">';
            echo '<h3 style="color: #155724;">Actions réalisées :</h3><ul>';
            foreach ($actions_effectuees as $action) {
                echo "<li>$action</li>";
            }
            echo '</ul></div>';
        }
        
        if (!empty($erreurs)) {
            echo '<div style="background: #f8d7da; padding: 10px; margin-bottom: 15px; border-radius: 5px;">';
            echo '<h3 style="color: #721c24;">Erreurs rencontrées :</h3><ul>';
            foreach ($erreurs as $erreur) {
                echo "<li>$erreur</li>";
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
