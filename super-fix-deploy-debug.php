
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Débogage de super-fix-deploy</title>
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
    <h1>Débogage de super-fix-deploy.php</h1>
    
    <div class="section">
        <h2>Vérification du script super-fix-deploy.php</h2>
        <?php
        $script_path = 'api/super-fix-deploy.php';
        $script_exists = file_exists($script_path);
        $script_content = $script_exists ? file_get_contents($script_path) : '';
        ?>
        <p>Le script super-fix-deploy.php: <?php echo $script_exists ? '<span class="success">existe</span>' : '<span class="error">n\'existe pas</span>'; ?></p>
        
        <?php if ($script_exists): ?>
            <p>Analyse du script:</p>
            <?php
            $script_md5 = md5($script_content);
            $script_size = strlen($script_content);
            $script_lines = count(explode("\n", $script_content));
            $contains_htaccess = strpos($script_content, '.htaccess') !== false;
            $contains_php_ini = strpos($script_content, 'php.ini') !== false;
            $contains_file_put = strpos($script_content, 'file_put_contents') !== false;
            $contains_chmod = strpos($script_content, 'chmod') !== false;
            ?>
            <ul>
                <li>Taille: <?php echo $script_size; ?> octets</li>
                <li>Nombre de lignes: <?php echo $script_lines; ?></li>
                <li>Empreinte MD5: <?php echo $script_md5; ?></li>
                <li>Manipule .htaccess: <?php echo $contains_htaccess ? '<span class="warning">Oui</span>' : 'Non'; ?></li>
                <li>Manipule php.ini: <?php echo $contains_php_ini ? '<span class="warning">Oui</span>' : 'Non'; ?></li>
                <li>Écrit des fichiers: <?php echo $contains_file_put ? '<span class="warning">Oui</span>' : 'Non'; ?></li>
                <li>Change les permissions: <?php echo $contains_chmod ? '<span class="warning">Oui</span>' : 'Non'; ?></li>
            </ul>
            
            <h3>Aperçu du contenu (premières lignes):</h3>
            <pre><?php echo htmlentities(substr($script_content, 0, 500)); ?>...</pre>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>Points d'entrée API importants</h2>
        <p>Vérifions l'état des points d'entrée API cruciaux:</p>
        <?php
        $api_files = [
            'api/index.php' => 'Point d\'entrée principal de l\'API',
            'api/config.php' => 'Configuration de l\'API',
            'api/users.php' => 'API Utilisateurs',
            'api/auth.php' => 'API Authentification'
        ];
        
        foreach ($api_files as $file => $description): 
            $exists = file_exists($file);
            $executable = $exists && (strpos(mime_content_type($file), 'text') !== false || strpos(mime_content_type($file), 'php') !== false);
        ?>
            <div>
                <h3><?php echo htmlentities($description); ?> (<?php echo htmlentities($file); ?>)</h3>
                <p>État: <?php echo $exists ? '<span class="success">Existe</span>' : '<span class="error">Manquant</span>'; ?></p>
                <?php if ($exists): ?>
                    <p>Exécutable: <?php echo $executable ? '<span class="success">Oui</span>' : '<span class="error">Non</span>'; ?></p>
                <?php endif; ?>
            </div>
        <?php endforeach; ?>
    </div>
    
    <div class="section">
        <h2>Actions correctives</h2>
        <form method="post" action="">
            <p><button type="submit" name="restore_api">Restaurer les fichiers API essentiels</button> - Réinitialise les points d'entrée API principaux.</p>
            <p><button type="submit" name="test_cors">Tester la configuration CORS</button> - Vérifie si les en-têtes CORS sont correctement configurés.</p>
            <p><button type="submit" name="regenerate_htaccess">Régénérer les fichiers .htaccess</button> - Crée de nouveaux fichiers .htaccess optimisés.</p>
        </form>
        
        <?php
        // Traitement des actions correctives
        if (isset($_POST['restore_api'])) {
            echo "<h3>Restauration des fichiers API essentiels:</h3>";
            
            // Restaurer api/index.php
            $api_index_content = <<<EOT
<?php
// Point d'entrée principal de l'API
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Pour les requêtes OPTIONS (préflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Réponse par défaut
echo json_encode([
    'status' => 'success',
    'message' => 'API fonctionne correctement',
    'timestamp' => date('Y-m-d H:i:s'),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
]);
?>
EOT;
            
            if (file_put_contents('api/index.php', $api_index_content)) {
                echo "<p class='success'>api/index.php restauré avec succès.</p>";
            } else {
                echo "<p class='error'>Échec de la restauration de api/index.php.</p>";
            }
        }
        
        if (isset($_POST['test_cors'])) {
            echo "<h3>Test de la configuration CORS:</h3>";
            
            $cors_test_file = 'api/cors-test.php';
            $cors_test_content = <<<EOT
<?php
// Test des en-têtes CORS
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: "*");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Pour les requêtes OPTIONS (préflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Liste les en-têtes HTTP qui ont été envoyés
$headers = [];
foreach (getallheaders() as $name => $value) {
    $headers[$name] = $value;
}

echo json_encode([
    'status' => 'success',
    'message' => 'Test CORS',
    'headers_sent' => headers_list(),
    'headers_received' => $headers,
    'method' => $_SERVER['REQUEST_METHOD'],
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
EOT;
            
            if (file_put_contents($cors_test_file, $cors_test_content)) {
                echo "<p class='success'>Fichier de test CORS créé: $cors_test_file</p>";
                echo "<p>Testez avec: <a href='/$cors_test_file' target='_blank'>ce lien</a></p>";
            } else {
                echo "<p class='error'>Impossible de créer le fichier de test CORS.</p>";
            }
        }
        
        if (isset($_POST['regenerate_htaccess'])) {
            echo "<h3>Régénération des fichiers .htaccess:</h3>";
            
            // Contenu pour .htaccess racine
            $root_htaccess = <<<EOT
# Activer le moteur de réécriture
RewriteEngine On

# Configuration de base
Options -MultiViews
Options +FollowSymLinks

# Définir le point d'entrée principal
DirectoryIndex index.html index.php

# Forcer l'exécution des fichiers PHP - IMPORTANT
AddHandler application/x-httpd-php .php
<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

# Permettre l'accès direct aux ressources statiques
RewriteCond %{REQUEST_URI} \.(js|mjs|css|png|jpe?g|gif|svg|ico|webp|woff2?|ttf|eot|map|tsx?|json)$
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# Traitement spécial pour les fichiers PHP - s'assurer qu'ils sont exécutés
RewriteCond %{REQUEST_FILENAME} -f
RewriteCond %{REQUEST_URI} \.php$
RewriteRule ^ - [L]

# Redirection du dossier /api vers les scripts PHP
RewriteRule ^api/(.*)$ api/$1 [QSA,L]

# IMPORTANT: Prévention des boucles de redirection
# Pour les requêtes qui ne correspondent pas à des fichiers réels
RewriteCond %{REQUEST_FILENAME} !-f
# Pour les requêtes qui ne correspondent pas à des répertoires réels
RewriteCond %{REQUEST_FILENAME} !-d
# Et qui ne commencent pas par /api
RewriteCond %{REQUEST_URI} !^/api/
# Rediriger vers index.html UNIQUEMENT si nous n'avons pas déjà été redirigés
RewriteCond %{ENV:REDIRECT_STATUS} ^$
RewriteRule ^(.*)$ index.html [QSA,L]

# Configuration CORS simplifiée
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>

# Gestion des erreurs personnalisée
ErrorDocument 404 /index.html
EOT;
            
            // Contenu pour .htaccess API
            $api_htaccess = <<<EOT
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
            
            // Sauvegarde des anciens .htaccess
            if (file_exists('.htaccess')) {
                copy('.htaccess', '.htaccess.bak.' . time());
            }
            
            if (file_exists('api/.htaccess')) {
                copy('api/.htaccess', 'api/.htaccess.bak.' . time());
            }
            
            // Écriture des nouveaux .htaccess
            $root_success = file_put_contents('.htaccess', $root_htaccess) !== false;
            $api_success = file_put_contents('api/.htaccess', $api_htaccess) !== false;
            
            echo "<p>Régénération du .htaccess racine: " . ($root_success ? '<span class="success">Réussi</span>' : '<span class="error">Échec</span>') . "</p>";
            echo "<p>Régénération du .htaccess API: " . ($api_success ? '<span class="success">Réussi</span>' : '<span class="error">Échec</span>') . "</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Accès aux outils de diagnostic</h2>
        <ul>
            <li><a href="/api/restore-api-functionality.php">Restauration de la fonctionnalité API</a></li>
            <li><a href="/api/reset-api-configuration.php">Réinitialisation de la configuration API</a></li>
            <li><a href="/api/simple-api-test.php">Test API simple</a></li>
        </ul>
    </div>
</body>
</html>
