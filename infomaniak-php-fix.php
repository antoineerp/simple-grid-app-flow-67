
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Configuration PHP Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .card { border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 20px; }
        .button { 
            background-color: #4CAF50; 
            color: white; 
            padding: 10px 15px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            text-decoration: none;
            display: inline-block;
            margin: 5px;
        }
    </style>
</head>
<body>
    <h1>Configuration PHP pour Infomaniak</h1>
    
    <?php
    $files_to_create = [
        '.htaccess' => [
            'content' => "# Activer le moteur de réécriture\nRewriteEngine On\n\n# Configuration PHP correcte\nAddHandler application/x-httpd-php .php\nAddType application/x-httpd-php .php\n<FilesMatch \"\.php$\">\n    SetHandler application/x-httpd-php\n</FilesMatch>\n\n# Configuration des types MIME\nAddType text/css .css\nAddType application/javascript .js\nAddType application/javascript .mjs\nAddType image/svg+xml .svg\n\n# Force le type MIME pour CSS avec le charset UTF-8\n<FilesMatch \"\.css$\">\n    ForceType text/css\n    Header set Content-Type \"text/css; charset=utf-8\"\n</FilesMatch>\n\n# Force le type MIME pour JavaScript avec le charset UTF-8\n<FilesMatch \"\.js$\">\n    ForceType application/javascript\n    Header set Content-Type \"application/javascript; charset=utf-8\"\n</FilesMatch>\n\n# Rediriger toutes les requêtes vers index.html sauf les fichiers physiques, dossiers ou API\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^(?!api/)(.*)$ /index.html [L]\n\n# Désactiver l'indexation des répertoires\nOptions -Indexes\n\n# Protection contre le MIME-sniffing\n<IfModule mod_headers.c>\n    Header set X-Content-Type-Options \"nosniff\"\n</IfModule>",
            'description' => 'Configuration Apache principale'
        ],
        '.user.ini' => [
            'content' => "; Configuration PHP pour Infomaniak\ndisplay_errors = On\nlog_errors = On\nerror_log = /tmp/php_errors.log\nerror_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT\nmax_execution_time = 120\nmemory_limit = 256M\nupload_max_filesize = 64M\npost_max_size = 64M\ndefault_charset = \"UTF-8\"",
            'description' => 'Configuration PHP utilisateur'
        ],
        'api/.htaccess' => [
            'content' => "# Configuration pour le dossier API sur Infomaniak\n\n# Forcer PHP pour tous les fichiers .php\nAddHandler application/x-httpd-php .php\nAddType application/x-httpd-php .php\n\n# Activer la réécriture d'URL\nRewriteEngine On\n\n# Définir les types MIME corrects\nAddType application/javascript .js\nAddType application/json .json\nAddType text/css .css\n\n# Gérer les requêtes OPTIONS pour CORS\nRewriteCond %{REQUEST_METHOD} OPTIONS\nRewriteRule ^(.*)$ $1 [R=200,L]\n\n# Configuration CORS et types MIME\n<IfModule mod_headers.c>\n    # Force le bon type MIME pour les JavaScript\n    <FilesMatch \"\.js$\">\n        Header set Content-Type \"application/javascript\"\n        Header set X-Content-Type-Options \"nosniff\"\n    </FilesMatch>\n    \n    # Configuration CORS\n    Header set Access-Control-Allow-Origin \"*\"\n    Header set Access-Control-Allow-Methods \"GET, POST, OPTIONS, PUT, DELETE\"\n    Header set Access-Control-Allow-Headers \"Content-Type, Authorization, X-Requested-With\"\n    \n    # Éviter la mise en cache des réponses API\n    Header set Cache-Control \"no-cache, no-store, must-revalidate\"\n    Header set Pragma \"no-cache\"\n    Header set Expires 0\n</IfModule>",
            'description' => 'Configuration API'
        ],
        'assets/.htaccess' => [
            'content' => "# Configuration des types MIME pour les assets\nAddType text/css .css\nAddType application/javascript .js\nAddType application/javascript .mjs\nAddType image/svg+xml .svg\nAddType font/ttf .ttf\nAddType font/woff .woff\nAddType font/woff2 .woff2\n\n# Force le type MIME pour CSS\n<FilesMatch \"\.css$\">\n    ForceType text/css\n    Header set Content-Type \"text/css; charset=utf-8\"\n</FilesMatch>\n\n# Force le type MIME pour JavaScript\n<FilesMatch \"\.js$\">\n    ForceType application/javascript\n    Header set Content-Type \"application/javascript; charset=utf-8\"\n</FilesMatch>\n\n# En-têtes de cache pour les assets\n<IfModule mod_expires.c>\n  ExpiresActive On\n  ExpiresByType text/css \"access plus 1 week\"\n  ExpiresByType application/javascript \"access plus 1 week\"\n  ExpiresByType image/svg+xml \"access plus 1 month\"\n  ExpiresByType font/ttf \"access plus 1 month\"\n  ExpiresByType font/woff \"access plus 1 month\"\n  ExpiresByType font/woff2 \"access plus 1 month\"\n</IfModule>",
            'description' => 'Configuration des assets'
        ],
        'index.php' => [
            'content' => "<?php\n// Redirection vers index.html\nheader('Location: index.html');\nexit;\n?>",
            'description' => 'Redirection vers index.html'
        ],
        'phpinfo.php' => [
            'content' => "<?php\n// Afficher les informations sur PHP\nphpinfo();\n?>",
            'description' => 'Informations PHP'
        ],
        'api/phpinfo.php' => [
            'content' => "<?php\n// Afficher les informations sur PHP pour le dossier API\nphpinfo();\n?>",
            'description' => 'Informations PHP pour API'
        ],
        'php-test-minimal.php' => [
            'content' => "<?php\n// Test PHP minimal pour confirmer l'exécution du moteur PHP\nheader('Content-Type: text/plain');\necho \"PHP FONCTIONNE CORRECTEMENT!\";\n?>",
            'description' => 'Test PHP minimal'
        ]
    ];
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['create_files'])) {
        echo "<div class='card'>";
        echo "<h2>Résultats de la création des fichiers</h2>";
        
        // Créer les dossiers nécessaires
        if (!is_dir('api')) {
            if (mkdir('api', 0755)) {
                echo "<p class='success'>✓ Dossier api créé</p>";
            } else {
                echo "<p class='error'>✗ Impossible de créer le dossier api</p>";
            }
        }
        
        if (!is_dir('assets')) {
            if (mkdir('assets', 0755)) {
                echo "<p class='success'>✓ Dossier assets créé</p>";
            } else {
                echo "<p class='error'>✗ Impossible de créer le dossier assets</p>";
            }
        }
        
        // Créer les fichiers
        foreach ($files_to_create as $file => $data) {
            $dir = dirname($file);
            if ($dir != '.' && !is_dir($dir)) {
                if (!mkdir($dir, 0755, true)) {
                    echo "<p class='error'>✗ Impossible de créer le dossier $dir</p>";
                    continue;
                }
            }
            
            if (file_put_contents($file, $data['content'])) {
                chmod($file, 0644);
                echo "<p class='success'>✓ Fichier $file créé</p>";
            } else {
                echo "<p class='error'>✗ Impossible de créer le fichier $file</p>";
            }
        }
        
        echo "</div>";
    }
    ?>
    
    <div class="card">
        <h2>Créer tous les fichiers de configuration</h2>
        <p>Cliquez sur le bouton ci-dessous pour créer tous les fichiers de configuration nécessaires au bon fonctionnement de PHP sur Infomaniak:</p>
        <form method="post">
            <button type="submit" name="create_files" class="button">Créer tous les fichiers</button>
        </form>
    </div>
    
    <div class="card">
        <h2>Fichiers à créer</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f2f2f2;">
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Fichier</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Description</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Statut</th>
            </tr>
            <?php foreach ($files_to_create as $file => $data): ?>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><?php echo $file; ?></td>
                    <td style="padding: 8px; border: 1px solid #ddd;"><?php echo $data['description']; ?></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">
                        <?php if (file_exists($file)): ?>
                            <span class="success">Présent</span>
                        <?php else: ?>
                            <span class="error">Manquant</span>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
        </table>
    </div>
    
    <p><a href="deploy-on-infomaniak.php" class="button">Retour à la page de déploiement</a></p>
</body>
</html>
