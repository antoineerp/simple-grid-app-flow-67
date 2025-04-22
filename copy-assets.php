
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Copie des Assets Compilés</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Copie des Assets Compilés</h1>
    
    <div class="section">
        <h2>État actuel des dossiers</h2>
        <?php
        function check_dir_exists($dir) {
            if (is_dir($dir)) {
                $files = glob($dir . '/*');
                return count($files);
            }
            return false;
        }

        $dirs = [
            './dist' => 'Dossier de build',
            './dist/assets' => 'Assets compilés (source)',
            './assets' => 'Dossier assets (destination)'
        ];

        foreach ($dirs as $dir => $label) {
            $files_count = check_dir_exists($dir);
            echo "<p>$label ($dir): ";
            if ($files_count !== false) {
                echo "<span class='success'>EXISTE</span> ($files_count fichiers)";
            } else {
                echo "<span class='error'>N'EXISTE PAS</span>";
            }
            echo "</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Copie des fichiers</h2>
        <?php
        if (isset($_POST['copy_assets'])) {
            // Créer le dossier assets s'il n'existe pas
            if (!is_dir('./assets')) {
                if (mkdir('./assets', 0755, true)) {
                    echo "<p>Création du dossier assets: <span class='success'>OK</span></p>";
                } else {
                    echo "<p>Création du dossier assets: <span class='error'>ÉCHEC</span></p>";
                }
            }
            
            // Vérifier si dist/assets existe
            if (is_dir('./dist/assets')) {
                $files = glob('./dist/assets/*');
                $copied = 0;
                $failed = 0;
                
                foreach ($files as $file) {
                    $filename = basename($file);
                    $dest = './assets/' . $filename;
                    
                    if (copy($file, $dest)) {
                        $copied++;
                    } else {
                        $failed++;
                    }
                }
                
                echo "<p>Copie des fichiers: <span class='success'>$copied fichiers copiés</span>";
                if ($failed > 0) {
                    echo ", <span class='error'>$failed échecs</span>";
                }
                echo "</p>";
                
                // Liste des fichiers copiés
                if ($copied > 0) {
                    echo "<h3>Fichiers copiés:</h3><ul>";
                    $copied_files = glob('./assets/*');
                    foreach ($copied_files as $file) {
                        echo "<li>" . basename($file) . "</li>";
                    }
                    echo "</ul>";
                }
            } else {
                echo "<p><span class='error'>Le dossier dist/assets n'existe pas. Vous devez d'abord générer un build.</span></p>";
            }
            
            // Mise à jour du fichier index.html
            if (file_exists('./index.html') && !empty(glob('./assets/*.js')) && !empty(glob('./assets/*.css'))) {
                $js_files = glob('./assets/*.js');
                $css_files = glob('./assets/*.css');
                
                // Trouver le fichier JS principal
                $main_js = '';
                foreach ($js_files as $file) {
                    if (strpos(basename($file), 'main-') === 0) {
                        $main_js = '/assets/' . basename($file);
                        break;
                    }
                }
                
                // Trouver le fichier CSS principal
                $main_css = '';
                foreach ($css_files as $file) {
                    if (strpos(basename($file), 'index-') === 0) {
                        $main_css = '/assets/' . basename($file);
                        break;
                    }
                }
                
                // Si aucun fichier principal n'est trouvé, prendre le premier
                if (empty($main_js) && !empty($js_files)) {
                    $main_js = '/assets/' . basename($js_files[0]);
                }
                
                if (empty($main_css) && !empty($css_files)) {
                    $main_css = '/assets/' . basename($css_files[0]);
                }
                
                // Lire le contenu de index.html
                $index_content = file_get_contents('./index.html');
                $index_backup = file_get_contents('./index.html');
                
                // Créer une sauvegarde
                file_put_contents('./index.html.bak', $index_backup);
                
                // Mettre à jour les références
                if (!empty($main_css)) {
                    // Ajouter le lien CSS s'il n'existe pas
                    if (!preg_match('/<link[^>]*href=["\'](\/assets\/[^"\']*\.css)["\']/i', $index_content)) {
                        $index_content = preg_replace(
                            '/<\/head>/',
                            '    <link rel="stylesheet" href="' . $main_css . '" />' . "\n" . '  </head>',
                            $index_content
                        );
                        echo "<p>Ajout du lien CSS: <span class='success'>OK</span></p>";
                    }
                }
                
                if (!empty($main_js)) {
                    // Remplacer la référence à /src/main.tsx
                    if (preg_match('/<script[^>]*src=["\'](\/src\/[^"\']*\.tsx?)["\']/i', $index_content)) {
                        $index_content = preg_replace(
                            '/<script[^>]*src=["\'](\/src\/[^"\']*\.tsx?)["\']/i',
                            '<script type="module" src="' . $main_js . '"',
                            $index_content
                        );
                        echo "<p>Mise à jour du script JS: <span class='success'>OK</span></p>";
                    }
                }
                
                // Enregistrer les modifications
                if (file_put_contents('./index.html', $index_content)) {
                    echo "<p>Mise à jour de index.html: <span class='success'>OK</span></p>";
                } else {
                    echo "<p>Mise à jour de index.html: <span class='error'>ÉCHEC</span></p>";
                }
            }
        } else {
            // Formulaire pour lancer la copie
            echo "<form method='post'>";
            echo "<p>Ce script va copier les fichiers du dossier <code>dist/assets</code> vers le dossier <code>assets</code> à la racine, et mettre à jour le fichier <code>index.html</code>.</p>";
            echo "<input type='hidden' name='copy_assets' value='1'>";
            echo "<button type='submit' class='fix-button'>Copier les assets et mettre à jour index.html</button>";
            echo "</form>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Génération d'un nouveau build</h2>
        <p>Si aucun fichier n'est présent dans le dossier <code>dist/assets</code>, vous devez d'abord générer un build:</p>
        <ol>
            <li>Exécutez <code>npm run build</code> à la racine du projet</li>
            <li>Vérifiez que des fichiers ont été générés dans <code>dist/assets</code></li>
            <li>Revenez à cette page et utilisez le script ci-dessus pour copier les fichiers dans <code>assets</code></li>
        </ol>
    </div>
    
    <div class="section">
        <h2>Vérification de index.html</h2>
        <?php
        if (file_exists('./index.html')) {
            $content = file_get_contents('./index.html');
            $has_assets_js = preg_match('/<script[^>]*src=["\'](\/assets\/[^"\']*\.js)["\']/i', $content);
            $has_assets_css = preg_match('/<link[^>]*href=["\'](\/assets\/[^"\']*\.css)["\']/i', $content);
            $has_src_ref = preg_match('/<script[^>]*src=["\'](\/src\/[^"\']*\.[jt]sx?)["\']/i', $content);
            
            echo "<p>Référence à un fichier JavaScript dans /assets/: " . 
                ($has_assets_js ? "<span class='success'>TROUVÉE</span>" : "<span class='error'>NON TROUVÉE</span>") . "</p>";
            
            echo "<p>Référence à un fichier CSS dans /assets/: " . 
                ($has_assets_css ? "<span class='success'>TROUVÉE</span>" : "<span class='error'>NON TROUVÉE</span>") . "</p>";
            
            echo "<p>Référence à un fichier dans /src/: " . 
                ($has_src_ref ? "<span class='error'>TROUVÉE (doit être remplacée)</span>" : "<span class='success'>NON TROUVÉE</span>") . "</p>";
            
            echo "<h3>Contenu actuel de index.html:</h3>";
            echo "<pre>" . htmlspecialchars($content) . "</pre>";
        } else {
            echo "<p>Fichier index.html: <span class='error'>NON TROUVÉ</span></p>";
        }
        ?>
    </div>
</body>
</html>
