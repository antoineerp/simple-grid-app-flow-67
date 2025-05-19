
<?php
header('Content-Type: text/html; charset=utf-8');
require_once 'utils-directory.php';
require_once 'utils-assets.php';
require_once 'index-validator.php';
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification de la Structure des Répertoires</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Vérification de la Structure des Répertoires</h1>
    
    <div class="section">
        <h2>1. Structure Actuelle</h2>
        <?php
        // Répertoires à vérifier
        $directories = [
            './' => 'Répertoire racine',
            './assets' => 'Dossier des assets',
            '../assets' => 'Dossier des assets (un niveau au-dessus)',
            './api' => 'Dossier API',
            './public' => 'Dossier public'
        ];
        foreach ($directories as $dir => $desc) {
            $count = check_directory($dir);
            echo "<p>$desc ($dir): ";
            if ($count !== false) {
                echo "<span class='success'>EXISTE</span> ($count fichiers/dossiers)";
            } else {
                echo "<span class='error'>N'EXISTE PAS</span>";
            }
            echo "</p>";
        }

        // JS file locations
        echo "<h3>Recherche des fichiers JavaScript</h3>";
        $js_locations = [
            './assets/*.js',
            '../assets/*.js',
            './dist/assets/*.js',
            '../dist/assets/*.js'
        ];
        foreach ($js_locations as $pattern) {
            $files = glob($pattern);
            echo "<p>$pattern: ";
            if (!empty($files)) {
                echo "<span class='success'>TROUVÉ</span> (" . count($files) . " fichiers)<ul>";
                echo print_file_list($files);
                echo "</ul>";
            } else {
                echo "<span class='error'>AUCUN FICHIER</span>";
            }
            echo "</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>2. Correction de la Structure</h2>
        <?php
        if (isset($_POST['fix_structure'])) {
            echo "<h3>Actions effectuées :</h3>";
            // Création dossier assets
            if (!is_dir('./assets')) {
                if (mkdir('./assets', 0755, true)) {
                    echo "<p>Création du dossier <code>./assets</code>: <span class='success'>SUCCÈS</span></p>";
                } else {
                    echo "<p>Création du dossier <code>./assets</code>: <span class='error'>ÉCHEC</span></p>";
                }
            }
            // Copier JS/CSS depuis ../assets
            foreach (['js', 'css'] as $type) {
                $source = glob("../assets/*.$type");
                if (!empty($source)) {
                    $copied = 0;
                    foreach ($source as $file) {
                        $dest = './assets/' . basename($file);
                        if (copy($file, $dest)) $copied++;
                    }
                    echo "<p>Copie des fichiers $type depuis <code>../assets/</code>: <span class='success'>SUCCÈS</span> ($copied fichiers copiés)</p>";
                } else {
                    echo "<p>Aucun fichier $type trouvé dans <code>../assets/</code> à copier</p>";
                }
            }
            // Vérifier et patcher index.html
            if (file_exists('./index.html')) {
                $index_content = file_get_contents('./index.html');
                $refs = validate_index_references($index_content);
                if (!$refs['has_js_reference'] || !$refs['has_css_reference']) {
                    $js_files = find_assets_in_dir('./assets', 'js');
                    $css_files = find_assets_in_dir('./assets', 'css');
                    list($main_js) = find_latest_asset($js_files, 'main-');
                    list($index_css) = find_latest_asset($css_files, 'index-');
                    // Fallback first file
                    $main_js = $main_js ?: (isset($js_files[0]) ? basename($js_files[0]) : null);
                    $index_css = $index_css ?: (isset($css_files[0]) ? basename($css_files[0]) : null);
                    if ($main_js && $index_css) {
                        copy('./index.html', './index.html.bak');
                        $new_content = patch_index_html($index_content, $main_js, $index_css);
                        if (file_put_contents('./index.html', $new_content)) {
                            echo "<p>Mise à jour des références dans index.html : <span class='success'>SUCCÈS</span></p>";
                        } else {
                            echo "<p>Mise à jour des références dans index.html : <span class='error'>ÉCHEC (impossible d'écrire)</span></p>";
                        }
                    }
                } else {
                    echo "<p>Les références dans index.html sont déjà correctes</p>";
                }
            } else {
                echo "<p>Le fichier index.html n'existe pas à la racine</p>";
            }
        } else {
            echo "<form method='post'>";
            echo "<p>Ce script va tenter de créer/corriger la structure des répertoires et de copier les fichiers nécessaires.</p>";
            echo "<input type='hidden' name='fix_structure' value='1'>";
            echo '<button type="submit" style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;">Corriger la structure</button>';
            echo "</form>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>3. Recommandations</h2>
        <ol>
            <li>Assurez-vous que le dossier <code>assets</code> existe à la racine du site</li>
            <li>Vérifiez que les fichiers JS et CSS compilés se trouvent dans ce dossier</li>
            <li>Assurez-vous que <code>index.html</code> fait référence à ces fichiers compilés</li>
            <li>Si vous utilisez un workflow de déploiement, vérifiez qu'il copie correctement les fichiers compilés</li>
        </ol>
    </div>
</body>
</html>
