
<?php
header('Content-Type: text/html; charset=utf-8');
require_once 'utils-directory.php';
require_once 'utils-assets.php';
require_once 'index-validator.php';
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des références dans index.html</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        .fix-button:hover { background: #45a049; }
    </style>
</head>
<body>
    <h1>Correction des références dans index.html</h1>
    
    <div class="section">
        <h2>Analyse du fichier index.html</h2>
        <?php
        $indexPath = '../index.html';
        if (file_exists($indexPath)) {
            echo "<p>Fichier index.html: <span class='success'>EXISTE</span></p>";
            $index_content = file_get_contents($indexPath);
            $refs = validate_index_references($index_content);

            if ($refs['has_js_reference']) {
                echo "<p>Référence à un fichier JavaScript dans /assets/: <span class='success'>TROUVÉE</span></p>";
            } else {
                echo "<p>Référence à un fichier JavaScript dans /assets/: <span class='error'>NON TROUVÉE</span></p>";
            }
            if ($refs['has_css_reference']) {
                echo "<p>Référence à un fichier CSS dans /assets/: <span class='success'>TROUVÉE</span></p>";
            } else {
                echo "<p>Référence à un fichier CSS dans /assets/: <span class='error'>NON TROUVÉE</span></p>";
            }
            if ($refs['has_src_reference']) {
                echo "<p>Référence à un fichier dans /src/: <span class='error'>TROUVÉE (doit être remplacée)</span></p>";
            }
            echo "<p>Contenu actuel de index.html:</p>";
            echo "<pre>" . htmlspecialchars($index_content) . "</pre>";
        } else {
            echo "<p>Fichier index.html: <span class='error'>INTROUVABLE</span></p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Recherche des fichiers JavaScript et CSS compilés</h2>
        <?php
        $is_hashed = is_hashed_environment();
        $main_js = find_main_js();
        $main_css = find_main_css();
        
        echo "<p>Environnement avec fichiers hashés: <span class='" . ($is_hashed ? 'success' : 'warning') . "'>" . 
            ($is_hashed ? 'OUI' : 'NON') . "</span></p>";
        
        if ($main_js) {
            echo "<p>Fichier JavaScript principal trouvé: <span class='success'>" . $main_js . "</span></p>";
        } else {
            echo "<p>Fichier JavaScript principal: <span class='error'>NON TROUVÉ</span></p>";
        }
        
        if ($main_css) {
            echo "<p>Fichier CSS principal trouvé: <span class='success'>" . $main_css . "</span></p>";
        } else {
            echo "<p>Fichier CSS principal: <span class='error'>NON TROUVÉ</span></p>";
        }
        
        $js_files = find_assets_in_dir('../assets', 'js');
        $css_files = find_assets_in_dir('../assets', 'css');
        ?>
        <?php if (!empty($js_files)): ?>
            <p>Tous les fichiers JavaScript trouvés:</p><ul>
                <?= list_assets($js_files) ?>
            </ul>
        <?php else: ?>
            <p>Fichiers JavaScript: <span class='error'>AUCUN TROUVÉ</span></p>
        <?php endif; ?>
        <?php if (!empty($css_files)): ?>
            <p>Tous les fichiers CSS trouvés:</p><ul>
                <?= list_assets($css_files) ?>
            </ul>
        <?php else: ?>
            <p>Fichiers CSS: <span class='error'>AUCUN TROUVÉ</span></p>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>Correction automatique de index.html</h2>
        <?php
        if (file_exists($indexPath)) {
            $needs_correction = !$refs['has_js_reference'] || !$refs['has_css_reference'] || $refs['has_src_reference'];
            if ($needs_correction && $main_js) {
                echo "<p>Des corrections sont nécessaires dans index.html pour référencer correctement les assets.</p>";
                if (isset($_POST['fix_index'])) {
                    copy($indexPath, $indexPath . '.bak');
                    $new_content = patch_index_html($index_content, $main_js, $main_css);
                    file_put_contents($indexPath, $new_content);
                    echo "<p><span class='success'>Correction appliquée! Le fichier index.html a été mis à jour.</span></p>";
                    echo "<p>Une sauvegarde a été créée: index.html.bak</p>";
                    echo "<p>Contenu du nouvel index.html:</p>";
                    echo "<pre>" . htmlspecialchars($new_content) . "</pre>";
                } else {
                    echo "<form method='post'>";
                    echo "<input type='hidden' name='fix_index' value='1'>";
                    echo "<button type='submit' class='fix-button'>Corriger index.html automatiquement</button>";
                    echo "</form>";
                }
            } else if (!$needs_correction) {
                echo "<p><span class='success'>index.html semble déjà référencer correctement les assets.</span></p>";
            } else {
                echo "<p><span class='error'>Impossible d'appliquer des corrections: aucun fichier JavaScript principal trouvé.</span></p>";
            }
        } else {
            echo "<p><span class='error'>Impossible de procéder à la correction: fichier index.html introuvable.</span></p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Actions recommandées</h2>
        <ol>
            <li>Vérifiez que tous les fichiers du dossier <code>dist</code> ont été correctement copiés à la racine du site</li>
            <li>Si vous avez généré un nouveau build, assurez-vous que les fichiers dans <code>assets/</code> sont à jour</li>
            <li>Utilisez la correction automatique proposée ci-dessus pour mettre à jour index.html</li>
            <li>Après correction, videz le cache de votre navigateur et testez à nouveau l'application</li>
        </ol>
    </div>
</body>
</html>
