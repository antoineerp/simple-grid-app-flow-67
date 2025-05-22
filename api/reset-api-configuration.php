
<?php
// Script pour réinitialiser les configurations API qui pourraient avoir été modifiées par super-fix-deploy.php
header("Content-Type: text/html; charset=UTF-8");

function resetApiHtaccess() {
    $htaccess_path = __DIR__ . '/.htaccess';
    $optimal_htaccess = <<<EOT
# Activer le moteur de réécriture
RewriteEngine On

# Définir le type MIME pour JavaScript et CSS
AddType application/javascript .js
AddType application/javascript .mjs
AddType application/javascript .es.js
AddType text/css .css

# Force PHP errors to show - CRITICAL
php_flag display_errors on
php_value error_reporting E_ALL

# Force PHP execution - IMPORTANT
AddHandler application/x-httpd-php .php
<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

# CORS Headers
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    
    # Caching headers for API endpoints
    <FilesMatch "\.(php)$">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
        Header set Expires 0
    </FilesMatch>
    
    # Cache for JS/CSS files
    <FilesMatch "\.(js|css|mjs|es.js)$">
        Header set Cache-Control "max-age=3600, public"
    </FilesMatch>
</IfModule>

# Gérer la requête OPTIONS pour CORS preflight
RewriteRule ^(.*)$ $1 [E=HTTP_ORIGIN:%{HTTP:ORIGIN}]
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Vérifier que les fichiers PHP existent
<Files *.php>
    Order Allow,Deny
    Allow from all
</Files>
EOT;

    // Sauvegarde de l'ancien .htaccess s'il existe
    if (file_exists($htaccess_path)) {
        copy($htaccess_path, $htaccess_path . '.bak.' . time());
    }
    
    return file_put_contents($htaccess_path, $optimal_htaccess) !== false;
}

function createTestJsonFile() {
    $test_file = __DIR__ . '/test-json.php';
    $test_content = <<<EOT
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

echo json_encode([
    'status' => 'success', 
    'message' => 'Test JSON fonctionne', 
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
EOT;

    return file_put_contents($test_file, $test_content) !== false;
}

// Exécuter les actions de réinitialisation
$htaccess_reset = resetApiHtaccess();
$json_test_created = createTestJsonFile();
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Réinitialisation de la Configuration API</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Réinitialisation de la Configuration API</h1>
    
    <div class="section">
        <h2>Actions effectuées:</h2>
        <p>Réinitialisation du fichier .htaccess: <?php echo $htaccess_reset ? '<span class="success">Réussi</span>' : '<span class="error">Échec</span>'; ?></p>
        <p>Création d'un fichier de test JSON: <?php echo $json_test_created ? '<span class="success">Réussi</span>' : '<span class="error">Échec</span>'; ?></p>
    </div>
    
    <div class="section">
        <h2>Tests de validation:</h2>
        <p>Testez l'accès à ces fichiers pour vérifier si le problème est résolu:</p>
        <ul>
            <li><a href="test-json.php" target="_blank">Test JSON</a> - Devrait afficher un objet JSON simple</li>
            <li><a href="php-execution-test.php" target="_blank">Test d'exécution PHP</a> - Devrait afficher un autre objet JSON</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Que faire si cela ne fonctionne pas?</h2>
        <p>Si les liens ci-dessus affichent toujours du code PHP brut au lieu de JSON:</p>
        <ol>
            <li>Vérifiez la configuration PHP sur votre serveur</li>
            <li>Assurez-vous que le module mod_rewrite est activé</li>
            <li>Contactez votre hébergeur pour obtenir de l'aide sur l'exécution PHP</li>
        </ol>
    </div>
    
    <p><a href="/">Retour à l'application</a></p>
</body>
</html>
<?php
// Créer également un petit fichier de test PHP si php-execution-test.php n'existe pas encore
if (!file_exists(__DIR__ . '/php-execution-test.php')) {
    $php_test = <<<EOT
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Cache-Control: no-cache, no-store, must-revalidate");

echo json_encode([
    'status' => 'success',
    'message' => 'PHP s\'exécute correctement',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'server_software' => \$_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'
]);
?>
EOT;

    file_put_contents(__DIR__ . '/php-execution-test.php', $php_test);
}
?>
