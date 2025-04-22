
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des Assets FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        .fix-button:hover { background: #45a049; }
    </style>
</head>
<body>
    <h1>Vérification des Assets FormaCert</h1>
    
    <div class="section">
        <h2>1. Index.html</h2>
        <?php
        if (file_exists('index.html')) {
            echo "<p>Fichier index.html: <span class='success'>EXISTE</span></p>";
            $index_content = file_get_contents('index.html');
            
            // Vérifier si index.html fait référence à des fichiers assets
            $js_matches = [];
            $css_matches = [];
            preg_match_all('/<script[^>]*src="([^"]*)"[^>]*>/i', $index_content, $js_matches);
            preg_match_all('/<link[^>]*href="([^"]*\.css)"[^>]*>/i', $index_content, $css_matches);
            
            echo "<p>Références JavaScript trouvées:</p><ul>";
            foreach ($js_matches[1] as $js_file) {
                echo "<li>$js_file: ";
                if (file_exists(ltrim($js_file, '/'))) {
                    echo "<span class='success'>EXISTE</span>";
                } else {
                    echo "<span class='error'>MANQUANT</span>";
                }
                echo "</li>";
            }
            echo "</ul>";
            
            echo "<p>Références CSS trouvées:</p><ul>";
            foreach ($css_matches[1] as $css_file) {
                echo "<li>$css_file: ";
                if (file_exists(ltrim($css_file, '/'))) {
                    echo "<span class='success'>EXISTE</span>";
                } else {
                    echo "<span class='error'>MANQUANT</span>";
                }
                echo "</li>";
            }
            echo "</ul>";
            
            echo "<p>Contenu de index.html:</p>";
            echo "<pre>" . htmlspecialchars($index_content) . "</pre>";
        } else {
            echo "<p>Fichier index.html: <span class='error'>MANQUANT</span></p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>2. Exploration du dossier assets</h2>
        <?php
        if (is_dir('assets')) {
            echo "<p>Dossier assets: <span class='success'>EXISTE</span></p>";
            
            // Liste tous les fichiers JS et CSS dans assets
            echo "<p>Fichiers JavaScript:</p><ul>";
            $js_files = glob('assets/*.js');
            if (!empty($js_files)) {
                foreach ($js_files as $js_file) {
                    echo "<li>" . basename($js_file) . " (" . filesize($js_file) . " octets)</li>";
                }
            } else {
                echo "<li><span class='error'>Aucun fichier JS trouvé</span></li>";
            }
            echo "</ul>";
            
            echo "<p>Fichiers CSS:</p><ul>";
            $css_files = glob('assets/*.css');
            if (!empty($css_files)) {
                foreach ($css_files as $css_file) {
                    echo "<li>" . basename($css_file) . " (" . filesize($css_file) . " octets)</li>";
                }
            } else {
                echo "<li><span class='error'>Aucun fichier CSS trouvé</span></li>";
            }
            echo "</ul>";
        } else {
            echo "<p>Dossier assets: <span class='error'>MANQUANT</span></p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>3. Correction automatique de index.html</h2>
        <?php
        if (file_exists('index.html') && is_dir('assets')) {
            $js_files = glob('assets/*.js');
            $css_files = glob('assets/*.css');
            
            // Si des fichiers JS et CSS existent mais ne sont pas référencés correctement
            if (!empty($js_files) && !empty($css_files)) {
                $index_content = file_get_contents('index.html');
                $main_js = $js_files[0]; // Premier fichier JS
                $main_css = $css_files[0]; // Premier fichier CSS
                
                $needs_correction = false;
                
                // Vérifier si le contenu actuel contient déjà les références correctes
                if (!strpos($index_content, basename($main_js)) || !strpos($index_content, basename($main_css))) {
                    $needs_correction = true;
                }
                
                if ($needs_correction) {
                    echo "<p>Des corrections sont nécessaires dans index.html pour référencer correctement les assets.</p>";
                    echo "<p>JS principal détecté: " . basename($main_js) . "</p>";
                    echo "<p>CSS principal détecté: " . basename($main_css) . "</p>";
                    
                    // Permettre la correction
                    echo "<form method='post'>";
                    echo "<input type='hidden' name='fix_index' value='1'>";
                    echo "<input type='hidden' name='js_file' value='" . basename($main_js) . "'>";
                    echo "<input type='hidden' name='css_file' value='" . basename($main_css) . "'>";
                    echo "<button type='submit' class='fix-button'>Corriger index.html automatiquement</button>";
                    echo "</form>";
                    
                    // Appliquer la correction si demandé
                    if (isset($_POST['fix_index']) && $_POST['fix_index'] == '1') {
                        $js_file = $_POST['js_file'];
                        $css_file = $_POST['css_file'];
                        
                        // Créer une sauvegarde
                        copy('index.html', 'index.html.bak');
                        
                        // Modifier les références dans index.html
                        $new_content = preg_replace(
                            '/<script[^>]*src="[^"]*main\.tsx"[^>]*>/',
                            '<script type="module" src="/assets/' . $js_file . '">',
                            $index_content
                        );
                        
                        // Ajouter la référence CSS si nécessaire
                        if (!strpos($new_content, $css_file)) {
                            $new_content = str_replace(
                                '</head>',
                                '<link rel="stylesheet" href="/assets/' . $css_file . '" />' . "\n" . '</head>',
                                $new_content
                            );
                        }
                        
                        file_put_contents('index.html', $new_content);
                        echo "<p><span class='success'>Correction appliquée! Actualisez la page pour voir les changements.</span></p>";
                    }
                } else {
                    echo "<p><span class='success'>index.html semble déjà référencer correctement les assets.</span></p>";
                }
            } else {
                echo "<p><span class='error'>Impossible de corriger automatiquement: fichiers JS ou CSS manquants dans le dossier assets.</span></p>";
            }
        } else {
            echo "<p><span class='error'>Impossible de procéder à la correction: fichier index.html ou dossier assets manquant.</span></p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>4. Actions recommandées</h2>
        <ol>
            <li>Vérifiez que le build a été correctement généré avec <code>npm run build</code></li>
            <li>Assurez-vous que tous les fichiers du dossier <code>dist</code> ont été correctement copiés à la racine du site</li>
            <li>Vérifiez qu'il n'y a pas de redirections ou de règles htaccess qui bloquent l'accès aux assets</li>
            <li>Utilisez la correction automatique proposée ci-dessus si des fichiers JS et CSS sont présents mais pas correctement référencés</li>
        </ol>
    </div>
</body>
</html>
