
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des Assets</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Correction des Références aux Assets</h1>
    
    <?php
    // Configuration
    $indexPath = './index.html';
    $assetsDir = './assets';
    $distAssetsDir = './dist/assets';
    $backupSuffix = '.bak-' . date('Ymd-His');
    
    // Fonction pour trouver les derniers fichiers CSS et JS
    function findLatestAssets($directory) {
        $result = ['js' => null, 'css' => null];
        
        if (!is_dir($directory)) {
            return $result;
        }
        
        $files = scandir($directory);
        $jsFiles = [];
        $cssFiles = [];
        
        foreach ($files as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'js') {
                $jsFiles[] = $file;
            } elseif (pathinfo($file, PATHINFO_EXTENSION) === 'css') {
                $cssFiles[] = $file;
            }
        }
        
        // Trouver le fichier main/index JS
        foreach ($jsFiles as $file) {
            if (strpos($file, 'main-') === 0 || strpos($file, 'index-') === 0) {
                $result['js'] = $file;
                break;
            }
        }
        
        // Si pas de main/index trouvé, prendre le premier JS
        if (!$result['js'] && !empty($jsFiles)) {
            $result['js'] = $jsFiles[0];
        }
        
        // Trouver le fichier CSS
        foreach ($cssFiles as $file) {
            if (strpos($file, 'index-') === 0 || strpos($file, 'main-') === 0) {
                $result['css'] = $file;
                break;
            }
        }
        
        // Si pas de main/index CSS trouvé, prendre le premier CSS
        if (!$result['css'] && !empty($cssFiles)) {
            $result['css'] = $cssFiles[0];
        }
        
        return $result;
    }
    
    // Fonction pour copier les assets de dist vers assets si nécessaire
    function ensureAssets() {
        global $assetsDir, $distAssetsDir;
        
        if (!is_dir($assetsDir)) {
            mkdir($assetsDir, 0755, true);
            echo "<p>Dossier 'assets' créé.</p>";
        }
        
        if (is_dir($distAssetsDir) && count(glob("$assetsDir/*")) == 0) {
            echo "<p>Copie des assets depuis 'dist/assets' vers 'assets'...</p>";
            $distFiles = glob("$distAssetsDir/*");
            foreach ($distFiles as $file) {
                $filename = basename($file);
                copy($file, "$assetsDir/$filename");
            }
            echo "<p><span class='success'>Assets copiés avec succès!</span></p>";
        }
    }
    
    // Afficher les informations du serveur
    echo "<h2>Informations Serveur</h2>";
    echo "<ul>";
    echo "<li>PHP Version: " . phpversion() . "</li>";
    echo "<li>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</li>";
    echo "<li>Script Path: " . __FILE__ . "</li>";
    echo "</ul>";
    
    // Vérifier l'existence du fichier index.html
    if (!file_exists($indexPath)) {
        echo "<p><span class='error'>ERREUR: Le fichier index.html n'existe pas!</span></p>";
        exit;
    }
    
    // Vérifier les assets et éventuellement les copier
    ensureAssets();
    
    // Trouver les assets
    $assets = findLatestAssets($assetsDir);
    
    echo "<h2>Assets Détectés</h2>";
    echo "<ul>";
    if ($assets['js']) {
        echo "<li>JavaScript: <span class='success'>" . $assets['js'] . "</span></li>";
    } else {
        echo "<li>JavaScript: <span class='error'>Non trouvé</span></li>";
    }
    
    if ($assets['css']) {
        echo "<li>CSS: <span class='success'>" . $assets['css'] . "</span></li>";
    } else {
        echo "<li>CSS: <span class='error'>Non trouvé</span></li>";
    }
    echo "</ul>";
    
    // Lire le contenu de index.html
    $indexContent = file_get_contents($indexPath);
    
    // Vérifier les références actuelles
    $hasJsRef = preg_match('/<script[^>]*src=["\'](\/assets\/[^"\']*\.js)["\'][^>]*>/', $indexContent, $jsMatches);
    $hasCssRef = preg_match('/<link[^>]*href=["\'](\/assets\/[^"\']*\.css)["\'][^>]*>/', $indexContent, $cssMatches);
    $hasSrcRef = preg_match('/<script[^>]*src=["\'](\/src\/[^"\']*)["\'][^>]*>/', $indexContent);
    
    echo "<h2>Références Actuelles dans index.html</h2>";
    echo "<ul>";
    echo "<li>Référence à JavaScript dans /assets/: " . ($hasJsRef ? "<span class='success'>OUI</span> (" . $jsMatches[1] . ")" : "<span class='warning'>NON</span>") . "</li>";
    echo "<li>Référence à CSS dans /assets/: " . ($hasCssRef ? "<span class='success'>OUI</span> (" . $cssMatches[1] . ")" : "<span class='warning'>NON</span>") . "</li>";
    echo "<li>Référence à source dans /src/: " . ($hasSrcRef ? "<span class='warning'>OUI</span> (doit être remplacée)" : "<span class='success'>NON</span>") . "</li>";
    echo "</ul>";
    
    // Appliquer les modifications si demandé
    if (isset($_POST['fix_assets']) && ($assets['js'] || $assets['css'])) {
        
        // Créer une sauvegarde
        $backupPath = $indexPath . $backupSuffix;
        if (copy($indexPath, $backupPath)) {
            echo "<p>Sauvegarde créée: <span class='success'>" . basename($backupPath) . "</span></p>";
        }
        
        $newContent = $indexContent;
        $changes = [];
        
        // Mettre à jour la référence JavaScript
        if ($assets['js']) {
            if ($hasSrcRef) {
                // Remplacer la référence à /src/
                $newContent = preg_replace(
                    '/<script[^>]*src=["\'](\/src\/[^"\']*)["\'][^>]*>/',
                    '<script type="module" src="/assets/' . $assets['js'] . '">',
                    $newContent
                );
                $changes[] = "Remplacé la référence à /src/ par /assets/" . $assets['js'];
            } elseif ($hasJsRef) {
                // Mettre à jour la référence à /assets/
                $newContent = preg_replace(
                    '/<script[^>]*src=["\'](\/assets\/[^"\']*\.js)["\'][^>]*>/',
                    '<script type="module" src="/assets/' . $assets['js'] . '">',
                    $newContent
                );
                $changes[] = "Mis à jour la référence JavaScript vers /assets/" . $assets['js'];
            } else {
                // Ajouter une nouvelle référence avant la fermeture de body
                $newContent = preg_replace(
                    '/<\/body>/',
                    '  <script type="module" src="/assets/' . $assets['js'] . '"></script>' . "\n  </body>",
                    $newContent
                );
                $changes[] = "Ajouté une nouvelle référence JavaScript à /assets/" . $assets['js'];
            }
        }
        
        // Mettre à jour la référence CSS
        if ($assets['css']) {
            if ($hasCssRef) {
                // Mettre à jour la référence à /assets/
                $newContent = preg_replace(
                    '/<link[^>]*href=["\'](\/assets\/[^"\']*\.css)["\'][^>]*>/',
                    '<link rel="stylesheet" href="/assets/' . $assets['css'] . '">',
                    $newContent
                );
                $changes[] = "Mis à jour la référence CSS vers /assets/" . $assets['css'];
            } else {
                // Ajouter une nouvelle référence avant la fermeture de head
                $newContent = preg_replace(
                    '/<\/head>/',
                    '  <link rel="stylesheet" href="/assets/' . $assets['css'] . '">' . "\n  </head>",
                    $newContent
                );
                $changes[] = "Ajouté une nouvelle référence CSS à /assets/" . $assets['css'];
            }
        }
        
        // Enregistrer les modifications
        if (file_put_contents($indexPath, $newContent)) {
            echo "<h2>Modifications Appliquées</h2>";
            echo "<ul>";
            foreach ($changes as $change) {
                echo "<li><span class='success'>" . $change . "</span></li>";
            }
            echo "</ul>";
            
            echo "<p>Contenu mis à jour du fichier index.html:</p>";
            echo "<pre>" . htmlspecialchars($newContent) . "</pre>";
            
            echo "<p><strong>IMPORTANT:</strong> Videz le cache de votre navigateur pour voir les changements.</p>";
        } else {
            echo "<p><span class='error'>ERREUR: Impossible d'écrire dans le fichier index.html!</span></p>";
        }
        
    } else {
        // Afficher le formulaire
        echo "<h2>Appliquer les Modifications</h2>";
        
        if (!$assets['js'] && !$assets['css']) {
            echo "<p><span class='warning'>Aucun fichier d'assets trouvé. Vous devez d'abord générer un build:</span></p>";
            echo "<ol>";
            echo "<li>Exécutez <code>npm run build</code></li>";
            echo "<li>Vérifiez que des fichiers sont créés dans <code>dist/assets</code></li>";
            echo "<li>Rechargez cette page</li>";
            echo "</ol>";
        } else {
            echo "<form method='post' action=''>";
            echo "<input type='hidden' name='fix_assets' value='1'>";
            echo "<p>Ce script va mettre à jour les références aux fichiers CSS et JavaScript dans index.html:</p>";
            echo "<ul>";
            if ($assets['js']) echo "<li>JavaScript: " . $assets['js'] . "</li>";
            if ($assets['css']) echo "<li>CSS: " . $assets['css'] . "</li>";
            echo "</ul>";
            echo "<input type='submit' class='button' value='Appliquer les modifications'>";
            echo "</form>";
        }
    }
    ?>
    
    <h2>Guide de Déploiement</h2>
    <ol>
        <li>Générez un build avec <code>npm run build</code></li>
        <li>Assurez-vous que des fichiers sont créés dans <code>dist/assets</code></li>
        <li>Utilisez ce script pour mettre à jour les références dans index.html</li>
        <li>Videz le cache de votre navigateur</li>
        <li>Testez l'application</li>
    </ol>
</body>
</html>
