
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Détection des assets compilés</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2 { color: #334155; }
        .section { margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #f8fafc; }
        .success { color: #15803d; font-weight: 600; }
        .error { color: #b91c1c; font-weight: 600; }
        .warning { color: #b45309; font-weight: 600; }
        .monospace { font-family: monospace; background-color: #f1f5f9; padding: 2px 4px; border-radius: 4px; }
        pre { background-color: #f1f5f9; padding: 10px; border-radius: 4px; overflow: auto; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        table, th, td { border: 1px solid #e2e8f0; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f1f5f9; }
        .action-button { background-color: #3b82f6; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Détection des assets compilés</h1>
    
    <div class="section">
        <h2>Chemins des assets recherchés</h2>
        <?php
        // Liste des dossiers où rechercher les assets
        $asset_paths = [
            './assets/',
            '/assets/',
            '/sites/qualiopi.ch/assets/',
            $_SERVER['DOCUMENT_ROOT'] . '/assets/',
            $_SERVER['DOCUMENT_ROOT'] . '/sites/qualiopi.ch/assets/',
            '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch/assets/'
        ];
        
        echo "<table>";
        echo "<tr><th>Chemin</th><th>Existe</th><th>Contenu</th></tr>";
        
        foreach ($asset_paths as $path) {
            echo "<tr>";
            echo "<td class='monospace'>" . htmlspecialchars($path) . "</td>";
            
            if (is_dir($path)) {
                echo "<td class='success'>Oui</td>";
                $files = scandir($path);
                $js_files = array_filter($files, function($file) {
                    return pathinfo($file, PATHINFO_EXTENSION) === 'js';
                });
                $css_files = array_filter($files, function($file) {
                    return pathinfo($file, PATHINFO_EXTENSION) === 'css';
                });
                
                echo "<td>";
                if (!empty($js_files)) {
                    echo "<strong>Fichiers JS:</strong><br>";
                    echo implode("<br>", array_map('htmlspecialchars', $js_files));
                    echo "<br><br>";
                }
                if (!empty($css_files)) {
                    echo "<strong>Fichiers CSS:</strong><br>";
                    echo implode("<br>", array_map('htmlspecialchars', $css_files));
                }
                if (empty($js_files) && empty($css_files)) {
                    echo "<span class='warning'>Dossier vide ou sans fichiers JS/CSS</span>";
                }
                echo "</td>";
            } else {
                echo "<td class='error'>Non</td>";
                echo "<td>Dossier non trouvé</td>";
            }
            
            echo "</tr>";
        }
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>Index.html actuel</h2>
        <?php
        if (file_exists('./index.html')) {
            $index_content = file_get_contents('./index.html');
            echo "<pre>" . htmlspecialchars($index_content) . "</pre>";
            
            // Analyser si index.html contient des références aux assets
            $has_js_ref = preg_match('/<script[^>]*src="\/assets\/[^"]*\.js"[^>]*>/i', $index_content);
            $has_css_ref = preg_match('/<link[^>]*href="\/assets\/[^"]*\.css"[^>]*>/i', $index_content);
            
            echo "<p>Référence à des JS compilés: " . ($has_js_ref ? "<span class='success'>Oui</span>" : "<span class='error'>Non</span>") . "</p>";
            echo "<p>Référence à des CSS compilés: " . ($has_css_ref ? "<span class='success'>Oui</span>" : "<span class='error'>Non</span>") . "</p>";
        } else {
            echo "<p class='error'>Fichier index.html non trouvé</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Actions disponibles</h2>
        <form method="post">
            <p><button type="submit" name="fix_index" class="action-button">Corriger les références dans index.html</button></p>
        </form>
        
        <?php
        if (isset($_POST['fix_index'])) {
            // Rechercher les assets
            $js_files = glob('./assets/*.js');
            $css_files = glob('./assets/*.css');
            
            if (empty($js_files)) {
                $js_files = glob($_SERVER['DOCUMENT_ROOT'] . '/assets/*.js');
            }
            
            if (empty($css_files)) {
                $css_files = glob($_SERVER['DOCUMENT_ROOT'] . '/assets/*.css');
            }
            
            // Trouver les fichiers principaux
            $main_js = '';
            $main_css = '';
            
            foreach ($js_files as $file) {
                if (strpos(basename($file), 'main-') === 0) {
                    $main_js = '/assets/' . basename($file);
                    break;
                }
            }
            
            foreach ($css_files as $file) {
                if (strpos(basename($file), 'index-') === 0) {
                    $main_css = '/assets/' . basename($file);
                    break;
                }
            }
            
            if ($main_js || $main_css) {
                // Lire le contenu actuel
                $index_content = file_get_contents('./index.html');
                $original_content = $index_content;
                
                // Remplacer les références
                if ($main_js) {
                    // Remplacer la référence au script
                    if (preg_match('/<script[^>]*src="[^"]*"[^>]*type="module"[^>]*><\/script>/', $index_content)) {
                        $index_content = preg_replace(
                            '/<script[^>]*src="[^"]*"[^>]*type="module"[^>]*><\/script>/', 
                            '<script type="module" src="' . $main_js . '"></script>', 
                            $index_content
                        );
                    } else {
                        // Ajouter avant la fermeture du body
                        $index_content = str_replace(
                            '</body>', 
                            '    <script type="module" src="' . $main_js . '"></script>' . "\n  </body>", 
                            $index_content
                        );
                    }
                }
                
                if ($main_css) {
                    // Remplacer la référence au CSS
                    if (preg_match('/<link[^>]*rel="stylesheet"[^>]*href="[^"]*"[^>]*>/', $index_content)) {
                        $index_content = preg_replace(
                            '/<link[^>]*rel="stylesheet"[^>]*href="[^"]*"[^>]*>/', 
                            '<link rel="stylesheet" href="' . $main_css . '" />', 
                            $index_content
                        );
                    } else {
                        // Ajouter avant la fermeture du head
                        $index_content = str_replace(
                            '</head>', 
                            '    <link rel="stylesheet" href="' . $main_css . '" />' . "\n  </head>", 
                            $index_content
                        );
                    }
                }
                
                if ($index_content !== $original_content) {
                    // Sauvegarde de l'original
                    copy('./index.html', './index.html.bak');
                    
                    // Écrire le nouveau contenu
                    file_put_contents('./index.html', $index_content);
                    
                    echo "<p class='success'>Index.html a été mis à jour avec les références aux assets compilés:</p>";
                    if ($main_js) echo "<p>JS: " . htmlspecialchars($main_js) . "</p>";
                    if ($main_css) echo "<p>CSS: " . htmlspecialchars($main_css) . "</p>";
                    echo "<p>Une sauvegarde a été créée dans index.html.bak</p>";
                } else {
                    echo "<p class='warning'>Aucune modification nécessaire dans index.html</p>";
                }
            } else {
                echo "<p class='error'>Aucun fichier JS/CSS principal trouvé dans le dossier assets</p>";
            }
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Diagnostic PHP</h2>
        <?php
        echo "<table>";
        echo "<tr><th>Variable</th><th>Valeur</th></tr>";
        echo "<tr><td>PHP Version</td><td>" . phpversion() . "</td></tr>";
        echo "<tr><td>Document Root</td><td>" . $_SERVER['DOCUMENT_ROOT'] . "</td></tr>";
        echo "<tr><td>Server Software</td><td>" . $_SERVER['SERVER_SOFTWARE'] . "</td></tr>";
        echo "<tr><td>HTTP Host</td><td>" . $_SERVER['HTTP_HOST'] . "</td></tr>";
        echo "<tr><td>Request URI</td><td>" . $_SERVER['REQUEST_URI'] . "</td></tr>";
        echo "</table>";
        
        // Vérifier les permissions
        echo "<h3>Permissions:</h3>";
        $paths_to_check = [
            './',
            './assets/',
            './api/',
            './public/'
        ];
        
        echo "<table>";
        echo "<tr><th>Chemin</th><th>Existe</th><th>Permissions</th><th>Propriétaire</th></tr>";
        
        foreach ($paths_to_check as $path) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($path) . "</td>";
            
            if (file_exists($path)) {
                echo "<td class='success'>Oui</td>";
                echo "<td>" . substr(sprintf('%o', fileperms($path)), -4) . "</td>";
                echo "<td>" . (function_exists('posix_getpwuid') ? posix_getpwuid(fileowner($path))['name'] : fileowner($path)) . "</td>";
            } else {
                echo "<td class='error'>Non</td><td>-</td><td>-</td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>
</body>
</html>
