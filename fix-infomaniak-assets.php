
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Réparation des Assets</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .button { 
            display: inline-block; 
            background-color: #4CAF50; 
            color: white; 
            padding: 10px 15px; 
            text-decoration: none; 
            border-radius: 4px;
            border: none;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Réparation des Assets pour Infomaniak</h1>
        
        <div class="card">
            <h2>Diagnostic des assets</h2>
            
            <?php
            $assets_dir = './assets';
            $dist_dir = './dist';
            $dist_assets_dir = './dist/assets';
            
            echo "<h3>Vérification des dossiers:</h3>";
            echo "<ul>";
            echo "<li>Dossier assets: " . (is_dir($assets_dir) ? "<span class='success'>Existe</span>" : "<span class='error'>N'existe pas</span>") . "</li>";
            echo "<li>Dossier dist: " . (is_dir($dist_dir) ? "<span class='success'>Existe</span>" : "<span class='warning'>N'existe pas</span>") . "</li>";
            echo "<li>Dossier dist/assets: " . (is_dir($dist_assets_dir) ? "<span class='success'>Existe</span>" : "<span class='warning'>N'existe pas</span>") . "</li>";
            echo "</ul>";
            
            // Vérification des fichiers JavaScript dans assets
            $js_files = glob($assets_dir . '/*.js');
            echo "<h3>Fichiers JavaScript dans assets:</h3>";
            
            if (!empty($js_files)) {
                echo "<ul>";
                foreach ($js_files as $file) {
                    $filename = basename($file);
                    $filesize = filesize($file);
                    echo "<li><span class='success'>$filename</span> ($filesize octets)</li>";
                }
                echo "</ul>";
            } else {
                echo "<p><span class='warning'>Aucun fichier JavaScript trouvé dans le dossier assets</span></p>";
            }
            
            // Vérification de index.html
            $index_file = './index.html';
            echo "<h3>Fichier index.html:</h3>";
            
            if (file_exists($index_file)) {
                echo "<p><span class='success'>Le fichier index.html existe</span> (" . filesize($index_file) . " octets)</p>";
                
                // Analyser les références aux scripts et styles
                $content = file_get_contents($index_file);
                preg_match_all('/<script[^>]*src=["\']([^"\']*)["\'][^>]*>/i', $content, $scripts);
                preg_match_all('/<link[^>]*href=["\']([^"\']*)["\'][^>]*>/i', $content, $styles);
                
                echo "<h4>Scripts référencés:</h4>";
                if (!empty($scripts[1])) {
                    echo "<ul>";
                    foreach ($scripts[1] as $script) {
                        $exists = file_exists('.' . $script);
                        echo "<li>$script - " . ($exists ? "<span class='success'>Existe</span>" : "<span class='error'>N'existe pas</span>") . "</li>";
                    }
                    echo "</ul>";
                } else {
                    echo "<p>Aucun script trouvé dans index.html</p>";
                }
                
                echo "<h4>Styles référencés:</h4>";
                if (!empty($styles[1])) {
                    echo "<ul>";
                    foreach ($styles[1] as $style) {
                        if (strpos($style, '.css') !== false) {
                            $exists = file_exists('.' . $style);
                            echo "<li>$style - " . ($exists ? "<span class='success'>Existe</span>" : "<span class='error'>N'existe pas</span>") . "</li>";
                        }
                    }
                    echo "</ul>";
                } else {
                    echo "<p>Aucun style CSS trouvé dans index.html</p>";
                }
            } else {
                echo "<p><span class='error'>Le fichier index.html n'existe pas</span></p>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Actions de réparation</h2>
            
            <?php
            if (isset($_POST['fix_assets'])) {
                echo "<h3>Résultats de la réparation:</h3>";
                echo "<pre>";
                
                // Créer le dossier assets s'il n'existe pas
                if (!is_dir($assets_dir)) {
                    if (mkdir($assets_dir, 0755, true)) {
                        echo "✓ Dossier assets créé avec succès\n";
                    } else {
                        echo "✗ Erreur lors de la création du dossier assets\n";
                    }
                }
                
                // Cas 1: Rechercher dans dist/assets
                if (is_dir($dist_assets_dir)) {
                    echo "Copie des fichiers depuis dist/assets vers assets:\n";
                    
                    $dist_files = glob($dist_assets_dir . '/*.*');
                    foreach ($dist_files as $file) {
                        $filename = basename($file);
                        $dest = $assets_dir . '/' . $filename;
                        
                        if (copy($file, $dest)) {
                            echo "✓ $filename copié avec succès\n";
                        } else {
                            echo "✗ Erreur lors de la copie de $filename\n";
                        }
                    }
                }
                // Cas 2: Rechercher dans la racine du dossier dist
                elseif (is_dir($dist_dir)) {
                    echo "Dossier dist/assets non trouvé, recherche dans dist:\n";
                    
                    $dist_files = glob($dist_dir . '/*.{js,css}', GLOB_BRACE);
                    foreach ($dist_files as $file) {
                        $filename = basename($file);
                        $dest = $assets_dir . '/' . $filename;
                        
                        if (copy($file, $dest)) {
                            echo "✓ $filename copié avec succès\n";
                        } else {
                            echo "✗ Erreur lors de la copie de $filename\n";
                        }
                    }
                } else {
                    echo "Aucun dossier dist trouvé. Impossible de copier les assets.\n";
                }
                
                // Vérifier et corriger les références dans index.html
                if (file_exists($index_file)) {
                    echo "\nVérification et correction des références dans index.html:\n";
                    
                    $content = file_get_contents($index_file);
                    $original_content = $content;
                    
                    // Corriger les références aux assets
                    $content = preg_replace('/(src|href)=["\']\/(assets\/[^"\']*)["\']/', '$1="/$2"', $content);
                    
                    // Remplacer les références à /src/main.tsx par /assets/...
                    if (strpos($content, 'src="/src/main.tsx"') !== false) {
                        // Trouver un fichier JS approprié dans assets
                        $js_files = glob($assets_dir . '/*.js');
                        if (!empty($js_files)) {
                            $main_js = '/assets/' . basename($js_files[0]);
                            $content = str_replace('src="/src/main.tsx"', 'src="' . $main_js . '"', $content);
                            echo "✓ Référence à /src/main.tsx remplacée par $main_js\n";
                        }
                    }
                    
                    // Sauvegarder les modifications si nécessaire
                    if ($content !== $original_content) {
                        if (file_put_contents($index_file, $content)) {
                            echo "✓ index.html mis à jour avec succès\n";
                        } else {
                            echo "✗ Erreur lors de la mise à jour de index.html\n";
                        }
                    } else {
                        echo "✓ Aucune modification nécessaire dans index.html\n";
                    }
                }
                
                echo "</pre>";
            } else {
                ?>
                <form method="post">
                    <p>Cliquez sur le bouton ci-dessous pour réparer automatiquement les assets:</p>
                    <button type="submit" name="fix_assets" class="button">Réparer les Assets</button>
                </form>
                <?php
            }
            ?>
            
            <p><a href="verify-deploy.php" class="button" style="background-color: #2196F3;">Retour à la vérification</a></p>
        </div>
    </div>
</body>
</html>
