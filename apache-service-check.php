
<?php
// Assurez-vous qu'il n'y a aucun espace ou sortie avant cette ligne
ob_start(); // Démarrer la mise en tampon de sortie 
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic Apache 503 Service Unavailable</title>
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
    <h1>Diagnostic Apache 503 Service Unavailable</h1>
    
    <div class="section">
        <h2>Information du serveur</h2>
        <?php
        echo "<p>Date et heure: " . date('Y-m-d H:i:s') . "</p>";
        echo "<p>Version PHP: " . phpversion() . "</p>";
        echo "<p>Serveur: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible') . "</p>";
        echo "<p>Utilisateur PHP: " . (function_exists('posix_getpwuid') ? posix_getpwuid(posix_geteuid())['name'] : 'Fonction posix non disponible') . "</p>";
        ?>
    </div>
    
    <div class="section">
        <h2>Test de connectivité interne</h2>
        <?php
        // Tenter une requête locale avec différentes méthodes
        $localhost_url = "http://localhost/";
        
        // Méthode 1: file_get_contents
        echo "<h3>Test avec file_get_contents</h3>";
        $context = stream_context_create([
            'http' => [
                'timeout' => 5,
                'ignore_errors' => true
            ]
        ]);
        
        $response = @file_get_contents($localhost_url, false, $context);
        if ($response === false) {
            echo "<p class='error'>Échec de connexion à localhost via file_get_contents</p>";
            if (isset($http_response_header)) {
                echo "<pre>";
                print_r($http_response_header);
                echo "</pre>";
            }
        } else {
            echo "<p class='success'>Connexion réussie à localhost via file_get_contents</p>";
            echo "<p>Premiers 200 caractères de réponse: " . htmlspecialchars(substr($response, 0, 200)) . "...</p>";
        }
        
        // Méthode 2: cURL
        if (function_exists('curl_init')) {
            echo "<h3>Test avec cURL</h3>";
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $localhost_url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_HEADER, true);
            
            $response = curl_exec($ch);
            $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            
            echo "<p>Code HTTP: $httpcode</p>";
            if ($response === false) {
                echo "<p class='error'>Échec de connexion à localhost via cURL: $error</p>";
            } else {
                $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
                $header = substr($response, 0, $header_size);
                $body = substr($response, $header_size);
                
                echo "<p class='success'>Connexion réussie à localhost via cURL</p>";
                echo "<p>En-têtes:</p><pre>" . htmlspecialchars($header) . "</pre>";
                echo "<p>Premiers 200 caractères de réponse: " . htmlspecialchars(substr($body, 0, 200)) . "...</p>";
            }
            curl_close($ch);
        } else {
            echo "<p class='warning'>cURL non disponible sur ce serveur</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Vérification des services liés à Apache</h2>
        <?php
        // Vérifier les processus PHP-FPM
        $php_fpm_running = false;
        $php_processes = [];
        
        // Vérification par shell_exec si disponible et autorisé
        if (function_exists('shell_exec') && !in_array('shell_exec', array_map('trim', explode(',', ini_get('disable_functions'))))) {
            echo "<h3>Vérification des processus</h3>";
            
            // Rechercher les processus PHP-FPM
            $output = @shell_exec('ps aux | grep -E "php-fpm|apache|httpd" | grep -v grep');
            if ($output) {
                echo "<p class='success'>Processus trouvés:</p>";
                echo "<pre>" . htmlspecialchars($output) . "</pre>";
                
                if (stripos($output, 'php-fpm') !== false) {
                    $php_fpm_running = true;
                }
                
                // Extraire les lignes dans un tableau
                $php_processes = explode("\n", trim($output));
            } else {
                echo "<p class='error'>Impossible de vérifier les processus ou aucun processus trouvé</p>";
            }
        } else {
            echo "<p class='warning'>La fonction shell_exec est désactivée - impossible de vérifier les processus en cours d'exécution</p>";
        }
        
        // Vérifier les sockets Unix PHP-FPM
        if (function_exists('glob')) {
            $fpm_sockets = glob('/var/run/php*-fpm.sock');
            if (!empty($fpm_sockets)) {
                echo "<p class='success'>Sockets PHP-FPM trouvés:</p>";
                echo "<ul>";
                foreach ($fpm_sockets as $socket) {
                    echo "<li>" . htmlspecialchars($socket) . "</li>";
                }
                echo "</ul>";
            } else {
                echo "<p class='warning'>Aucun socket PHP-FPM trouvé dans /var/run/</p>";
            }
        }
        
        // Vérification des fichiers de configuration
        echo "<h3>Configuration Apache</h3>";
        
        // Vérifier .htaccess
        if (file_exists('.htaccess')) {
            echo "<p class='success'>.htaccess trouvé (" . filesize('.htaccess') . " octets)</p>";
        } else {
            echo "<p class='error'>.htaccess manquant</p>";
        }
        
        // Vérifier .user.ini
        if (file_exists('.user.ini')) {
            echo "<p class='success'>.user.ini trouvé (" . filesize('.user.ini') . " octets)</p>";
        } else {
            echo "<p class='warning'>.user.ini manquant - certaines configurations PHP pourraient être absentes</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Solutions possibles</h2>
        <form method="post" action="<?php echo htmlspecialchars($_SERVER['PHP_SELF']); ?>">
            <?php
            if (isset($_POST['fix_restart'])) {
                echo "<div style='background: #d4edda; padding: 10px; border-radius: 4px; margin-bottom: 15px;'>";
                echo "<p class='success'>Tentative de démarrage/redémarrage des services...</p>";
                
                if (function_exists('shell_exec') && !in_array('shell_exec', array_map('trim', explode(',', ini_get('disable_functions'))))) {
                    // Sur Infomaniak, les utilisateurs n'ont généralement pas les droits pour redémarrer les services
                    // mais nous pouvons afficher les instructions
                    echo "<p>Sur un hébergement partagé comme Infomaniak, vous n'avez généralement pas les droits pour redémarrer les services.</p>";
                    echo "<p>Contactez le support Infomaniak en mentionnant l'erreur 503 et en demandant de vérifier l'état de PHP-FPM et Apache pour votre hébergement.</p>";
                } else {
                    echo "<p>La fonction shell_exec est désactivée - impossible d'exécuter des commandes système.</p>";
                }
                
                echo "</div>";
            }
            
            if (isset($_POST['fix_htaccess'])) {
                echo "<div style='background: #d4edda; padding: 10px; border-radius: 4px; margin-bottom: 15px;'>";
                echo "<p class='success'>Réparation des fichiers de configuration...</p>";
                
                // Réparer .htaccess
                $htaccess_content = "# Activer le moteur de réécriture\nRewriteEngine On\n\n# Configuration PHP correcte\nAddHandler application/x-httpd-php .php\nAddType application/x-httpd-php .php\n<FilesMatch \"\\.php$\">\n    SetHandler application/x-httpd-php\n</FilesMatch>\n\n# Configuration des types MIME\nAddType text/css .css\nAddType application/javascript .js\nAddType application/javascript .mjs\nAddType image/svg+xml .svg\n\n# Force le type MIME pour CSS avec le charset UTF-8\n<FilesMatch \"\\.css$\">\n    ForceType text/css\n    Header set Content-Type \"text/css; charset=utf-8\"\n</FilesMatch>\n\n# Force le type MIME pour JavaScript avec le charset UTF-8\n<FilesMatch \"\\.js$\">\n    ForceType application/javascript\n    Header set Content-Type \"application/javascript; charset=utf-8\"\n</FilesMatch>\n\n# Rediriger toutes les requêtes vers index.html sauf les fichiers physiques, dossiers ou API\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^(?!api/)(.*)$ /index.html [L]\n\n# Désactiver l'indexation des répertoires\nOptions -Indexes\n\n# Protection contre le MIME-sniffing\n<IfModule mod_headers.c>\n    Header set X-Content-Type-Options \"nosniff\"\n</IfModule>";
                
                $user_ini_content = "; Configuration PHP pour Infomaniak\ndisplay_errors = On\nlog_errors = On\nerror_log = /tmp/php_errors.log\nerror_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT\nmax_execution_time = 120\nmemory_limit = 256M\nupload_max_filesize = 64M\npost_max_size = 64M\ndefault_charset = \"UTF-8\"";
                
                $success = true;
                
                if (file_put_contents('.htaccess', $htaccess_content) === false) {
                    echo "<p class='error'>Impossible d'écrire le fichier .htaccess</p>";
                    $success = false;
                } else {
                    echo "<p class='success'>Fichier .htaccess réparé avec succès</p>";
                }
                
                if (file_put_contents('.user.ini', $user_ini_content) === false) {
                    echo "<p class='error'>Impossible d'écrire le fichier .user.ini</p>";
                    $success = false;
                } else {
                    echo "<p class='success'>Fichier .user.ini réparé avec succès</p>";
                }
                
                if ($success) {
                    echo "<p>Les fichiers de configuration ont été réparés. Veuillez attendre quelques minutes pour que les modifications prennent effet, puis rechargez la page.</p>";
                }
                
                echo "</div>";
            }
            
            if (isset($_POST['create_info'])) {
                echo "<div style='background: #d4edda; padding: 10px; border-radius: 4px; margin-bottom: 15px;'>";
                echo "<p class='success'>Création des fichiers de diagnostic...</p>";
                
                $php_minimal_content = "<?php\nheader('Content-Type: text/plain');\necho \"PHP FONCTIONNE!\";\n?>";
                $phpinfo_content = "<?php\nphpinfo();\n?>";
                
                if (file_put_contents('php-minimal-test.php', $php_minimal_content) === false) {
                    echo "<p class='error'>Impossible de créer le fichier php-minimal-test.php</p>";
                } else {
                    echo "<p class='success'>Fichier php-minimal-test.php créé avec succès</p>";
                    echo "<p>Testez-le ici: <a href='php-minimal-test.php' target='_blank'>php-minimal-test.php</a></p>";
                }
                
                if (file_put_contents('apache-info.php', $phpinfo_content) === false) {
                    echo "<p class='error'>Impossible de créer le fichier apache-info.php</p>";
                } else {
                    echo "<p class='success'>Fichier apache-info.php créé avec succès</p>";
                    echo "<p>Testez-le ici: <a href='apache-info.php' target='_blank'>apache-info.php</a></p>";
                }
                
                echo "</div>";
            }
            ?>
            
            <p>Choisissez une action pour tenter de résoudre l'erreur 503:</p>
            <button type="submit" name="fix_htaccess" class="fix-btn">Réparer les fichiers de configuration (.htaccess et .user.ini)</button><br>
            <button type="submit" name="create_info" class="fix-btn">Créer des fichiers de diagnostic PHP</button><br>
            <button type="submit" name="fix_restart" class="fix-btn">Tenter un redémarrage des services (requiert des privilèges)</button>
        </form>
        
        <h3>Recommandations supplémentaires</h3>
        <ol>
            <li>Contactez le support Infomaniak en mentionnant l'erreur 503 Service Unavailable que vous rencontrez</li>
            <li>Demandez une vérification du service PHP-FPM pour votre hébergement</li>
            <li>Vérifiez si votre site n'a pas dépassé les limites de ressources allouées (CPU, mémoire, etc.)</li>
            <li>Consultez les logs d'erreur dans votre espace d'hébergement Infomaniak</li>
        </ol>
    </div>
    
    <footer>
        <p>Script de diagnostic généré le <?php echo date('Y-m-d H:i:s'); ?></p>
        <p><small>Ce script est fourni uniquement à des fins de diagnostic. Les solutions proposées peuvent nécessiter des droits administrateur que vous n'avez pas sur un hébergement mutualisé.</small></p>
    </footer>
</body>
</html>
