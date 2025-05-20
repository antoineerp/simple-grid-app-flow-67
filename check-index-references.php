
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic des Références dans index.html</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
    </style>
</head>
<body>
    <h1>Diagnostic des Références dans index.html</h1>
    
    <?php
    // Vérifier si index.html existe
    if (file_exists('./index.html')) {
        echo "<p>Fichier index.html: <span class='success'>TROUVÉ</span></p>";
        $content = file_get_contents('./index.html');
    } else {
        echo "<p>Fichier index.html: <span class='error'>NON TROUVÉ</span></p>";
        exit;
    }
    
    // Extraire tous les scripts et CSS
    preg_match_all('/<script[^>]*src=[\'"]([^\'"]*)[\'"][^>]*>/i', $content, $script_matches);
    preg_match_all('/<link[^>]*href=[\'"]([^\'"]*)[\'"][^>]*rel=[\'"]stylesheet[\'"][^>]*>/i', $content, $css_matches);
    preg_match_all('/<link[^>]*rel=[\'"]stylesheet[\'"][^>]*href=[\'"]([^\'"]*)[\'"][^>]*>/i', $content, $css_alt_matches);
    
    // Combiner les correspondances CSS
    $css_urls = array_merge($css_matches[1], $css_alt_matches[1]);
    
    // Lister tous les scripts
    echo "<h2>Scripts JavaScript référencés</h2>";
    if (!empty($script_matches[1])) {
        echo "<table>
                <tr>
                    <th>URL</th>
                    <th>Type</th>
                    <th>Statut</th>
                </tr>";
        
        foreach ($script_matches[1] as $url) {
            $path = ltrim($url, '/');
            $exists = file_exists($path);
            $type = strpos($url, 'main') !== false ? "Script principal" : "Script secondaire";
            
            echo "<tr>
                    <td>{$url}</td>
                    <td>{$type}</td>
                    <td>" . ($exists ? "<span class='success'>Existe</span>" : "<span class='error'>N'existe pas</span>") . "</td>
                  </tr>";
        }
        
        echo "</table>";
    } else {
        echo "<p><span class='warning'>Aucun script JavaScript référencé dans index.html</span></p>";
    }
    
    // Lister tous les CSS
    echo "<h2>Feuilles de style CSS référencées</h2>";
    if (!empty($css_urls)) {
        echo "<table>
                <tr>
                    <th>URL</th>
                    <th>Type</th>
                    <th>Statut</th>
                </tr>";
        
        foreach ($css_urls as $url) {
            $path = ltrim($url, '/');
            $exists = file_exists($path);
            $type = strpos($url, 'main') !== false || strpos($url, 'index') !== false ? "CSS principal" : "CSS secondaire";
            
            echo "<tr>
                    <td>{$url}</td>
                    <td>{$type}</td>
                    <td>" . ($exists ? "<span class='success'>Existe</span>" : "<span class='error'>N'existe pas</span>") . "</td>
                  </tr>";
        }
        
        echo "</table>";
    } else {
        echo "<p><span class='warning'>Aucune feuille de style CSS référencée dans index.html</span></p>";
    }
    
    // Rechercher les assets disponibles
    echo "<h2>Assets disponibles</h2>";
    
    function scanAssets($dir) {
        if (!is_dir($dir)) {
            return ['js' => [], 'css' => []];
        }
        
        $js_files = glob($dir . '/*.js');
        $css_files = glob($dir . '/*.css');
        
        return [
            'js' => $js_files,
            'css' => $css_files
        ];
    }
    
    $asset_dirs = ['./assets', './dist/assets'];
    $found_assets = false;
    
    foreach ($asset_dirs as $dir) {
        $assets = scanAssets($dir);
        
        if (!empty($assets['js']) || !empty($assets['css'])) {
            $found_assets = true;
            echo "<h3>Assets dans {$dir}</h3>";
            
            if (!empty($assets['js'])) {
                echo "<h4>Fichiers JavaScript</h4>";
                echo "<table>
                        <tr>
                            <th>Nom du fichier</th>
                            <th>Taille</th>
                            <th>Date de modification</th>
                            <th>Type</th>
                        </tr>";
                
                foreach ($assets['js'] as $file) {
                    $filename = basename($file);
                    $size = round(filesize($file) / 1024, 2) . " KB";
                    $modified = date("Y-m-d H:i:s", filemtime($file));
                    $type = strpos($filename, 'main') !== false ? "<span class='success'>Script principal</span>" : "Script secondaire";
                    
                    echo "<tr>
                            <td>{$filename}</td>
                            <td>{$size}</td>
                            <td>{$modified}</td>
                            <td>{$type}</td>
                          </tr>";
                }
                
                echo "</table>";
            }
            
            if (!empty($assets['css'])) {
                echo "<h4>Fichiers CSS</h4>";
                echo "<table>
                        <tr>
                            <th>Nom du fichier</th>
                            <th>Taille</th>
                            <th>Date de modification</th>
                            <th>Type</th>
                        </tr>";
                
                foreach ($assets['css'] as $file) {
                    $filename = basename($file);
                    $size = round(filesize($file) / 1024, 2) . " KB";
                    $modified = date("Y-m-d H:i:s", filemtime($file));
                    $type = (strpos($filename, 'main') !== false || strpos($filename, 'index') !== false) ? 
                           "<span class='success'>CSS principal</span>" : "CSS secondaire";
                    
                    echo "<tr>
                            <td>{$filename}</td>
                            <td>{$size}</td>
                            <td>{$modified}</td>
                            <td>{$type}</td>
                          </tr>";
                }
                
                echo "</table>";
            }
        }
    }
    
    if (!$found_assets) {
        echo "<p><span class='warning'>Aucun asset trouvé dans les dossiers assets/ ou dist/assets/</span></p>";
    }
    
    echo "<h2>Contenu du fichier index.html</h2>";
    echo "<pre>" . htmlspecialchars($content) . "</pre>";
    
    echo "<h2>Actions recommandées</h2>";
    echo "<ol>";
    echo "<li>Utilisez <a href='create-default-css.php'>create-default-css.php</a> pour créer un fichier CSS par défaut si nécessaire</li>";
    echo "<li>Utilisez <a href='fix-missing-references.php'>fix-missing-references.php</a> pour mettre à jour les références dans index.html</li>";
    echo "<li>Si vous avez des erreurs de chargement des assets, vérifiez les chemins et les permissions des fichiers</li>";
    echo "</ol>";
    ?>
</body>
</html>
