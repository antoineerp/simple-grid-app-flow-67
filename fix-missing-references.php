
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des Références CSS/JS</title>
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
    <h1>Correction des Références CSS/JS</h1>
    
    <?php
    // Fonction pour trouver les fichiers compilés
    function findCompiledAssets() {
        $assets = [
            'js' => [],
            'css' => []
        ];
        
        // Chercher dans différents dossiers possibles
        $searchDirs = ['./assets', './dist/assets'];
        
        foreach ($searchDirs as $dir) {
            if (is_dir($dir)) {
                // Chercher les fichiers JS
                $js_files = glob($dir . '/*.js');
                foreach ($js_files as $file) {
                    $filename = basename($file);
                    if (preg_match('/main\..*\.js/', $filename) || $filename === 'main.js') {
                        $assets['js']['main'] = '/' . $dir . '/' . $filename;
                    }
                }
                
                // Chercher les fichiers CSS
                $css_files = glob($dir . '/*.css');
                foreach ($css_files as $file) {
                    $filename = basename($file);
                    if (preg_match('/main\..*\.css/', $filename) || $filename === 'main.css' || 
                        preg_match('/index\..*\.css/', $filename) || $filename === 'index.css') {
                        $assets['css']['main'] = '/' . $dir . '/' . $filename;
                    }
                }
            }
        }
        
        return $assets;
    }
    
    // Information sur l'environnement
    echo "<h2>Environnement</h2>";
    echo "<ul>";
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
    
    // Vérifier les références actuelles
    $has_js_ref = preg_match('/<script[^>]*src=[\'"]\/assets\/main[^"\']*\.js[\'"][^>]*>/i', $index_content);
    $has_css_ref = preg_match('/<link[^>]*href=[\'"]\/assets\/[^"\']*\.css[\'"][^>]*>/i', $index_content);
    
    echo "<p>Référence à un fichier JavaScript principal: " . ($has_js_ref ? "<span class='success'>TROUVÉE</span>" : "<span class='error'>NON TROUVÉE</span>") . "</p>";
    echo "<p>Référence à un fichier CSS principal: " . ($has_css_ref ? "<span class='success'>TROUVÉE</span>" : "<span class='error'>NON TROUVÉE</span>") . "</p>";
    
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
    
    // Créer un CSS par défaut si aucun n'est trouvé
    if (empty($assets['css']['main'])) {
        $default_css_content = "/* CSS par défaut généré automatiquement */\n";
        $default_css_content .= "body { font-family: sans-serif; }\n";
        $default_css_content .= ".app-container { max-width: 1200px; margin: 0 auto; padding: 20px; }\n";
        $default_css_content .= "/* Styles spécifiques à l'application */\n";
        
        // Créer le dossier assets s'il n'existe pas
        if (!is_dir('./assets')) {
            mkdir('./assets', 0755, true);
        }
        
        // Écrire le fichier CSS par défaut
        $css_path = './assets/main.css';
        file_put_contents($css_path, $default_css_content);
        $assets['css']['main'] = '/assets/main.css';
        echo "<p><span class='warning'>CSS par défaut créé: $css_path</span></p>";
    }
    
    // Appliquer les modifications
    if (isset($_POST['fix_references'])) {
        echo "<h2>Application des Modifications</h2>";
        
        // Créer une sauvegarde
        copy('./index.html', './index.html.bak');
        
        $new_content = $index_content;
        
        // Ajouter ou remplacer le script JS
        if (!empty($assets['js']['main'])) {
            if (!$has_js_ref) {
                // Ajouter le script JS avant la fermeture de body
                $new_content = preg_replace(
                    '/<\/body>/',
                    '  <script type="module" src="' . $assets['js']['main'] . '"></script>' . "\n  " . '</body>',
                    $new_content
                );
                echo "<p>Ajout du script JS: <span class='success'>OK</span></p>";
            } else {
                // Remplacer le script JS existant
                $new_content = preg_replace(
                    '/<script[^>]*src=[\'"]\/assets\/[^"\']*\.js[\'"][^>]*>/',
                    '<script type="module" src="' . $assets['js']['main'] . '">',
                    $new_content
                );
                echo "<p>Mise à jour du script JS: <span class='success'>OK</span></p>";
            }
        }
        
        // Ajouter ou remplacer le lien CSS
        if (!empty($assets['css']['main'])) {
            if (!$has_css_ref) {
                // Ajouter le lien CSS avant la fermeture de head
                $new_content = preg_replace(
                    '/<\/head>/',
                    '  <link rel="stylesheet" href="' . $assets['css']['main'] . '">' . "\n  " . '</head>',
                    $new_content
                );
                echo "<p>Ajout du lien CSS: <span class='success'>OK</span></p>";
            } else {
                // Remplacer le lien CSS existant
                $new_content = preg_replace(
                    '/<link[^>]*href=[\'"]\/assets\/[^"\']*\.css[\'"][^>]*>/',
                    '<link rel="stylesheet" href="' . $assets['css']['main'] . '">',
                    $new_content
                );
                echo "<p>Mise à jour du lien CSS: <span class='success'>OK</span></p>";
            }
        }
        
        // Enregistrer les modifications
        if (file_put_contents('./index.html', $new_content)) {
            echo "<p>Enregistrement de index.html: <span class='success'>OK</span></p>";
            echo "<p>Une sauvegarde a été créée dans index.html.bak</p>";
        } else {
            echo "<p>Enregistrement de index.html: <span class='error'>ÉCHEC</span></p>";
        }
        
        echo "<h3>Contenu du fichier index.html mis à jour</h3>";
        echo "<pre>" . htmlspecialchars($new_content) . "</pre>";
        
    } else {
        // Afficher le formulaire pour appliquer les modifications
        echo "<h2>Appliquer les Modifications</h2>";
        
        if (!empty($assets['js']['main']) || !empty($assets['css']['main'])) {
            echo "<form method='post'>";
            echo "<p>Ce script va mettre à jour index.html pour référencer correctement les fichiers JS et CSS.</p>";
            echo "<input type='hidden' name='fix_references' value='1'>";
            echo "<button type='submit' class='button'>Appliquer les Modifications</button>";
            echo "</form>";
        } else {
            echo "<p><span class='warning'>Aucun asset trouvé. Assurez-vous que les fichiers compilés existent.</span></p>";
        }
    }
    ?>
    
    <h2>Instructions Manuelles</h2>
    <ol>
        <li>Si vous venez de déployer l'application, exécutez <code>npm run build</code> pour générer les fichiers compilés</li>
        <li>Assurez-vous que les fichiers compilés existent dans le dossier <code>/assets/</code></li>
        <li>Le script actuel va:
            <ul>
                <li>Trouver les fichiers JS et CSS compilés</li>
                <li>Créer un CSS par défaut si nécessaire</li>
                <li>Mettre à jour index.html pour référencer ces fichiers</li>
            </ul>
        </li>
        <li>Après avoir appliqué les modifications, rafraîchissez votre navigateur pour voir les changements</li>
    </ol>
</body>
</html>
