
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restauration de la Fonctionnalité API</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
        button { padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <h1>Restauration de la Fonctionnalité API</h1>
    
    <?php
    // Vérifier si le fichier super-fix-deploy.php existe
    $super_fix_exists = file_exists(__DIR__ . '/super-fix-deploy.php');
    ?>
    
    <div class="section">
        <h2>1. Identification du problème</h2>
        <p>État actuel:</p>
        <ul>
            <li>Fichier super-fix-deploy.php: <?php echo $super_fix_exists ? '<span class="success">Existe</span>' : '<span class="error">N\'existe pas</span>'; ?></li>
        </ul>
        
        <?php
        // Vérifier si le fichier .htaccess de l'API existe et s'il contient les bonnes directives
        $api_htaccess = __DIR__ . '/.htaccess';
        $api_htaccess_content = file_exists($api_htaccess) ? file_get_contents($api_htaccess) : '';
        
        $has_php_handler = strpos($api_htaccess_content, 'application/x-httpd-php') !== false;
        $has_cors_headers = strpos($api_htaccess_content, 'Access-Control-Allow-Origin') !== false;
        ?>
        
        <h3>Configuration .htaccess de l'API:</h3>
        <ul>
            <li>Fichier .htaccess dans l'API: <?php echo file_exists($api_htaccess) ? '<span class="success">Existe</span>' : '<span class="error">Manquant</span>'; ?></li>
            <li>Handler PHP configuré: <?php echo $has_php_handler ? '<span class="success">Oui</span>' : '<span class="warning">Non</span>'; ?></li>
            <li>Headers CORS configurés: <?php echo $has_cors_headers ? '<span class="success">Oui</span>' : '<span class="warning">Non</span>'; ?></li>
        </ul>
    </div>
    
    <div class="section">
        <h2>2. Test d'exécution PHP dans l'API</h2>
        
        <?php
        // Exécuter un test PHP simple pour vérifier si PHP fonctionne correctement
        $php_working = true;
        $api_root = __DIR__;
        
        // Créer un fichier de test temporaire
        $test_file = $api_root . '/api-test-' . time() . '.php';
        $test_content = '<?php header("Content-Type: application/json"); echo json_encode(["status" => "success", "message" => "PHP works", "time" => time()]); ?>';
        
        if (file_put_contents($test_file, $test_content)) {
            echo "<p class='success'>Fichier de test créé: " . basename($test_file) . "</p>";
            
            // URL relative du fichier de test
            $test_url = './' . basename($test_file);
            
            echo "<p>Test d'exécution PHP: <a href='$test_url' target='_blank'>Exécuter le test</a></p>";
            echo "<p>Le lien ci-dessus devrait afficher un JSON et non du code PHP brut. Si vous voyez du code PHP, cela confirme que PHP n'est pas exécuté correctement.</p>";
        } else {
            echo "<p class='error'>Impossible de créer le fichier de test. Vérifiez les permissions.</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>3. Restauration de la fonctionnalité</h2>
        
        <p>Cliquez sur les boutons ci-dessous pour effectuer les actions de restauration:</p>
        
        <form method="post" action="">
            <p><button type="submit" name="restore_htaccess">Restaurer .htaccess de l'API</button> - Réinitialise le fichier .htaccess de l'API avec des paramètres corrects.</p>
            <p><button type="submit" name="check_php_execution">Vérifier l'exécution PHP</button> - Teste si PHP s'exécute correctement sur le serveur.</p>
            <p><button type="submit" name="create_test_endpoint">Créer un endpoint de test JSON</button> - Crée un point d'accès API qui renvoie un JSON valide pour tester la communication.</p>
        </form>
        
        <?php
        // Traitement des actions
        if (isset($_POST['restore_htaccess'])) {
            // Contenu optimal pour .htaccess de l'API
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
            if (file_exists($api_htaccess)) {
                $backup_file = $api_htaccess . '.bak.' . time();
                copy($api_htaccess, $backup_file);
                echo "<p class='success'>Sauvegarde de l'ancien .htaccess créée: " . basename($backup_file) . "</p>";
            }
            
            // Écrire le nouveau .htaccess
            if (file_put_contents($api_htaccess, $optimal_htaccess)) {
                echo "<p class='success'>Le fichier .htaccess de l'API a été restauré avec succès.</p>";
            } else {
                echo "<p class='error'>Impossible d'écrire le nouveau .htaccess. Vérifiez les permissions.</p>";
            }
        }
        
        if (isset($_POST['check_php_execution'])) {
            // Créer un fichier de test d'exécution PHP
            $php_test_file = $api_root . '/php-execution-check.php';
            $php_test_content = <<<EOT
<?php
// Test d'exécution PHP simple
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Cache-Control: no-cache, no-store, must-revalidate");

echo json_encode([
    'status' => 'success',
    'message' => 'PHP s\'exécute correctement',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'server_info' => \$_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'
]);
?>
EOT;

            if (file_put_contents($php_test_file, $php_test_content)) {
                echo "<p class='success'>Fichier de test PHP créé: " . basename($php_test_file) . "</p>";
                echo "<p>Accédez à <a href='./php-execution-check.php' target='_blank'>ce lien</a> pour vérifier si PHP s'exécute correctement.</p>";
                echo "<p>Si vous voyez un JSON formaté, PHP fonctionne. Si vous voyez du code source PHP, il y a un problème de configuration.</p>";
            } else {
                echo "<p class='error'>Impossible de créer le fichier de test PHP. Vérifiez les permissions.</p>";
            }
        }
        
        if (isset($_POST['create_test_endpoint'])) {
            // Créer un endpoint JSON de test
            $json_test_file = $api_root . '/test-json-endpoint.php';
            $json_test_content = <<<EOT
<?php
// Point d'entrée JSON de test
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Vérifier si c'est une requête OPTIONS (preflight CORS)
if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Données de test
\$data = [
    'status' => 'success',
    'message' => 'API fonctionne correctement',
    'timestamp' => date('Y-m-d H:i:s'),
    'test_data' => [
        'name' => 'Test Item',
        'value' => rand(1, 1000),
        'active' => true
    ],
    'request_method' => \$_SERVER['REQUEST_METHOD'],
    'request_uri' => \$_SERVER['REQUEST_URI']
];

// Envoyer la réponse JSON
echo json_encode(\$data, JSON_PRETTY_PRINT);
?>
EOT;

            if (file_put_contents($json_test_file, $json_test_content)) {
                echo "<p class='success'>Point d'accès API de test créé: " . basename($json_test_file) . "</p>";
                echo "<p>Testez l'API avec: <a href='./test-json-endpoint.php' target='_blank'>ce lien</a></p>";
                echo "<p>Vous pouvez également tester avec fetch en JavaScript:</p>";
                echo "<pre>fetch('./api/test-json-endpoint.php')\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error('Erreur:', error));</pre>";
            } else {
                echo "<p class='error'>Impossible de créer le point d'accès API. Vérifiez les permissions.</p>";
            }
        }
        ?>
    </div>
    
    <div class="section">
        <h2>4. Recommandations pour résoudre les problèmes d'API</h2>
        <ol>
            <li>Vérifiez que les fichiers PHP sont correctement interprétés par le serveur</li>
            <li>Assurez-vous que les en-têtes CORS sont correctement configurés</li>
            <li>Testez si les requêtes API fonctionnent avec un endpoint simple comme celui créé ci-dessus</li>
            <li>Vérifiez les journaux d'erreur du serveur pour obtenir plus d'informations sur les problèmes</li>
            <li>Si tout le reste échoue, contactez votre hébergeur pour obtenir de l'aide concernant l'exécution PHP</li>
        </ol>
    </div>
    
    <p><a href="/">Retour à l'application</a></p>
</body>
</html>
