
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des fichiers CSS</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 4px solid green; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 4px solid red; }
        .warning { color: orange; background-color: #fffaf0; padding: 10px; border-left: 4px solid orange; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .button {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            margin-right: 10px;
        }
        .button.blue { background-color: #2196F3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Vérification des fichiers CSS</h1>
        
        <div class="card">
            <h2>Recherche des fichiers CSS dans dist/</h2>
            <?php
            $css_files = [];
            $dist_dir = './dist';
            $dist_assets_dir = './dist/assets';
            
            // Vérifier si le dossier dist existe
            if (!is_dir($dist_dir)) {
                echo "<div class='error'>Le dossier <code>dist/</code> n'existe pas!</div>";
            } else {
                echo "<div class='success'>Le dossier <code>dist/</code> existe.</div>";
                
                // Rechercher les fichiers CSS directement dans dist/
                $direct_css = glob("$dist_dir/*.css");
                if (!empty($direct_css)) {
                    echo "<div class='success'>Fichiers CSS trouvés directement dans dist/: " . count($direct_css) . "</div>";
                    echo "<ul>";
                    foreach ($direct_css as $css_file) {
                        $css_files[] = $css_file;
                        echo "<li>" . basename($css_file) . "</li>";
                    }
                    echo "</ul>";
                } else {
                    echo "<div class='warning'>Aucun fichier CSS trouvé directement dans dist/</div>";
                }
                
                // Vérifier si le dossier dist/assets existe
                if (!is_dir($dist_assets_dir)) {
                    echo "<div class='error'>Le dossier <code>dist/assets/</code> n'existe pas!</div>";
                } else {
                    echo "<div class='success'>Le dossier <code>dist/assets/</code> existe.</div>";
                    
                    // Rechercher les fichiers CSS dans dist/assets/
                    $asset_css_files = glob("$dist_assets_dir/*.css");
                    if (!empty($asset_css_files)) {
                        echo "<div class='success'>Fichiers CSS trouvés dans dist/assets/: " . count($asset_css_files) . "</div>";
                        echo "<ul>";
                        foreach ($asset_css_files as $css_file) {
                            $css_files[] = $css_file;
                            echo "<li>" . basename($css_file) . "</li>";
                        }
                        echo "</ul>";
                    } else {
                        echo "<div class='warning'>Aucun fichier CSS trouvé dans dist/assets/</div>";
                        
                        // Recherche récursive de fichiers CSS
                        $found_css = false;
                        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dist_dir));
                        echo "<div class='warning'>Recherche récursive de fichiers CSS dans tout le dossier dist/...</div>";
                        echo "<ul>";
                        foreach ($iterator as $file) {
                            if ($file->isFile() && $file->getExtension() === 'css') {
                                $css_files[] = $file->getPathname();
                                echo "<li>" . str_replace('./dist/', '', $file->getPathname()) . "</li>";
                                $found_css = true;
                            }
                        }
                        echo "</ul>";
                        
                        if ($found_css) {
                            echo "<div class='success'>Des fichiers CSS ont été trouvés par recherche récursive.</div>";
                        } else {
                            echo "<div class='error'>Aucun fichier CSS trouvé dans tout le dossier dist/ !</div>";
                        }
                    }
                }
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Test d'accès aux fichiers CSS</h2>
            <?php
            if (!empty($css_files)) {
                echo "<p>Test d'accès à " . count($css_files) . " fichiers CSS identifiés:</p>";
                echo "<ul>";
                foreach ($css_files as $css_file) {
                    $css_url = str_replace('./', '/', $css_file);
                    $ch = curl_init('http://' . $_SERVER['HTTP_HOST'] . $css_url);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_HEADER, true);
                    curl_setopt($ch, CURLOPT_NOBODY, true);
                    curl_exec($ch);
                    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    curl_close($ch);
                    
                    $status_class = ($status == 200) ? 'success' : 'error';
                    $status_text = ($status == 200) ? "OK (200)" : "Erreur ($status)";
                    
                    echo "<li class='$status_class'><strong>$css_url</strong>: $status_text</li>";
                }
                echo "</ul>";
            } else {
                echo "<div class='error'>Aucun fichier CSS à tester.</div>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Actions correctives</h2>
            <p>Si des fichiers CSS sont manquants ou inaccessibles, vous pouvez essayer les actions suivantes:</p>
            <ol>
                <li>Vérifier que le processus de build génère correctement les fichiers CSS (<code>npm run build</code>)</li>
                <li>S'assurer que le workflow GitHub est configuré pour copier explicitement le dossier dist/</li>
                <li>Vérifier que les fichiers .htaccess sont correctement configurés pour les types MIME</li>
                <li>Si nécessaire, déclencher un nouveau déploiement GitHub</li>
            </ol>
            
            <p>
                <a href="deployment-fix.php" class="button">Voir les solutions de déploiement</a>
                <a href="fix-mime-types.php" class="button blue">Corriger les types MIME</a>
            </p>
        </div>
    </div>
</body>
</html>
