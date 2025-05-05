
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic des Assets</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Diagnostic des Chemins d'Assets</h1>
    
    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 5px solid #4CAF50; border-radius: 3px;">
        <p>Cet outil analyse les chemins d'assets de votre application et vous aide à diagnostiquer les problèmes de références.</p>
    </div>
    
    <h2>Vérification des chemins d'assets</h2>
    <?php
    // Vérifier différents chemins possibles pour le dossier assets
    $paths = [
        './assets' => 'Chemin relatif au répertoire courant',
        '../assets' => 'Chemin relatif au répertoire parent',
        '/assets' => 'Chemin absolu depuis la racine du serveur',
        $_SERVER['DOCUMENT_ROOT'] . '/assets' => 'Chemin absolu depuis DOCUMENT_ROOT',
        dirname($_SERVER['DOCUMENT_ROOT']) . '/assets' => 'Chemin absolu depuis le parent de DOCUMENT_ROOT',
    ];
    
    echo "<table style='width:100%; border-collapse: collapse;'>
          <tr style='background-color:#f0f0f0;'>
            <th style='text-align:left; padding:8px; border:1px solid #ddd;'>Chemin</th>
            <th style='text-align:left; padding:8px; border:1px solid #ddd;'>Description</th>
            <th style='text-align:left; padding:8px; border:1px solid #ddd;'>Statut</th>
          </tr>";
    
    foreach ($paths as $path => $description) {
        $exists = file_exists($path);
        $status_class = $exists ? 'success' : 'error';
        $status_text = $exists ? 'Existe' : 'N\'existe pas';
        
        echo "<tr>
                <td style='padding:8px; border:1px solid #ddd;'>{$path}</td>
                <td style='padding:8px; border:1px solid #ddd;'>{$description}</td>
                <td style='padding:8px; border:1px solid #ddd;'><span class='{$status_class}'>{$status_text}</span></td>
              </tr>";
    }
    
    echo "</table>";
    ?>
    
    <h2>Assets trouvés</h2>
    <?php
    // Fonction pour trouver les assets
    function findAssets($dir) {
        if (!file_exists($dir)) {
            return ['js' => [], 'css' => []];
        }
        
        $js_files = glob($dir . '/*.js');
        $css_files = glob($dir . '/*.css');
        
        return [
            'js' => $js_files,
            'css' => $css_files
        ];
    }
    
    // Vérifier les assets dans différents chemins
    $all_assets = [];
    foreach ($paths as $path => $description) {
        if (file_exists($path)) {
            $all_assets[$path] = findAssets($path);
        }
    }
    
    // Afficher les assets trouvés
    if (empty($all_assets)) {
        echo "<p><span class='error'>Aucun dossier assets trouvé!</span></p>";
    } else {
        foreach ($all_assets as $path => $assets) {
            echo "<h3>Assets dans {$path}</h3>";
            
            if (empty($assets['js']) && empty($assets['css'])) {
                echo "<p><span class='warning'>Aucun fichier JS ou CSS trouvé dans ce dossier</span></p>";
                continue;
            }
            
            // JavaScript files
            if (!empty($assets['js'])) {
                echo "<h4>Fichiers JavaScript</h4>";
                echo "<ul>";
                foreach ($assets['js'] as $file) {
                    echo "<li>" . basename($file) . " - " . round(filesize($file) / 1024, 2) . " KB</li>";
                }
                echo "</ul>";
            }
            
            // CSS files
            if (!empty($assets['css'])) {
                echo "<h4>Fichiers CSS</h4>";
                echo "<ul>";
                foreach ($assets['css'] as $file) {
                    echo "<li>" . basename($file) . " - " . round(filesize($file) / 1024, 2) . " KB</li>";
                }
                echo "</ul>";
            }
        }
    }
    ?>
    
    <h2>Analyse du fichier index.html</h2>
    <?php
    $index_file = $_SERVER['DOCUMENT_ROOT'] . '/index.html';
    
    if (file_exists($index_file)) {
        $content = file_get_contents($index_file);
        echo "<p><span class='success'>Fichier index.html trouvé!</span></p>";
        
        // Analyser les références CSS
        preg_match_all('/<link[^>]*href=[\'"]([^\'"]*)[\'"][^>]*>/i', $content, $css_matches);
        echo "<h4>Références CSS trouvées:</h4>";
        if (!empty($css_matches[1])) {
            echo "<ul>";
            foreach ($css_matches[1] as $href) {
                if (strpos($href, '.css') !== false) {
                    echo "<li>{$href}</li>";
                }
            }
            echo "</ul>";
        } else {
            echo "<p><span class='warning'>Aucune référence CSS trouvée</span></p>";
        }
        
        // Analyser les références JS
        preg_match_all('/<script[^>]*src=[\'"]([^\'"]*)[\'"][^>]*>/i', $content, $js_matches);
        echo "<h4>Références JavaScript trouvées:</h4>";
        if (!empty($js_matches[1])) {
            echo "<ul>";
            foreach ($js_matches[1] as $src) {
                if (strpos($src, '.js') !== false && strpos($src, 'cdn.gpteng.co') === false) {
                    echo "<li>{$src}</li>";
                }
            }
            echo "</ul>";
        } else {
            echo "<p><span class='warning'>Aucune référence JavaScript trouvée</span></p>";
        }
    } else {
        echo "<p><span class='error'>Fichier index.html introuvable!</span></p>";
    }
    ?>
    
    <h2>Recommandations</h2>
    <ol>
        <li>Vérifiez que le dossier <code>assets</code> est correctement placé à la racine du site. Si ce n'est pas le cas, copiez le contenu du dossier <code>dist/assets</code> vers la racine du site.</li>
        <li>Assurez-vous que le fichier <code>index.html</code> référence correctement les fichiers JS et CSS avec les bons chemins (commençant généralement par <code>/assets/</code>).</li>
        <li>Dans le fichier <code>vite.config.ts</code>, vérifiez que <code>assetsDir</code> est bien configuré comme <code>assets</code> et que <code>base</code> est défini à <code>/</code>.</li>
        <li>Si aucun fichier CSS ou JS n'est trouvé, assurez-vous que le build a été correctement exécuté avec <code>npm run build</code>.</li>
        <li>Pour des solutions automatisées, exécutez le script <code>fix-assets-runtime.php</code> à la racine du site.</li>
    </ol>
</body>
</html>
