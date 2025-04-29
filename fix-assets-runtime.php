
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des assets en temps réel</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Correction des assets en temps réel</h1>
    
    <div class="section">
        <h2>Analyse des répertoires d'assets</h2>
        <?php
        $dirs_to_check = [
            './assets' => 'Dossier assets à la racine',
            './dist/assets' => 'Dossier dist/assets (source)'
        ];
        
        foreach ($dirs_to_check as $dir => $desc) {
            echo "<p>$desc ($dir): ";
            if (is_dir($dir)) {
                $files = glob("$dir/*");
                $file_count = count($files);
                echo "<span class='success'>EXISTE</span> ($file_count fichiers)";
            } else {
                echo "<span class='error'>N'EXISTE PAS</span>";
            }
            echo "</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Actions disponibles</h2>
        <?php
        if (isset($_POST['copy_assets'])) {
            // Créer le dossier assets s'il n'existe pas
            if (!is_dir('./assets')) {
                if (mkdir('./assets', 0755, true)) {
                    echo "<p><span class='success'>Dossier assets créé avec succès</span></p>";
                } else {
                    echo "<p><span class='error'>Impossible de créer le dossier assets</span></p>";
                }
            }
            
            // Si le dossier dist/assets existe, copier son contenu
            if (is_dir('./dist/assets')) {
                $copied = 0;
                $failed = 0;
                $files = glob('./dist/assets/*');
                
                foreach ($files as $file) {
                    $dest = './assets/' . basename($file);
                    if (copy($file, $dest)) {
                        $copied++;
                    } else {
                        $failed++;
                    }
                }
                
                echo "<p><span class='success'>$copied fichiers copiés avec succès</span>";
                if ($failed > 0) {
                    echo ", <span class='error'>$failed échecs</span>";
                }
                echo "</p>";
                
                // Lister les fichiers copiés
                if ($copied > 0) {
                    echo "<h3>Fichiers copiés:</h3><ul>";
                    foreach (glob('./assets/*') as $file) {
                        echo "<li>" . basename($file) . "</li>";
                    }
                    echo "</ul>";
                }
                
                // Mettre à jour index.html si nécessaire
                if (file_exists('./index.html')) {
                    $content = file_get_contents('./index.html');
                    $updated = false;
                    
                    // Remplacer les références dist/assets par assets
                    if (strpos($content, 'dist/assets') !== false) {
                        $content = str_replace('dist/assets', 'assets', $content);
                        $updated = true;
                    }
                    
                    // Remplacer src="./src/ par des références vers assets
                    if (strpos($content, 'src="./src/') !== false) {
                        $js_files = glob('./assets/*.js');
                        if (!empty($js_files)) {
                            $main_js = '/assets/' . basename($js_files[0]);
                            $content = preg_replace('/<script[^>]*src="\.\/src\/[^"]*"[^>]*>/i', '<script type="module" src="' . $main_js . '">', $content);
                            $updated = true;
                        }
                    }
                    
                    // Remplacer href="./src/ par des références vers assets
                    if (strpos($content, 'href="./src/') !== false) {
                        $css_files = glob('./assets/*.css');
                        if (!empty($css_files)) {
                            $main_css = '/assets/' . basename($css_files[0]);
                            $content = preg_replace('/<link[^>]*href="\.\/src\/[^"]*"[^>]*>/i', '<link rel="stylesheet" href="' . $main_css . '">', $content);
                            $updated = true;
                        }
                    }
                    
                    if ($updated) {
                        file_put_contents('./index.html', $content);
                        echo "<p><span class='success'>Le fichier index.html a été mis à jour</span></p>";
                        echo "<pre>" . htmlspecialchars($content) . "</pre>";
                    } else {
                        echo "<p>Le fichier index.html n'a pas besoin d'être modifié</p>";
                    }
                }
            } else {
                echo "<p><span class='error'>Le dossier dist/assets n'existe pas, impossible de copier les fichiers</span></p>";
            }
        } else {
            echo "<form method='post'>";
            echo "<p>Ce script va copier tous les fichiers de <code>dist/assets</code> vers <code>assets</code> et mettre à jour les références dans index.html si nécessaire.</p>";
            echo "<input type='hidden' name='copy_assets' value='1'>";
            echo "<button type='submit' class='fix-button'>Copier les assets maintenant</button>";
            echo "</form>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Vérification de index.html</h2>
        <?php
        if (file_exists('./index.html')) {
            $content = file_get_contents('./index.html');
            $has_dist_refs = strpos($content, 'dist/assets') !== false;
            $has_src_refs = strpos($content, 'src="./src/') !== false || strpos($content, 'href="./src/') !== false;
            $has_assets_refs = strpos($content, '/assets/') !== false;
            
            echo "<p>Référence à dist/assets: " . ($has_dist_refs ? "<span class='error'>PRÉSENTE</span>" : "<span class='success'>ABSENTE</span>") . "</p>";
            echo "<p>Référence à ./src/: " . ($has_src_refs ? "<span class='error'>PRÉSENTE</span>" : "<span class='success'>ABSENTE</span>") . "</p>";
            echo "<p>Référence à /assets/: " . ($has_assets_refs ? "<span class='success'>PRÉSENTE</span>" : "<span class='error'>ABSENTE</span>") . "</p>";
        } else {
            echo "<p><span class='error'>Le fichier index.html n'existe pas</span></p>";
        }
        ?>
    </div>
</body>
</html>
