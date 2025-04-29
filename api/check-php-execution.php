
<?php
// Script de diagnostic pour l'exécution PHP
// Ce script est conçu pour être accessible directement via le navigateur

header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic d'exécution PHP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; background: #f8f8f8; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 4px; }
        .fix-section { margin-top: 10px; padding: 10px; border: 1px dashed #aaa; }
    </style>
</head>
<body>
    <h1>Diagnostic d'exécution PHP</h1>
    
    <div class="section">
        <h2>1. Vérification de l'exécution PHP</h2>
        
        <?php if(function_exists('phpversion')): ?>
            <p><span class="success">✅ PHP est correctement exécuté dans ce fichier!</span></p>
            <p>Version PHP: <?php echo phpversion(); ?></p>
            <p>SAPI: <?php echo php_sapi_name(); ?></p>
            <p>Serveur: <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'; ?></p>
        <?php else: ?>
            <p><span class="error">❌ PHP n'est pas exécuté. Ce message ne devrait jamais apparaître si PHP fonctionnait.</span></p>
        <?php endif; ?>
    </div>

    <div class="section">
        <h2>2. Vérification des fichiers de configuration</h2>
        
        <h3>Fichiers .htaccess</h3>
        <table>
            <tr><th>Fichier</th><th>Présent</th><th>Contenu correct</th><th>Permissions</th></tr>
            <?php
            $htaccess_files = [
                '../.htaccess' => 'Racine',
                './.htaccess' => 'API',
                '../assets/.htaccess' => 'Assets',
                '../public/.htaccess' => 'Public'
            ];
            
            foreach ($htaccess_files as $file => $location) {
                $exists = file_exists($file);
                $readable = $exists && is_readable($file);
                $content = $readable ? file_get_contents($file) : '';
                
                $has_php_handler = strpos($content, 'SetHandler application/x-httpd-php') !== false;
                $has_engine = strpos($content, 'php_flag engine on') !== false;
                $correct_content = $has_php_handler || $has_engine;
                
                $perms = $exists ? substr(sprintf('%o', fileperms($file)), -4) : 'N/A';
                
                echo "<tr>";
                echo "<td>$location</td>";
                echo "<td>" . ($exists ? '<span class="success">Oui</span>' : '<span class="error">Non</span>') . "</td>";
                echo "<td>" . ($correct_content ? '<span class="success">Oui</span>' : '<span class="warning">Non ou partiel</span>') . "</td>";
                echo "<td>$perms</td>";
                echo "</tr>";
            }
            ?>
        </table>
        
        <h3>Fichiers .user.ini</h3>
        <table>
            <tr><th>Fichier</th><th>Présent</th><th>Contenu correct</th><th>Permissions</th></tr>
            <?php
            $user_ini_files = [
                '../.user.ini' => 'Racine',
                './.user.ini' => 'API'
            ];
            
            foreach ($user_ini_files as $file => $location) {
                $exists = file_exists($file);
                $readable = $exists && is_readable($file);
                $content = $readable ? file_get_contents($file) : '';
                
                $has_engine = strpos($content, 'engine = On') !== false;
                
                $perms = $exists ? substr(sprintf('%o', fileperms($file)), -4) : 'N/A';
                
                echo "<tr>";
                echo "<td>$location</td>";
                echo "<td>" . ($exists ? '<span class="success">Oui</span>' : '<span class="error">Non</span>') . "</td>";
                echo "<td>" . ($has_engine ? '<span class="success">Oui</span>' : '<span class="warning">Non ou partiel</span>') . "</td>";
                echo "<td>$perms</td>";
                echo "</tr>";
            }
            ?>
        </table>
    </div>
    
    <div class="section">
        <h2>3. Tests d'exécution des fichiers PHP</h2>
        
        <table>
            <tr><th>Fichier</th><th>URL</th><th>Présent</th><th>Taille</th><th>Lien direct</th></tr>
            <?php
            $php_test_files = [
                'index.php' => 'Point d\'entrée API',
                'info.php' => 'Informations JSON',
                'test.php' => 'Test simple',
                'check-php.php' => 'Vérification PHP'
            ];
            
            foreach ($php_test_files as $file => $desc) {
                $file_path = './' . $file;
                $exists = file_exists($file_path);
                $size = $exists ? filesize($file_path) : 0;
                $url = '/api/' . $file;
                
                echo "<tr>";
                echo "<td>$desc</td>";
                echo "<td>$url</td>";
                echo "<td>" . ($exists ? '<span class="success">Oui</span>' : '<span class="error">Non</span>') . "</td>";
                echo "<td>" . ($size > 0 ? $size . ' octets' : 'N/A') . "</td>";
                echo "<td><a href='$url' target='_blank'>Tester</a></td>";
                echo "</tr>";
            }
            ?>
        </table>
        
        <h3>Test d'appel interne</h3>
        <?php
        if (function_exists('curl_init')):
            $local_url = 'http://' . $_SERVER['HTTP_HOST'] . '/api/info.php';
            $ch = curl_init($local_url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_HEADER, true);
            $response = curl_exec($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            echo "<p>Test d'appel à <code>$local_url</code>: ";
            if ($response === false) {
                echo "<span class='error'>ÉCHEC</span></p>";
                echo "<p>Erreur CURL: " . curl_error($ch) . "</p>";
            } else {
                echo "<span class='success'>OK ($http_code)</span></p>";
                
                // Séparer en-têtes et corps
                list($headers, $body) = explode("\r\n\r\n", $response, 2);
                
                echo "<h4>En-têtes:</h4>";
                echo "<pre>" . htmlspecialchars($headers) . "</pre>";
                
                echo "<h4>Corps:</h4>";
                echo "<pre>" . htmlspecialchars(substr($body, 0, 500)) . "</pre>";
                
                // Vérifier si le contenu est du PHP
                if (strpos($body, '<?php') !== false) {
                    echo "<p><span class='error'>⚠️ Le code PHP est retourné sans être exécuté!</span></p>";
                }
                
                // Essayer de parser en JSON pour voir si c'est une réponse valide
                $json_valid = false;
                try {
                    $json = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
                    $json_valid = true;
                } catch (Exception $e) {
                    $json_valid = false;
                }
                
                if ($json_valid) {
                    echo "<p><span class='success'>La réponse est du JSON valide ✓</span></p>";
                } else {
                    echo "<p><span class='error'>La réponse n'est pas du JSON valide ✗</span></p>";
                }
            }
        else:
            echo "<p><span class='warning'>CURL n'est pas disponible pour tester l'appel interne.</span></p>";
        endif;
        ?>
    </div>
    
    <div class="section">
        <h2>4. Configuration de l'hébergement</h2>
        
        <?php
        $is_infomaniak = 
            strpos($_SERVER['SERVER_SOFTWARE'] ?? '', 'infomaniak') !== false ||
            strpos($_SERVER['HTTP_HOST'] ?? '', 'infomaniak') !== false ||
            strpos($_SERVER['HTTP_HOST'] ?? '', 'myd.infomaniak') !== false ||
            strpos($_SERVER['HTTP_HOST'] ?? '', 'qualiopi.ch') !== false;
        ?>
        
        <p>Type d'hébergement détecté: 
            <?php if($is_infomaniak): ?>
                <strong>Infomaniak</strong> (détection automatique)
            <?php else: ?>
                <strong>Autre</strong> ou indéterminé
            <?php endif; ?>
        </p>
        
        <?php if($is_infomaniak): ?>
            <div class="fix-section">
                <h3>Recommandations spécifiques pour Infomaniak:</h3>
                <ol>
                    <li>Vérifiez dans le <a href="https://manager.infomaniak.com" target="_blank">Manager Infomaniak</a> que PHP est bien activé pour le dossier <code>/api</code></li>
                    <li>Accédez à votre hébergement Web > Configuration > PHP</li>
                    <li>Dans "Restrictions par répertoire", assurez-vous que le répertoire <code>/api</code> n'est pas restreint</li>
                    <li>Vérifiez que la version PHP sélectionnée est 7.4 ou supérieure</li>
                    <li>Activez l'option "Exécuter les scripts PHP" pour tous les dossiers concernés</li>
                </ol>
                
                <h4>Problème connu sur Infomaniak:</h4>
                <p>Infomaniak nécessite parfois une configuration spécifique dans le Manager <strong>en plus</strong> des fichiers .htaccess et .user.ini. Les fichiers seuls ne suffisent pas.</p>
            </div>
        <?php endif; ?>
        
        <h3>Variables d'environnement serveur:</h3>
        <table>
            <tr><th>Clé</th><th>Valeur</th></tr>
            <?php
            $important_vars = [
                'SERVER_SOFTWARE', 'SERVER_NAME', 'SERVER_ADDR', 
                'DOCUMENT_ROOT', 'SCRIPT_FILENAME', 'SCRIPT_NAME',
                'PHP_SELF', 'REQUEST_URI', 'HTTP_HOST'
            ];
            
            foreach ($important_vars as $var) {
                echo "<tr>";
                echo "<td>$var</td>";
                echo "<td>" . htmlspecialchars($_SERVER[$var] ?? 'N/A') . "</td>";
                echo "</tr>";
            }
            ?>
        </table>
    </div>
    
    <div class="section">
        <h2>5. Actions recommandées</h2>
        
        <h3>Actions générales:</h3>
        <ol>
            <li>Vérifier que PHP est installé et activé sur le serveur</li>
            <li>S'assurer que les fichiers .htaccess et .user.ini sont présents et correctement configurés</li>
            <li>Vérifier les permissions des fichiers PHP</li>
            <li>Tester un fichier PHP très simple (comme <code>phpinfo.php</code>)</li>
        </ol>
        
        <?php if($is_infomaniak): ?>
        <h3>Actions spécifiques pour Infomaniak:</h3>
        <form method="post">
            <input type="hidden" name="create_test_files" value="1">
            <button type="submit" class="fix-button">Créer des fichiers de test PHP supplémentaires</button>
        </form>
        
        <?php
        if (isset($_POST['create_test_files'])) {
            // Créer phpinfo.php à la racine
            $phpinfo_root = "../phpinfo.php";
            $phpinfo_content = "<?php\nphpinfo();\n?>";
            $root_created = file_put_contents($phpinfo_root, $phpinfo_content) !== false;
            
            // Créer test-direct.php à la racine
            $test_direct = "../test-direct.php";
            $test_direct_content = "<?php\nheader('Content-Type: text/plain');\necho \"PHP fonctionne correctement - Exécution directe\";\n?>";
            $direct_created = file_put_contents($test_direct, $test_direct_content) !== false;
            
            echo "<div class='fix-section'>";
            echo "<h4>Résultats:</h4>";
            echo "<ul>";
            echo "<li>phpinfo.php à la racine: " . ($root_created ? '<span class="success">Créé</span>' : '<span class="error">Échec</span>') . "</li>";
            echo "<li>test-direct.php à la racine: " . ($direct_created ? '<span class="success">Créé</span>' : '<span class="error">Échec</span>') . "</li>";
            echo "</ul>";
            echo "<p>Testez ces fichiers directement:</p>";
            echo "<ul>";
            echo "<li><a href='/phpinfo.php' target='_blank'>/phpinfo.php</a> - Doit afficher la configuration PHP complète</li>";
            echo "<li><a href='/test-direct.php' target='_blank'>/test-direct.php</a> - Test minimaliste</li>";
            echo "</ul>";
            echo "</div>";
        }
        ?>
        
        <h3>Vérification dans le Manager Infomaniak:</h3>
        <ol>
            <li>Connectez-vous au <a href="https://manager.infomaniak.com" target="_blank">Manager Infomaniak</a></li>
            <li>Accédez à votre hébergement web</li>
            <li>Allez dans "Configuration > PHP"</li>
            <li>Vérifiez les "Restrictions par répertoire" - <strong>C'est probablement ici que se trouve le problème!</strong></li>
            <li>Pour chaque dossier (<code>/</code>, <code>/api</code>), assurez-vous que PHP est activé</li>
        </ol>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>6. Tests supplémentaires</h2>
        
        <h3>Test d'inclusion directe:</h3>
        <?php
        $test_file = "./info.php";
        if (file_exists($test_file)) {
            echo "<p>Tentative d'inclusion directe du fichier <code>info.php</code>:</p>";
            echo "<pre>";
            ob_start();
            $include_result = @include($test_file);
            $output = ob_get_clean();
            echo htmlspecialchars($output);
            echo "</pre>";
            
            if ($include_result !== false) {
                echo "<p><span class='success'>Inclusion réussie</span></p>";
            } else {
                echo "<p><span class='error'>Échec de l'inclusion</span></p>";
            }
        } else {
            echo "<p><span class='warning'>Le fichier <code>info.php</code> n'existe pas pour tester l'inclusion</span></p>";
        }
        ?>
        
        <h3>Tests des modules Apache:</h3>
        <?php
        if (function_exists('apache_get_modules')):
            $modules = apache_get_modules();
            $important_modules = ['mod_php', 'mod_rewrite', 'mod_mime', 'mod_headers'];
            
            echo "<table>";
            echo "<tr><th>Module</th><th>État</th></tr>";
            
            foreach ($important_modules as $module) {
                $present = in_array($module, $modules);
                echo "<tr>";
                echo "<td>$module</td>";
                echo "<td>" . ($present ? '<span class="success">Actif</span>' : '<span class="error">Inactif ou non disponible</span>') . "</td>";
                echo "</tr>";
            }
            
            echo "</table>";
        else:
            echo "<p>La fonction <code>apache_get_modules</code> n'est pas disponible. Impossible de vérifier les modules Apache.</p>";
        endif;
        ?>
    </div>
    
    <div class="section">
        <h2>Résumé</h2>
        
        <h3>État de l'exécution PHP:</h3>
        <?php if(function_exists('phpversion')): ?>
            <p><span class="success">✅ PHP fonctionne dans ce fichier de diagnostic</span></p>
            
            <?php
            // Tester si les autres fichiers fonctionnent
            $curl_test = function_exists('curl_init');
            $json_ok = false;
            
            if ($curl_test) {
                $test_url = 'http://' . $_SERVER['HTTP_HOST'] . '/api/info.php';
                $ch = curl_init($test_url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 3);
                $response = curl_exec($ch);
                curl_close($ch);
                
                if ($response && strpos($response, '<?php') === false) {
                    try {
                        $json_data = json_decode($response, true, 512, JSON_THROW_ON_ERROR);
                        $json_ok = true;
                    } catch (Exception $e) {
                        $json_ok = false;
                    }
                }
            }
            
            if ($json_ok) {
                echo "<p><span class='success'>✅ L'API fonctionne également correctement</span></p>";
            } else {
                echo "<p><span class='error'>❌ L'API ne fonctionne pas correctement</span></p>";
            }
            ?>
            
            <h3>Actions recommandées:</h3>
            <?php if($is_infomaniak): ?>
                <p><strong>Ce problème est très probablement lié à la configuration Infomaniak:</strong></p>
                <ol>
                    <li>Dans le Manager Infomaniak, accédez à "Hébergement Web > Configuration > PHP"</li>
                    <li>Vérifiez que PHP est activé pour le site et pour chaque dossier concerné</li>
                    <li>Assurez-vous qu'il n'y a pas de restrictions pour les dossiers <code>/api</code> et <code>/</code></li>
                    <li>Après avoir fait les changements, attendez quelques minutes pour qu'ils prennent effet</li>
                </ol>
            <?php else: ?>
                <ol>
                    <li>Vérifiez la configuration du serveur web (Apache/Nginx) pour s'assurer que PHP est correctement intégré</li>
                    <li>Assurez-vous que les modules PHP nécessaires sont activés</li>
                    <li>Vérifiez que les fichiers .htaccess sont pris en compte (AllowOverride All)</li>
                </ol>
            <?php endif; ?>
        <?php else: ?>
            <p><span class="error">❌ PHP n'est pas exécuté correctement</span></p>
            <p>Ce message ne devrait jamais apparaître si PHP fonctionnait. Le problème est très sérieux.</p>
        <?php endif; ?>
    </div>
    
    <p><a href="/">Retour à l'accueil</a> | <a href="/api/phpinfo.php">Voir phpinfo()</a> | <a href="/api/test.php">Tester l'API</a></p>
    
    <footer style="margin-top: 30px; text-align: center; font-size: 0.8em;">
        Diagnostic généré le <?php echo date('Y-m-d H:i:s'); ?>
    </footer>
</body>
</html>
