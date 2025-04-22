
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des références dans index.html</title>
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
    <h1>Correction des références dans index.html</h1>
    
    <div class="section">
        <h2>Analyse du fichier index.html</h2>
        <?php
        if (file_exists('../index.html')) {
            echo "<p>Fichier index.html: <span class='success'>EXISTE</span></p>";
            $index_content = file_get_contents('../index.html');
            
            // Vérifier les références actuelles
            $has_js_reference = preg_match('/<script[^>]*src="\/assets\/[^"]*\.js"[^>]*>/i', $index_content);
            $has_css_reference = preg_match('/<link[^>]*href="\/assets\/[^"]*\.css"[^>]*>/i', $index_content);
            $has_src_reference = preg_match('/<script[^>]*src="\/src\/[^"]*"[^>]*>/i', $index_content);
            
            if ($has_js_reference) {
                echo "<p>Référence à un fichier JavaScript dans /assets/: <span class='success'>TROUVÉE</span></p>";
            } else {
                echo "<p>Référence à un fichier JavaScript dans /assets/: <span class='error'>NON TROUVÉE</span></p>";
            }
            
            if ($has_css_reference) {
                echo "<p>Référence à un fichier CSS dans /assets/: <span class='success'>TROUVÉE</span></p>";
            } else {
                echo "<p>Référence à un fichier CSS dans /assets/: <span class='error'>NON TROUVÉE</span></p>";
            }
            
            if ($has_src_reference) {
                echo "<p>Référence à un fichier dans /src/: <span class='error'>TROUVÉE (doit être remplacée)</span></p>";
            }
            
            echo "<p>Contenu actuel de index.html:</p>";
            echo "<pre>" . htmlspecialchars($index_content) . "</pre>";
        } else {
            echo "<p>Fichier index.html: <span class='error'>INTROUVABLE</span></p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Recherche des fichiers JavaScript et CSS compilés</h2>
        <?php
        $js_files = glob('../assets/*.js');
        $css_files = glob('../assets/*.css');
        
        if (!empty($js_files)) {
            // Trouver le fichier main.js le plus récent
            $latest_main_js = "";
            $latest_main_time = 0;
            
            foreach ($js_files as $js_file) {
                $filename = basename($js_file);
                if (strpos($filename, 'main-') === 0) {
                    $file_time = filemtime($js_file);
                    if ($file_time > $latest_main_time) {
                        $latest_main_time = $file_time;
                        $latest_main_js = $filename;
                    }
                }
            }
            
            if (!empty($latest_main_js)) {
                echo "<p>Fichier main.js le plus récent: <span class='success'>" . $latest_main_js . "</span> (" . date('Y-m-d H:i:s', $latest_main_time) . ")</p>";
            } else {
                echo "<p>Fichier main.js: <span class='error'>AUCUN TROUVÉ</span></p>";
            }
            
            // Lister tous les fichiers JS
            echo "<p>Tous les fichiers JavaScript trouvés:</p><ul>";
            foreach ($js_files as $js_file) {
                $filename = basename($js_file);
                echo "<li>" . $filename . " (" . filesize($js_file) . " octets)</li>";
            }
            echo "</ul>";
        } else {
            echo "<p>Fichiers JavaScript: <span class='error'>AUCUN TROUVÉ</span></p>";
        }
        
        if (!empty($css_files)) {
            // Trouver le fichier CSS le plus récent
            $latest_css = "";
            $latest_css_time = 0;
            
            foreach ($css_files as $css_file) {
                $filename = basename($css_file);
                $file_time = filemtime($css_file);
                if ($file_time > $latest_css_time) {
                    $latest_css_time = $file_time;
                    $latest_css = $filename;
                }
            }
            
            if (!empty($latest_css)) {
                echo "<p>Fichier CSS le plus récent: <span class='success'>" . $latest_css . "</span> (" . date('Y-m-d H:i:s', $latest_css_time) . ")</p>";
            } else {
                echo "<p>Fichier CSS: <span class='error'>AUCUN TROUVÉ</span></p>";
            }
            
            // Lister tous les fichiers CSS
            echo "<p>Tous les fichiers CSS trouvés:</p><ul>";
            foreach ($css_files as $css_file) {
                $filename = basename($css_file);
                echo "<li>" . $filename . " (" . filesize($css_file) . " octets)</li>";
            }
            echo "</ul>";
        } else {
            echo "<p>Fichiers CSS: <span class='error'>AUCUN TROUVÉ</span></p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Correction automatique de index.html</h2>
        <?php
        if (file_exists('../index.html')) {
            $needs_correction = !$has_js_reference || !$has_css_reference || $has_src_reference;
            
            if ($needs_correction && !empty($latest_main_js)) {
                echo "<p>Des corrections sont nécessaires dans index.html pour référencer correctement les assets.</p>";
                
                if (isset($_POST['fix_index'])) {
                    // Créer une sauvegarde
                    copy('../index.html', '../index.html.bak');
                    
                    $index_content = file_get_contents('../index.html');
                    $new_content = $index_content;
                    
                    // Ajouter la référence CSS si nécessaire
                    if (!empty($latest_css) && !$has_css_reference) {
                        $new_content = preg_replace(
                            '/<\/head>/',
                            '    <link rel="stylesheet" href="/assets/' . $latest_css . '" />' . "\n" . '</head>',
                            $new_content
                        );
                    }
                    
                    // Remplacer ou ajouter la référence JS
                    if ($has_src_reference) {
                        $new_content = preg_replace(
                            '/<script[^>]*src="\/src\/[^"]*"[^>]*>/',
                            '<script type="module" src="/assets/' . $latest_main_js . '">',
                            $new_content
                        );
                    } else if (!$has_js_reference) {
                        $new_content = preg_replace(
                            '/<\/body>/',
                            '    <script type="module" src="/assets/' . $latest_main_js . '"></script>' . "\n" . '</body>',
                            $new_content
                        );
                    }
                    
                    // Sauvegarder les modifications
                    file_put_contents('../index.html', $new_content);
                    echo "<p><span class='success'>Correction appliquée! Le fichier index.html a été mis à jour.</span></p>";
                    echo "<p>Une sauvegarde a été créée: index.html.bak</p>";
                    echo "<p>Contenu du nouvel index.html:</p>";
                    echo "<pre>" . htmlspecialchars($new_content) . "</pre>";
                } else {
                    // Formulaire pour appliquer les corrections
                    echo "<form method='post'>";
                    echo "<input type='hidden' name='fix_index' value='1'>";
                    echo "<button type='submit' class='fix-button'>Corriger index.html automatiquement</button>";
                    echo "</form>";
                }
            } else if (!$needs_correction) {
                echo "<p><span class='success'>index.html semble déjà référencer correctement les assets.</span></p>";
            } else {
                echo "<p><span class='error'>Impossible d'appliquer des corrections: aucun fichier main.js trouvé.</span></p>";
            }
        } else {
            echo "<p><span class='error'>Impossible de procéder à la correction: fichier index.html introuvable.</span></p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Actions recommandées</h2>
        <ol>
            <li>Vérifiez que tous les fichiers du dossier <code>dist</code> ont été correctement copiés à la racine du site</li>
            <li>Si vous avez généré un nouveau build, assurez-vous que les fichiers dans <code>assets/</code> sont à jour</li>
            <li>Utilisez la correction automatique proposée ci-dessus pour mettre à jour index.html</li>
            <li>Après correction, videz le cache de votre navigateur et testez à nouveau l'application</li>
        </ol>
    </div>
</body>
</html>
