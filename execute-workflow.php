
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Exécuter le workflow de déploiement</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 4px solid green; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 4px solid red; }
        .warning { color: orange; background-color: #fffaf0; padding: 10px; border-left: 4px solid orange; }
        button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Exécution manuelle du workflow de déploiement</h1>
        
        <div class="card">
            <h2>État du fichier de workflow</h2>
            <?php
            $workflow_file = './deploy-unified.yml';
            
            if (file_exists($workflow_file)) {
                echo "<div class='success'>Le fichier de workflow a été trouvé à la racine.</div>";
                echo "<p>Dernière modification: " . date("Y-m-d H:i:s", filemtime($workflow_file)) . "</p>";
                echo "<p>Taille: " . filesize($workflow_file) . " octets</p>";
            } else {
                echo "<div class='error'>Le fichier de workflow n'existe pas à la racine.</div>";
                echo "<p>Assurez-vous que le fichier deploy-unified.yml est présent à la racine du site.</p>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Exécuter les actions du workflow</h2>
            <p>Ce bouton permet d'exécuter manuellement les actions définies dans le workflow:</p>
            
            <?php
            if (isset($_POST['run_workflow'])) {
                echo "<div class='warning'>Tentative d'exécution du workflow...</div>";
                echo "<pre>";
                
                // Créer les dossiers de déploiement
                echo "Création des dossiers de déploiement...\n";
                @mkdir('deploy/assets', 0755, true);
                @mkdir('deploy/api/config', 0755, true);
                @mkdir('deploy/api/controllers', 0755, true);
                @mkdir('deploy/api/models', 0755, true);
                @mkdir('deploy/api/middleware', 0755, true);
                @mkdir('deploy/api/operations', 0755, true);
                @mkdir('deploy/api/utils', 0755, true);
                @mkdir('deploy/api/services', 0755, true);
                @mkdir('deploy/api/documentation', 0755, true);
                @mkdir('deploy/public/lovable-uploads', 0755, true);
                
                // Copier dossier dist s'il existe
                if (is_dir('dist')) {
                    echo "Copie du dossier dist...\n";
                    @mkdir('deploy/dist', 0755, true);
                    
                    // Fonction récursive pour copier le contenu
                    function copy_directory($src, $dst) {
                        $dir = opendir($src);
                        @mkdir($dst);
                        while(($file = readdir($dir)) !== false) {
                            if (($file != '.') && ($file != '..')) {
                                if (is_dir($src . '/' . $file)) {
                                    copy_directory($src . '/' . $file, $dst . '/' . $file);
                                } else {
                                    copy($src . '/' . $file, $dst . '/' . $file);
                                    echo "Copié: " . $file . "\n";
                                }
                            }
                        }
                        closedir($dir);
                    }
                    
                    copy_directory('dist', 'deploy/dist');
                    echo "✅ Dossier dist copié\n";
                } else {
                    echo "❌ Dossier dist non trouvé\n";
                }
                
                // Copier les fichiers PHP
                echo "\nCopie des fichiers PHP...\n";
                if (is_dir('api')) {
                    function find_php_files($dir, $base_dir = '') {
                        $result = [];
                        $files = scandir($dir);
                        foreach ($files as $file) {
                            if ($file == '.' || $file == '..') continue;
                            $path = $dir . '/' . $file;
                            $rel_path = $base_dir ? $base_dir . '/' . $file : $file;
                            if (is_dir($path)) {
                                $result = array_merge($result, find_php_files($path, $rel_path));
                            } elseif (pathinfo($file, PATHINFO_EXTENSION) == 'php') {
                                $result[] = $rel_path;
                            }
                        }
                        return $result;
                    }
                    
                    $php_files = find_php_files('api');
                    foreach ($php_files as $file) {
                        $dir = dirname('deploy/api/' . $file);
                        if (!is_dir($dir)) {
                            @mkdir($dir, 0755, true);
                        }
                        if (copy('api/' . $file, 'deploy/api/' . $file)) {
                            echo "Copié: api/$file\n";
                        } else {
                            echo "ÉCHEC: api/$file\n";
                        }
                    }
                    echo "✅ Fichiers PHP copiés\n";
                } else {
                    echo "❌ Dossier API non trouvé\n";
                }
                
                // Créer les fichiers .htaccess nécessaires
                echo "\nCréation des fichiers .htaccess...\n";
                
                $htaccess_content = "# Activer le module de réécriture d'URL\nRewriteEngine On\n\n# Définir les types MIME corrects\nAddType application/javascript .js\nAddType application/javascript .mjs\nAddType text/css .css\nAddType application/json .json\n\n# Gérer le routage SPA - toutes les routes non-fichiers vers index.html\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^(.*)$ index.html [L,QSA]\n";
                
                file_put_contents('deploy/.htaccess', $htaccess_content);
                echo "✅ .htaccess créé pour deploy/\n";
                
                $api_htaccess_content = "# Activer la réécriture d'URL\nRewriteEngine On\n\n# Définir les types MIME corrects\nAddType application/javascript .js\nAddType application/javascript .mjs\nAddType application/javascript .es.js\nAddType text/css .css\nAddType application/json .json\n\n# Configuration CORS et types MIME\n<IfModule mod_headers.c>\n    Header set Access-Control-Allow-Origin \"*\"\n    Header set Access-Control-Allow-Methods \"GET, POST, OPTIONS, PUT, DELETE\"\n    Header set Access-Control-Allow-Headers \"Content-Type, Authorization, X-Requested-With\"\n</IfModule>\n\n# Rediriger toutes les requêtes vers l'index.php sauf pour les fichiers existants\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^(.*)$ index.php [QSA,L]\n";
                
                file_put_contents('deploy/api/.htaccess', $api_htaccess_content);
                echo "✅ .htaccess créé pour deploy/api/\n";
                
                $dist_htaccess_content = "# Activer le module de réécriture d'URL\nRewriteEngine On\n\n# Définir les types MIME corrects pour les fichiers dans ce dossier\nAddType application/javascript .js\nAddType application/javascript .mjs\nAddType text/css .css\nAddType application/json .json\n\n# Force les types MIME corrects\n<FilesMatch \"\\.js$\">\n    ForceType application/javascript\n    Header set Content-Type \"application/javascript; charset=utf-8\"\n</FilesMatch>\n\n<FilesMatch \"\\.css$\">\n    ForceType text/css\n    Header set Content-Type \"text/css; charset=utf-8\"\n</FilesMatch>\n";
                
                file_put_contents('deploy/dist/.htaccess', $dist_htaccess_content);
                echo "✅ .htaccess créé pour deploy/dist/\n";
                
                // Création de env.php
                echo "\nCréation du fichier env.php...\n";
                $env_content = "<?php\n// Configuration des variables d'environnement pour Infomaniak\ndefine(\"DB_HOST\", \"p71x6d.myd.infomaniak.com\");\ndefine(\"DB_NAME\", \"p71x6d_richard\");\ndefine(\"DB_USER\", \"p71x6d_richard\");\ndefine(\"DB_PASS\", \"Trottinette43!\");\ndefine(\"API_BASE_URL\", \"/api\");\ndefine(\"APP_ENV\", \"production\");\n\n// Fonction d'aide pour récupérer les variables d'environnement\nfunction get_env(\$key, \$default = null) {\n    \$const_name = strtoupper(\$key);\n    if (defined(\$const_name)) {\n        return constant(\$const_name);\n    }\n    return \$default;\n}\n?>";
                
                file_put_contents('deploy/api/config/env.php', $env_content);
                echo "✅ env.php créé\n";
                
                // Configuration db_config.json
                echo "\nCréation du fichier db_config.json...\n";
                $db_config_content = "{\n    \"host\": \"p71x6d.myd.infomaniak.com\",\n    \"db_name\": \"p71x6d_richard\",\n    \"username\": \"p71x6d_richard\",\n    \"password\": \"Trottinette43!\"\n}";
                
                file_put_contents('deploy/api/config/db_config.json', $db_config_content);
                echo "✅ db_config.json créé\n";
                
                // Vérification des fichiers CSS
                echo "\n=== Vérification des fichiers CSS ===\n";
                $css_count = 0;
                
                function find_css_files($dir) {
                    $result = [];
                    $files = scandir($dir);
                    foreach ($files as $file) {
                        if ($file == '.' || $file == '..') continue;
                        $path = $dir . '/' . $file;
                        if (is_dir($path)) {
                            $result = array_merge($result, find_css_files($path));
                        } elseif (pathinfo($file, PATHINFO_EXTENSION) == 'css') {
                            $result[] = $path;
                        }
                    }
                    return $result;
                }
                
                if (is_dir('deploy/dist')) {
                    $css_files = find_css_files('deploy/dist');
                    $css_count = count($css_files);
                    
                    echo "Nombre de fichiers CSS dans deploy/dist: " . $css_count . "\n";
                    if ($css_count > 0) {
                        echo "✅ Fichiers CSS trouvés:\n";
                        foreach (array_slice($css_files, 0, 3) as $css_file) {
                            echo "- " . str_replace('deploy/dist/', '', $css_file) . "\n";
                        }
                        if ($css_count > 3) echo "...et " . ($css_count - 3) . " autres\n";
                    } else {
                        echo "❌ ERREUR: Aucun fichier CSS trouvé dans deploy/dist\n";
                    }
                } else {
                    echo "❌ ERREUR: Le dossier deploy/dist n'existe pas\n";
                }
                
                // Modifier les permissions
                echo "\nConfiguration des permissions...\n";
                exec("find deploy -type d -exec chmod 755 {} \\;");
                exec("find deploy -type f -exec chmod 644 {} \\;");
                echo "✅ Permissions configurées\n";
                
                echo "</pre>";
                
                if ($css_count > 0) {
                    echo "<div class='success'>Workflow exécuté avec succès! Vous pouvez maintenant transférer le contenu du dossier 'deploy' vers votre serveur.</div>";
                } else {
                    echo "<div class='warning'>Le workflow s'est exécuté, mais aucun fichier CSS n'a été trouvé. Assurez-vous que le build a été généré correctement.</div>";
                }
            }
            ?>
            
            <form method="post">
                <button type="submit" name="run_workflow">Exécuter le workflow maintenant</button>
            </form>
            
            <p style="margin-top: 20px;"><strong>Note:</strong> Cette opération simule l'exécution du workflow GitHub Actions localement. Si vous avez des problèmes, vous devrez peut-être ajuster le contenu des fichiers manuellement.</p>
        </div>
        
        <div class="card">
            <h2>Étapes suivantes</h2>
            <ol>
                <li>Exécutez le workflow en cliquant sur le bouton ci-dessus</li>
                <li>Vérifiez que le dossier "deploy" a été correctement créé avec tous les fichiers nécessaires</li>
                <li>Transférez manuellement le contenu du dossier "deploy" vers votre serveur (par FTP/SFTP)</li>
                <li>Vérifiez que votre application fonctionne correctement sur le serveur</li>
            </ol>
        </div>
    </div>
</body>
</html>
