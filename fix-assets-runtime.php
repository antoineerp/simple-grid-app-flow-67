
<?php
header('Content-Type: text/html; charset=utf-8');
require_once 'utils-assets.php';
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
    $main_js = find_main_js();
    $main_css = find_main_css();
    
    echo "<h3>Assets Trouvés</h3>";
    echo "<ul>";
    if ($main_js) {
        echo "<li>JavaScript principal: <span class='success'>" . $main_js . "</span></li>";
    } else {
        echo "<li>JavaScript principal: <span class='error'>NON TROUVÉ</span></li>";
    }
    
    if ($main_css) {
        echo "<li>CSS principal: <span class='success'>" . $main_css . "</span></li>";
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
        if ($main_css) {
            if (!$has_css) {
                // Ajouter le lien CSS avant la fermeture de head
                $new_content = preg_replace(
                    '/<\/head>/',
                    '  <link rel="stylesheet" href="/assets/' . $main_css . '">' . "\n" . '</head>',
                    $new_content
                );
                echo "<p>Ajout du lien CSS: <span class='success'>OK</span></p>";
            } else {
                // Remplacer le lien CSS existant
                $new_content = preg_replace(
                    '/<link[^>]*rel=["\']stylesheet["\'](.*?)>/i',
                    '<link rel="stylesheet" href="/assets/' . $main_css . '">',
                    $new_content
                );
                echo "<p>Mise à jour du lien CSS: <span class='success'>OK</span></p>";
            }
        }
        
        // Vérifier si le script JS existe déjà
        $js_pattern = '/<script[^>]*src=["\'][^"\']*\.(js)["\']/i';
        $has_js = preg_match($js_pattern, $new_content);
        
        // Ajouter ou remplacer le script JS
        if ($main_js) {
            if (!$has_js) {
                // Ajouter le script JS avant la fermeture de body
                $new_content = preg_replace(
                    '/<script src="https:\/\/cdn\.gpteng\.co\/gptengineer\.js"/',
                    '<script type="module" src="/assets/' . $main_js . '"></script>' . "\n" . '  <script src="https://cdn.gpteng.co/gptengineer.js"',
                    $new_content
                );
                echo "<p>Ajout du script JS: <span class='success'>OK</span></p>";
            } else {
                // Remplacer le script JS existant qui n'est pas le script gptengineer.js
                $new_content = preg_replace(
                    '/<script[^>]*src=["\'][^"\']*\.(js)["\']/i',
                    '<script type="module" src="/assets/' . $main_js . '"',
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
        
        if ($main_js || $main_css) {
            echo "<form method='post'>";
            echo "<p>Ce script va mettre à jour index.html pour référencer les fichiers compilés.</p>";
            echo "<input type='hidden' name='fix_assets' value='1'>";
            echo "<button type='submit' class='button'>Appliquer les Modifications</button>";
            echo "</form>";
        } else {
            echo "<p><span class='warning'>Aucun asset compilé trouvé. Assurez-vous que les fichiers existent dans le dossier assets/.</span></p>";
        }
    }
    ?>
    
    <h2>Instructions Manuelles</h2>
    <ol>
        <li>Vérifiez que les fichiers compilés existent dans le dossier <code>assets/</code></li>
        <li>Utilisez ce script pour mettre à jour les références dans index.html</li>
        <li>Testez l'application pour vérifier qu'elle fonctionne correctement</li>
        <li>En cas de problème, videz le cache du navigateur et réessayez</li>
    </ol>
</body>
</html>
