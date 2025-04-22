
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des Références aux Assets</title>
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
    // Fonction pour trouver les fichiers compilés
    function findCompiledAssets() {
        $assets = [
            'js' => [],
            'css' => []
        ];
        
        $js_files = glob('./assets/*.js');
        $css_files = glob('./assets/*.css');
        
        if (!empty($js_files)) {
            foreach ($js_files as $file) {
                if (strpos(basename($file), 'main-') === 0) {
                    $assets['js']['main'] = '/assets/' . basename($file);
                }
            }
            
            if (!isset($assets['js']['main']) && !empty($js_files)) {
                $assets['js']['main'] = '/assets/' . basename($js_files[0]);
            }
        }
        
        if (!empty($css_files)) {
            foreach ($css_files as $file) {
                if (strpos(basename($file), 'index-') === 0) {
                    $assets['css']['main'] = '/assets/' . basename($file);
                }
            }
            
            if (!isset($assets['css']['main']) && !empty($css_files)) {
                $assets['css']['main'] = '/assets/' . basename($css_files[0]);
            }
        }
        
        return $assets;
    }
    
    // Information sur l'environnement
    echo "<h2>Environnement</h2>";
    echo "<ul>";
    echo "<li>Serveur Web: " . $_SERVER['SERVER_SOFTWARE'] . "</li>";
    echo "<li>PHP Version: " . phpversion() . "</li>";
    echo "<li>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</li>";
    echo "<li>Script Path: " . __FILE__ . "</li>";
    echo "</ul>";
    
    // Vérifier l'index.html et les assets
    echo "<h2>Vérification des Fichiers</h2>";
    
    if (file_exists('./index.html')) {
        echo "<p>Fichier index.html: <span class='success'>TROUVÉ</span></p>";
        $index_content = file_get_contents('./index.html');
    } else {
        echo "<p>Fichier index.html: <span class='error'>NON TROUVÉ</span></p>";
        exit;
    }
    
    // Chercher les assets compilés
    $assets = findCompiledAssets();
    
    echo "<h3>Assets Trouvés</h3>";
    echo "<ul>";
    if (!empty($assets['js']['main'])) {
        echo "<li>JavaScript principal: <span class='success'>" . $assets['js']['main'] . "</span></li>";
    } else {
        echo "<li>JavaScript principal: <span class='error'>NON TROUVÉ</span></li>";
    }
    
    if (!empty($assets['css']['main'])) {
        echo "<li>CSS principal: <span class='success'>" . $assets['css']['main'] . "</span></li>";
    } else {
        echo "<li>CSS principal: <span class='error'>NON TROUVÉ</span></li>";
    }
    echo "</ul>";
    
    // Appliquer les modifications
    if (isset($_POST['fix_assets'])) {
        echo "<h2>Application des Modifications</h2>";
        
        // Créer une sauvegarde
        copy('./index.html', './index.html.bak');
        
        $new_content = $index_content;
        
        // Vérifier si le lien CSS existe déjà
        $has_css = preg_match('/<link[^>]*rel=["\']stylesheet["\']/i', $new_content);
        
        // Ajouter ou remplacer le lien CSS
        if (!empty($assets['css']['main'])) {
            if (!$has_css) {
                // Ajouter le lien CSS avant la fermeture de head
                $new_content = preg_replace(
                    '/<\/head>/',
                    '  <link rel="stylesheet" href="' . $assets['css']['main'] . '">' . "\n" . '</head>',
                    $new_content
                );
                echo "<p>Ajout du lien CSS: <span class='success'>OK</span></p>";
            } else {
                // Remplacer le lien CSS existant
                $new_content = preg_replace(
                    '/<link[^>]*rel=["\']stylesheet["\'](.*?)>/i',
                    '<link rel="stylesheet" href="' . $assets['css']['main'] . '">',
                    $new_content
                );
                echo "<p>Mise à jour du lien CSS: <span class='success'>OK</span></p>";
            }
        }
        
        // Vérifier si le script JS existe déjà
        $has_js = preg_match('/<script[^>]*src=["\'][^"\']*main/i', $new_content);
        
        // Ajouter ou remplacer le script JS
        if (!empty($assets['js']['main'])) {
            if (!$has_js) {
                // Ajouter le script JS avant la fermeture de body
                $new_content = preg_replace(
                    '/<script src="https:\/\/cdn\.gpteng\.co\/gptengineer\.js"/',
                    '<script type="module" src="' . $assets['js']['main'] . '"></script>' . "\n" . '  <script src="https://cdn.gpteng.co/gptengineer.js"',
                    $new_content
                );
                echo "<p>Ajout du script JS: <span class='success'>OK</span></p>";
            } else {
                // Remplacer le script JS existant
                $new_content = preg_replace(
                    '/<script[^>]*src=["\'][^"\']*main[^"\']*["\']/i',
                    '<script type="module" src="' . $assets['js']['main'] . '"',
                    $new_content
                );
                echo "<p>Mise à jour du script JS: <span class='success'>OK</span></p>";
            }
        }
        
        // Enregistrer les modifications
        if (file_put_contents('./index.html', $new_content)) {
            echo "<p>Enregistrement de index.html: <span class='success'>OK</span></p>";
            echo "<p>Une sauvegarde a été créée dans index.html.bak</p>";
        } else {
            echo "<p>Enregistrement de index.html: <span class='error'>ÉCHEC</span></p>";
        }
        
        echo "<h3>Nouveau Contenu de index.html</h3>";
        echo "<pre>" . htmlspecialchars($new_content) . "</pre>";
        
    } else {
        // Afficher le formulaire pour appliquer les modifications
        echo "<h2>Appliquer les Modifications</h2>";
        
        if (!empty($assets['js']['main']) || !empty($assets['css']['main'])) {
            echo "<form method='post'>";
            echo "<p>Ce script va mettre à jour index.html pour référencer les fichiers compilés.</p>";
            echo "<input type='hidden' name='fix_assets' value='1'>";
            echo "<button type='submit' class='button'>Appliquer les Modifications</button>";
            echo "</form>";
        } else {
            echo "<p><span class='warning'>Aucun asset compilé trouvé. Générez d'abord les fichiers avec 'npm run build'.</span></p>";
        }
    }
    ?>
    
    <h2>Instructions Manuelles</h2>
    <ol>
        <li>Exécutez <code>npm run build</code> pour générer les fichiers compilés</li>
        <li>Vérifiez que les fichiers compilés existent dans le dossier <code>assets/</code></li>
        <li>Utilisez ce script pour mettre à jour les références dans index.html</li>
        <li>Testez l'application pour vérifier qu'elle fonctionne correctement</li>
    </ol>
</body>
</html>
