
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification du Build</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Vérification du Build et Déploiement</h1>
    
    <div class="section">
        <h2>Structure des dossiers</h2>
        <?php
        $critical_dirs = [
            '.' => 'Racine',
            './assets' => 'Dossier assets',
            './api' => 'Dossier API',
            './dist' => 'Dossier dist (build)'
        ];
        
        foreach ($critical_dirs as $dir => $label) {
            echo "<p>$label ($dir): ";
            if (is_dir($dir)) {
                $files = scandir($dir);
                $file_count = count($files) - 2; // Moins . et ..
                echo "<span class='success'>EXISTE</span> ($file_count fichiers/dossiers)";
            } else {
                echo "<span class='error'>N'EXISTE PAS</span>";
            }
            echo "</p>";
        }
        ?>
    </div>

    <div class="section">
        <h2>Fichiers JavaScript et CSS</h2>
        <?php
        // Vérifier dans les différents emplacements possibles
        $locations = [
            './assets' => 'Assets à la racine',
            './dist/assets' => 'Assets dans le build'
        ];
        
        foreach ($locations as $dir => $label) {
            echo "<h3>$label</h3>";
            
            if (is_dir($dir)) {
                $js_files = glob("$dir/*.js");
                $css_files = glob("$dir/*.css");
                
                echo "<p>Fichiers JavaScript: ";
                if (!empty($js_files)) {
                    echo "<span class='success'>TROUVÉS</span> (" . count($js_files) . " fichiers)<br>";
                    foreach ($js_files as $file) {
                        echo "- " . basename($file) . " (" . round(filesize($file)/1024, 2) . " KB)<br>";
                    }
                } else {
                    echo "<span class='error'>AUCUN</span>";
                }
                echo "</p>";
                
                echo "<p>Fichiers CSS: ";
                if (!empty($css_files)) {
                    echo "<span class='success'>TROUVÉS</span> (" . count($css_files) . " fichiers)<br>";
                    foreach ($css_files as $file) {
                        echo "- " . basename($file) . " (" . round(filesize($file)/1024, 2) . " KB)<br>";
                    }
                } else {
                    echo "<span class='error'>AUCUN</span>";
                }
                echo "</p>";
            } else {
                echo "<p><span class='error'>DOSSIER N'EXISTE PAS</span></p>";
            }
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Vérification de index.html</h2>
        <?php
        $index_locations = [
            './index.html' => 'Index à la racine',
            './dist/index.html' => 'Index dans le build'
        ];
        
        foreach ($index_locations as $file => $label) {
            echo "<h3>$label</h3>";
            
            if (file_exists($file)) {
                $content = file_get_contents($file);
                $size = round(filesize($file)/1024, 2);
                echo "<p><span class='success'>EXISTE</span> ($size KB)</p>";
                
                // Chercher des références JS et CSS
                $js_refs = preg_match_all('/<script[^>]*src=[\'"]([^\'"]+)[\'"][^>]*>/i', $content, $js_matches);
                $css_refs = preg_match_all('/<link[^>]*href=[\'"]([^\'"]+)[\'"][^>]*rel=[\'"]stylesheet[\'"][^>]*>/i', $content, $css_matches)
                         + preg_match_all('/<link[^>]*rel=[\'"]stylesheet[\'"][^>]*href=[\'"]([^\'"]+)[\'"][^>]*>/i', $content, $css_matches2);
                
                echo "<p>Références JavaScript: ";
                if ($js_refs > 0) {
                    echo "<span class='success'>TROUVÉES</span> ($js_refs références)<br>";
                    foreach ($js_matches[1] as $match) {
                        echo "- $match<br>";
                    }
                } else {
                    echo "<span class='error'>AUCUNE</span>";
                }
                echo "</p>";
                
                echo "<p>Références CSS: ";
                if ($css_refs > 0) {
                    echo "<span class='success'>TROUVÉES</span> ($css_refs références)<br>";
                    if (!empty($css_matches[1])) {
                        foreach ($css_matches[1] as $match) {
                            echo "- $match<br>";
                        }
                    }
                    if (!empty($css_matches2[1])) {
                        foreach ($css_matches2[1] as $match) {
                            echo "- $match<br>";
                        }
                    }
                } else {
                    echo "<span class='error'>AUCUNE</span>";
                }
                echo "</p>";
                
                // Vérifier si les références sont correctes
                $has_src_js = strpos($content, 'src="/src/') !== false;
                $has_assets_js = strpos($content, 'src="/assets/') !== false;
                
                if ($has_src_js) {
                    echo "<p><span class='warning'>Attention:</span> Le fichier fait référence à des scripts dans /src/ qui pourraient ne pas exister en production.</p>";
                }
                
                if (!$has_assets_js && !$has_src_js) {
                    echo "<p><span class='error'>Problème:</span> Aucune référence à des scripts JavaScript n'a été trouvée.</p>";
                }
                
                echo "<h4>Extrait du fichier index.html:</h4>";
                echo "<pre>" . htmlspecialchars(substr($content, 0, 1000)) . "...</pre>";
            } else {
                echo "<p><span class='error'>FICHIER N'EXISTE PAS</span></p>";
            }
        }
        ?>
    </div>

    <div class="section">
        <h2>Actions recommandées</h2>
        <ol>
            <li>Si vous ne voyez pas de fichiers dans <code>dist/assets</code>, assurez-vous d'exécuter <code>npm run build</code>.</li>
            <li>Si vous voyez des fichiers dans <code>dist/assets</code> mais pas à la racine, copiez-les avec <a href="copy-assets.php">copy-assets.php</a>.</li>
            <li>Vérifiez que <code>index.html</code> fait référence aux bons chemins d'assets (généralement <code>/assets/...</code>).</li>
            <li>Utilisez <a href="deploy-check.php">deploy-check.php</a> pour vérifier l'état global du déploiement.</li>
            <li>Si le déploiement GitHub Actions échoue, vérifiez que le workflow est correctement configuré avec les bonnes permissions et secrets.</li>
        </ol>
    </div>
</body>
</html>
