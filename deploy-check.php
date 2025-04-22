<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification du Déploiement FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
        .dashboard { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: #f9f9f9; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; margin: 10px 0; }
        .progress-bar { height: 10px; background: #eee; border-radius: 5px; overflow: hidden; margin: 5px 0; }
        .progress-fill { height: 100%; background: #4caf50; }
    </style>
</head>
<body>
    <h1>Vérification du Déploiement FormaCert</h1>
    
    <div class="dashboard">
        <div class="stat-card">
            <h3>Fichiers essentiels</h3>
            <div class="stat-value" id="essential-files-status">Vérification...</div>
            <div class="progress-bar"><div class="progress-fill" id="essential-files-progress" style="width: 0%"></div></div>
        </div>
        <div class="stat-card">
            <h3>Structure</h3>
            <div class="stat-value" id="structure-status">Vérification...</div>
            <div class="progress-bar"><div class="progress-fill" id="structure-progress" style="width: 0%"></div></div>
        </div>
        <div class="stat-card">
            <h3>Scripts JS</h3>
            <div class="stat-value" id="js-status">Vérification...</div>
            <div class="progress-bar"><div class="progress-fill" id="js-progress" style="width: 0%"></div></div>
        </div>
        <div class="stat-card">
            <h3>API</h3>
            <div class="stat-value" id="api-status">Vérification...</div>
            <div class="progress-bar"><div class="progress-fill" id="api-progress" style="width: 0%"></div></div>
        </div>
    </div>
    
    <div class="section">
        <h2>1. Vérification des Fichiers Essentiels</h2>
        <?php
        $essential_files_count = 0;
        $essential_files_total = 5;
        
        $required_files = [
            'index.html' => 'Page principale',
            '.htaccess' => 'Configuration Apache'
        ];

        echo "<script>document.getElementById('essential-files-progress').style.width = '20%';</script>";

        foreach ($required_files as $file => $description) {
            echo "<p>$description ($file): ";
            if (file_exists($file)) {
                echo "<span class='success'>✓ Présent</span>";
                $essential_files_count++;
            } else {
                echo "<span class='error'>✗ Manquant</span>";
            }
            echo "</p>";
        }
        
        // CORRECTION: Amélioration de la détection des fichiers avec hash
        echo "<p>JavaScript compilé (assets/*.js): ";
        $js_files = glob('assets/index-*.js');
        if (!empty($js_files)) {
            echo "<span class='success'>✓ Présent</span> (" . implode(', ', $js_files) . ")";
            $essential_files_count++;
        } else {
            // Recherche alternative de fichiers JS
            $all_js_files = glob('assets/*.js');
            if (!empty($all_js_files)) {
                echo "<span class='success'>✓ Présent (noms alternatifs)</span> (" . implode(', ', $all_js_files) . ")";
                $essential_files_count++;
            } else {
                echo "<span class='error'>✗ Manquant</span>";
            }
        }
        echo "</p>";
        
        // Recherche des fichiers CSS avec hash
        echo "<p>CSS compilé (assets/index-*.css): ";
        $css_files = glob('assets/*.css');
        if (!empty($css_files)) {
            echo "<span class='success'>✓ Présent</span> (" . implode(', ', $css_files) . ")";
            $essential_files_count++;
        } else {
            echo "<span class='warning'>⚠ Non trouvé (peut être intégré au JS)</span>";
        }
        echo "</p>";
        
        // Vérification de l'API
        echo "<p>API configuration: ";
        if (file_exists('api/index.php')) {
            echo "<span class='success'>✓ Fichier index.php trouvé</span>";
            $essential_files_count++;
            
            if (file_exists('api/.htaccess')) {
                echo " <span class='success'>+ .htaccess trouvé</span>";
            } else {
                echo " <span class='warning'>(.htaccess manquant)</span>";
            }
        } else {
            echo "<span class='error'>✗ Configuration incomplète</span>";
        }
        echo "</p>";
        
        // AJOUT: Vérification de la structure logs
        echo "<p>Capacité de journalisation: ";
        $tmp_writable = is_writable('/tmp');
        if ($tmp_writable) {
            echo "<span class='success'>✓ Dossier /tmp accessible en écriture</span>";
        } else {
            echo "<span class='warning'>⚠ Attention: /tmp n'est pas accessible en écriture</span>";
        }
        echo "</p>";
        
        $essential_percent = min(100, ($essential_files_count / $essential_files_total) * 100);
        echo "<script>
            document.getElementById('essential-files-progress').style.width = '{$essential_percent}%';
            document.getElementById('essential-files-status').textContent = '{$essential_files_count}/{$essential_files_total}';
            document.getElementById('essential-files-status').className = 'stat-value " . 
            ($essential_percent >= 80 ? 'success' : ($essential_percent >= 50 ? 'warning' : 'error')) . "';
        </script>";
        ?>
    </div>

    <div class="section">
        <h2>2. Structure du répertoire</h2>
        <?php
        $directories = [
            '.' => 'Répertoire racine',
            './assets' => 'Répertoire assets',
            './api' => 'Répertoire API',
            './public' => 'Répertoire public',
            './public/lovable-uploads' => 'Répertoire uploads'
        ];
        
        $dir_count = 0;
        $dir_total = count($directories);
        $dir_i = 0;
        
        foreach ($directories as $dir => $name) {
            $dir_i++;
            echo "<p>$name: ";
            if (is_dir($dir)) {
                echo "<span class='success'>OK</span>";
                $dir_count++;
                // Liste des fichiers
                $files = scandir($dir);
                $fileCount = count($files) - 2; // Moins . et ..
                echo " ($fileCount fichiers)";
            } else {
                echo "<span class='error'>MANQUANT</span>";
            }
            echo "</p>";
            
            $progress = min(100, ($dir_i / $dir_total) * 100);
            echo "<script>document.getElementById('structure-progress').style.width = '{$progress}%';</script>";
        }
        
        $structure_percent = ($dir_count / $dir_total) * 100;
        echo "<script>
            document.getElementById('structure-status').textContent = '{$dir_count}/{$dir_total}';
            document.getElementById('structure-status').className = 'stat-value " . 
            ($structure_percent >= 80 ? 'success' : ($structure_percent >= 50 ? 'warning' : 'error')) . "';
        </script>";
        ?>
    </div>

    <div class="section">
        <h2>3. Test des Règles de Réécriture Apache</h2>
        <?php
        // Test des redirections d'URL
        $urls_to_test = [
            '/' => 'Racine du site',
            '/assets/' => 'Dossier assets',
            '/api/' => 'API endpoint',
            '/non-existant-page' => 'Page inexistante (test SPA routing)',
            '/api/test.php' => 'API test endpoint'
        ];
        
        echo "<p><strong>Test de redirections potentielles:</strong></p>";
        
        foreach ($urls_to_test as $url => $description) {
            echo "<p>Test $description ($url): ";
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HEADER, true);
            curl_setopt($ch, CURLOPT_NOBODY, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
            $result = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode == 200 || $httpCode == 304) {
                echo "<span class='success'>✓ OK ($httpCode)</span>";
            } else if ($httpCode >= 300 && $httpCode < 400) {
                echo "<span class='warning'>⚠ Redirection ($httpCode)</span>";
            } else {
                echo "<span class='error'>✗ Problème ($httpCode)</span>";
            }
            echo "</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>4. Contenu de index.html</h2>
        <pre><?php 
        if (file_exists('./index.html')) {
            $html_content = file_get_contents('./index.html');
            echo htmlspecialchars($html_content); 
            
            // Vérification des scripts
            $js_found = preg_match_all('/<script[^>]*src="([^"]*)"[^>]*><\/script>/', $html_content, $matches);
            
            if ($js_found) {
                $js_percent = 100;
                echo "<script>
                    document.getElementById('js-status').textContent = 'OK (" . count($matches[1]) . " scripts)';
                    document.getElementById('js-status').className = 'stat-value success';
                    document.getElementById('js-progress').style.width = '100%';
                </script>";
            } else {
                echo "<script>
                    document.getElementById('js-status').textContent = 'Aucun script';
                    document.getElementById('js-status').className = 'stat-value error';
                    document.getElementById('js-progress').style.width = '0%';
                </script>";
            }
        } else {
            echo "<span class='error'>Fichier non trouvé</span>";
            echo "<script>
                document.getElementById('js-status').textContent = 'Erreur';
                document.getElementById('js-status').className = 'stat-value error';
            </script>";
        }
        ?></pre>
    </div>

    <div class="section">
        <h2>5. Test de chargement JavaScript</h2>
        <div id="js-test">Si JavaScript fonctionne, ce texte sera remplacé.</div>
        <script>
            document.getElementById('js-test').textContent = 'JavaScript fonctionne correctement!';
            document.getElementById('js-test').style.color = 'green';
        </script>
    </div>

    <div class="section">
        <h2>6. Test des fichiers API essentiels</h2>
        <?php
        // Liste complète des fichiers API essentiels
        $api_essential_files = [
            'api/index.php' => 'Point d\'entrée principal de l\'API',
            'api/.htaccess' => 'Configuration Apache pour l\'API',
            'api/.user.ini' => 'Configuration PHP pour l\'API',
            'api/auth.php' => 'Script d\'authentification',
            'api/config/env.php' => 'Configuration d\'environnement',
            'api/config/database.php' => 'Configuration de base de données',
            'api/controllers/AuthController.php' => 'Contrôleur d\'authentification',
            'api/controllers/UserController.php' => 'Contrôleur utilisateur',
            'api/controllers/ConfigController.php' => 'Contrôleur de configuration',
            'api/middleware/Auth.php' => 'Middleware d\'authentification',
            'api/models/User.php' => 'Modèle utilisateur',
            'api/utils/JwtHandler.php' => 'Gestionnaire JWT'
        ];
        
        $api_files_count = 0;
        $api_files_total = count($api_essential_files);
        
        echo "<h3>Vérification des fichiers API critiques</h3>";
        echo "<table style='width:100%; border-collapse:collapse;'>";
        echo "<tr style='background-color:#f2f2f2;'><th style='text-align:left;padding:8px;border:1px solid #ddd;'>Fichier</th><th style='text-align:left;padding:8px;border:1px solid #ddd;'>Description</th><th style='text-align:center;padding:8px;border:1px solid #ddd;'>Statut</th><th style='text-align:right;padding:8px;border:1px solid #ddd;'>Taille</th></tr>";
        
        foreach ($api_essential_files as $file => $description) {
            $file_path = './' . $file; // Chemin relatif au script actuel
            echo "<tr style='border:1px solid #ddd;'>";
            echo "<td style='padding:8px;border:1px solid #ddd;'>$file</td>";
            echo "<td style='padding:8px;border:1px solid #ddd;'>$description</td>";
            
            if (file_exists($file_path)) {
                $api_files_count++;
                $file_size = filesize($file_path);
                $file_size_formatted = $file_size < 1024 ? $file_size . " octets" : round($file_size / 1024, 2) . " KB";
                
                echo "<td style='padding:8px;border:1px solid #ddd;text-align:center;'><span class='success'>✓ Présent</span></td>";
                echo "<td style='padding:8px;border:1px solid #ddd;text-align:right;'>$file_size_formatted</td>";
            } else {
                echo "<td style='padding:8px;border:1px solid #ddd;text-align:center;'><span class='error'>✗ Manquant</span></td>";
                echo "<td style='padding:8px;border:1px solid #ddd;text-align:right;'>-</td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        
        $api_percent = min(100, ($api_files_count / $api_files_total) * 100);
        echo "<script>
            document.getElementById('api-status').textContent = '{$api_files_count}/{$api_files_total}';
            document.getElementById('api-status').className = 'stat-value " . 
            ($api_percent >= 80 ? 'success' : ($api_percent >= 50 ? 'warning' : 'error')) . "';
            document.getElementById('api-progress').style.width = '{$api_percent}%';
        </script>";
        
        // Vérification de la structure des dossiers API
        echo "<h3>Structure des dossiers API</h3>";
        $api_dirs = [
            './api' => 'Répertoire API principal',
            './api/config' => 'Configuration API',
            './api/controllers' => 'Contrôleurs API',
            './api/middleware' => 'Middleware API',
            './api/models' => 'Utilitaires API',
            './api/utils' => 'Utilitaires API'
        ];
        
        $api_dir_count = 0;
        $api_dir_total = count($api_dirs);
        
        echo "<table style='width:100%; border-collapse:collapse;'>";
        echo "<tr style='background-color:#f2f2f2;'><th style='text-align:left;padding:8px;border:1px solid #ddd;'>Dossier</th><th style='text-align:left;padding:8px;border:1px solid #ddd;'>Description</th><th style='text-align:center;padding:8px;border:1px solid #ddd;'>Statut</th><th style='text-align:center;padding:8px;border:1px solid #ddd;'>Fichiers</th></tr>";
        
        foreach ($api_dirs as $dir => $description) {
            echo "<tr style='border:1px solid #ddd;'>";
            echo "<td style='padding:8px;border:1px solid #ddd;'>$dir</td>";
            echo "<td style='padding:8px;border:1px solid #ddd;'>$description</td>";
            
            if (is_dir($dir)) {
                $api_dir_count++;
                $files = scandir($dir);
                $file_count = count($files) - 2; // Moins . et ..
                
                echo "<td style='padding:8px;border:1px solid #ddd;text-align:center;'><span class='success'>✓ Présent</span></td>";
                echo "<td style='padding:8px;border:1px solid #ddd;text-align:center;'>$file_count fichiers</td>";
            } else {
                echo "<td style='padding:8px;border:1px solid #ddd;text-align:center;'><span class='error'>✗ Manquant</span></td>";
                echo "<td style='padding:8px;border:1px solid #ddd;text-align:center;'>-</td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>

    <div class="section">
        <h2>7. Test d'accès à l'API</h2>
        <?php
        $api_endpoints = [
            '/api/' => 'Point d\'entrée principal',
            '/api/test.php' => 'Script de test'
        ];

        echo "<h3>Test des endpoints API</h3>";
        echo "<table style='width:100%; border-collapse:collapse;'>";
        echo "<tr style='background-color:#f2f2f2;'><th style='text-align:left;padding:8px;border:1px solid #ddd;'>Endpoint</th><th style='text-align:center;padding:8px;border:1px solid #ddd;'>Statut</th><th style='text-align:left;padding:8px;border:1px solid #ddd;'>Réponse</th></tr>";
        
        foreach ($api_endpoints as $endpoint => $description) {
            echo "<tr style='border:1px solid #ddd;'>";
            echo "<td style='padding:8px;border:1px solid #ddd;'>$endpoint ($description)</td>";
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $endpoint);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            $result = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode >= 200 && $httpCode < 300) {
                echo "<td style='padding:8px;border:1px solid #ddd;text-align:center;'><span class='success'>✓ OK (Code $httpCode)</span></td>";
                echo "<td style='padding:8px;border:1px solid #ddd;'><pre style='margin:0;max-height:100px;overflow:auto;'>" . htmlspecialchars(substr($result, 0, 200)) . (strlen($result) > 200 ? '...' : '') . "</pre></td>";
            } else {
                echo "<td style='padding:8px;border:1px solid #ddd;text-align:center;'><span class='error'>✗ Erreur (Code $httpCode)</span></td>";
                echo "<td style='padding:8px;border:1px solid #ddd;'><pre style='margin:0;'>" . htmlspecialchars(substr($result, 0, 200)) . (strlen($result) > 200 ? '...' : '') . "</pre></td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>8. Actions recommandées</h2>
        <div id="recommendations">
            <?php
            // Générer des recommandations en fonction des résultats
            $recommendations = [];
            
            if ($api_files_count < $api_files_total) {
                $recommendations[] = "Des fichiers API sont manquants. Vérifiez votre processus de déploiement pour vous assurer que tous les fichiers sont correctement copiés.";
            }
            
            if ($api_dir_count < $api_dir_total) {
                $recommendations[] = "Certains dossiers API sont manquants. Vérifiez la structure du dossier API.";
            }
            
            // Ajouter plus de recommandations en fonction d'autres vérifications
            
            if (empty($recommendations)) {
                echo "<p class='success'>✓ Le déploiement semble correct! Aucune action spécifique n'est requise.</p>";
            } else {
                echo "<ul>";
                foreach ($recommendations as $recommendation) {
                    echo "<li class='warning'>⚠️ $recommendation</li>";
                }
                echo "</ul>";
            }
            ?>
        </div>
    </div>
</body>
</html>
