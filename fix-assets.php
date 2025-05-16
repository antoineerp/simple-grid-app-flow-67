
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction de la structure des assets</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Correction de la structure des assets</h1>
    
    <div class="section">
        <h2>1. Analyse de la structure actuelle</h2>
        <?php
        // Vérifier les répertoires clés
        $directories = [
            './' => 'Répertoire racine',
            './dist' => 'Dossier de build',
            './dist/assets' => 'Assets générés',
            './assets' => 'Dossier assets cible'
        ];
        
        foreach ($directories as $dir => $label) {
            echo "<p>$label ($dir): ";
            if (is_dir($dir)) {
                $files = glob($dir . '/*');
                echo "<span class='success'>EXISTE</span> (" . count($files) . " fichiers)";
            } else {
                echo "<span class='error'>N'EXISTE PAS</span>";
            }
            echo "</p>";
        }
        
        // Vérifier les assets JS
        $js_files = [];
        if (is_dir('./dist/assets')) {
            $js_files = glob('./dist/assets/*.js');
        }
        
        echo "<p>Fichiers JavaScript dans dist/assets: ";
        if (!empty($js_files)) {
            echo "<span class='success'>" . count($js_files) . " fichiers trouvés</span>";
            echo "<ul>";
            foreach ($js_files as $file) {
                echo "<li>" . basename($file) . "</li>";
            }
            echo "</ul>";
        } else {
            echo "<span class='error'>Aucun fichier trouvé</span>";
        }
        echo "</p>";
        
        // Vérifier les assets CSS
        $css_files = [];
        if (is_dir('./dist/assets')) {
            $css_files = glob('./dist/assets/*.css');
        }
        
        echo "<p>Fichiers CSS dans dist/assets: ";
        if (!empty($css_files)) {
            echo "<span class='success'>" . count($css_files) . " fichiers trouvés</span>";
            echo "<ul>";
            foreach ($css_files as $file) {
                echo "<li>" . basename($file) . "</li>";
            }
            echo "</ul>";
        } else {
            echo "<span class='error'>Aucun fichier trouvé</span>";
        }
        echo "</p>";
        
        // Vérifier index.html
        $index_path = './index.html';
        echo "<p>Fichier index.html: ";
        if (file_exists($index_path)) {
            echo "<span class='success'>EXISTE</span>";
            $index_content = file_get_contents($index_path);
            
            // Vérifier si index.html fait référence à un fichier JavaScript dans assets
            $has_js_ref = preg_match('/<script[^>]*src=["\'][^"\']*\/assets\/[^"\']*\.js["\'][^>]*>/i', $index_content);
            echo "<br>Référence à un fichier JS dans /assets/: ";
            echo $has_js_ref ? "<span class='success'>OUI</span>" : "<span class='error'>NON</span>";
            
            // Vérifier si index.html fait référence à un fichier CSS dans assets
            $has_css_ref = preg_match('/<link[^>]*href=["\'][^"\']*\/assets\/[^"\']*\.css["\'][^>]*>/i', $index_content);
            echo "<br>Référence à un fichier CSS dans /assets/: ";
            echo $has_css_ref ? "<span class='success'>OUI</span>" : "<span class='error'>NON</span>";
        } else {
            echo "<span class='error'>N'EXISTE PAS</span>";
        }
        echo "</p>";
        ?>
    </div>
    
    <div class="section">
        <h2>2. Correction de la structure</h2>
        <?php
        if (isset($_POST['fix_assets'])) {
            echo "<h3>Actions effectuées:</h3>";
            
            // 1. Créer le dossier assets s'il n'existe pas
            if (!is_dir('./assets')) {
                if (mkdir('./assets', 0755, true)) {
                    echo "<p>Création du dossier assets: <span class='success'>OK</span></p>";
                } else {
                    echo "<p>Création du dossier assets: <span class='error'>ÉCHEC</span></p>";
                }
            }
            
            // 2. Copier les fichiers de dist/assets vers assets
            $copied_js = 0;
            $copied_css = 0;
            
            if (is_dir('./dist/assets')) {
                // Copier les fichiers JS
                foreach ($js_files as $file) {
                    $dest = './assets/' . basename($file);
                    if (copy($file, $dest)) {
                        $copied_js++;
                    }
                }
                echo "<p>Fichiers JavaScript copiés: <span class='success'>$copied_js</span></p>";
                
                // Copier les fichiers CSS
                foreach ($css_files as $file) {
                    $dest = './assets/' . basename($file);
                    if (copy($file, $dest)) {
                        $copied_css++;
                    }
                }
                echo "<p>Fichiers CSS copiés: <span class='success'>$copied_css</span></p>";
            }
            
            // 3. Mettre à jour index.html pour référencer les fichiers
            if (file_exists($index_path)) {
                $updated = false;
                $backup_created = false;
                $index_content = file_get_contents($index_path);
                $new_content = $index_content;
                
                // Trouver le fichier main.js principal
                $main_js = '';
                $main_js_files = glob('./assets/main.*.js');
                if (!empty($main_js_files)) {
                    $main_js = '/assets/' . basename($main_js_files[0]);
                }
                
                // Trouver le fichier CSS principal
                $main_css = '';
                $main_css_files = glob('./assets/index*.css');
                if (!empty($main_css_files)) {
                    $main_css = '/assets/' . basename($main_css_files[0]);
                } else {
                    $main_css_files = glob('./assets/style*.css');
                    if (!empty($main_css_files)) {
                        $main_css = '/assets/' . basename($main_css_files[0]);
                    }
                }
                
                // Mettre à jour le lien vers le fichier JS
                if (!empty($main_js)) {
                    // S'il y a déjà un script pour un module, le mettre à jour
                    if (preg_match('/<script[^>]*type=["\']module["\'][^>]*src=["\'][^"\']*["\'][^>]*>/i', $new_content)) {
                        $new_content = preg_replace(
                            '/<script[^>]*type=["\']module["\'][^>]*src=["\'][^"\']*["\'][^>]*>/i',
                            '<script type="module" src="' . $main_js . '">',
                            $new_content
                        );
                        $updated = true;
                    }
                    // Sinon, chercher la référence à /src/main.tsx
                    else if (strpos($new_content, 'src="/src/main.tsx"') !== false) {
                        $new_content = str_replace(
                            'src="/src/main.tsx"',
                            'src="' . $main_js . '"',
                            $new_content
                        );
                        $updated = true;
                    }
                    // Si aucun n'est trouvé, ajouter un nouveau script avant la fermeture de body
                    else {
                        $new_content = str_replace(
                            '</body>',
                            '  <script type="module" src="' . $main_js . '"></script>' . "\n</body>",
                            $new_content
                        );
                        $updated = true;
                    }
                }
                
                // Mettre à jour le lien vers le fichier CSS
                if (!empty($main_css)) {
                    // S'il y a déjà un lien CSS, le mettre à jour
                    if (preg_match('/<link[^>]*rel=["\']stylesheet["\'][^>]*>/i', $new_content)) {
                        $new_content = preg_replace(
                            '/<link[^>]*rel=["\']stylesheet["\'][^>]*>/i',
                            '<link rel="stylesheet" href="' . $main_css . '">',
                            $new_content
                        );
                        $updated = true;
                    }
                    // Sinon, ajouter un nouveau lien avant la fermeture de head
                    else {
                        $new_content = str_replace(
                            '</head>',
                            '  <link rel="stylesheet" href="' . $main_css . '">' . "\n</head>",
                            $new_content
                        );
                        $updated = true;
                    }
                }
                
                // Si des modifications ont été apportées, créer une sauvegarde et enregistrer
                if ($updated) {
                    // Créer une sauvegarde
                    if (!$backup_created) {
                        copy($index_path, $index_path . '.bak');
                        $backup_created = true;
                    }
                    
                    // Enregistrer les modifications
                    if (file_put_contents($index_path, $new_content)) {
                        echo "<p>Mise à jour de index.html: <span class='success'>OK</span></p>";
                        echo "<p>Une sauvegarde a été créée: index.html.bak</p>";
                        if (!empty($main_js)) {
                            echo "<p>Fichier JS référencé: <span class='success'>$main_js</span></p>";
                        }
                        if (!empty($main_css)) {
                            echo "<p>Fichier CSS référencé: <span class='success'>$main_css</span></p>";
                        }
                    } else {
                        echo "<p>Mise à jour de index.html: <span class='error'>ÉCHEC (erreur d'écriture)</span></p>";
                    }
                } else {
                    echo "<p>Mise à jour de index.html: <span class='warning'>Aucune modification nécessaire</span></p>";
                }
            }
        } else {
            ?>
            <form method="post">
                <p>Ce script va effectuer les actions suivantes:</p>
                <ol>
                    <li>Créer le dossier <code>assets</code> à la racine s'il n'existe pas</li>
                    <li>Copier tous les fichiers JS/CSS de <code>dist/assets</code> vers <code>assets</code></li>
                    <li>Mettre à jour <code>index.html</code> pour référencer les fichiers compilés</li>
                </ol>
                <input type="hidden" name="fix_assets" value="1">
                <button type="submit">Exécuter la correction</button>
            </form>
            <?php
        }
        ?>
    </div>
    
    <div class="section">
        <h2>3. Vérification</h2>
        <?php if (isset($_POST['fix_assets'])): ?>
            <p>Vérification après correction:</p>
            <?php
            // Vérifier les fichiers dans assets
            $new_js_files = glob('./assets/*.js');
            $new_css_files = glob('./assets/*.css');
            
            echo "<p>Fichiers JavaScript dans assets: ";
            if (!empty($new_js_files)) {
                echo "<span class='success'>" . count($new_js_files) . " fichiers</span>";
                echo "<ul>";
                foreach ($new_js_files as $file) {
                    echo "<li>" . basename($file) . "</li>";
                }
                echo "</ul>";
            } else {
                echo "<span class='error'>Aucun fichier</span>";
            }
            echo "</p>";
            
            echo "<p>Fichiers CSS dans assets: ";
            if (!empty($new_css_files)) {
                echo "<span class='success'>" . count($new_css_files) . " fichiers</span>";
                echo "<ul>";
                foreach ($new_css_files as $file) {
                    echo "<li>" . basename($file) . "</li>";
                }
                echo "</ul>";
            } else {
                echo "<span class='error'>Aucun fichier</span>";
            }
            echo "</p>";
            
            // Vérifier les références dans index.html
            if (file_exists($index_path)) {
                $current_content = file_get_contents($index_path);
                
                $has_js_ref = preg_match('/<script[^>]*src=["\'][^"\']*\/assets\/[^"\']*\.js["\'][^>]*>/i', $current_content);
                echo "<p>Référence à un fichier JS dans /assets/: ";
                echo $has_js_ref ? "<span class='success'>OUI</span>" : "<span class='error'>NON</span>";
                echo "</p>";
                
                $has_css_ref = preg_match('/<link[^>]*href=["\'][^"\']*\/assets\/[^"\']*\.css["\'][^>]*>/i', $current_content);
                echo "<p>Référence à un fichier CSS dans /assets/: ";
                echo $has_css_ref ? "<span class='success'>OUI</span>" : "<span class='error'>NON</span>";
                echo "</p>";
            }
            ?>
            <h3>Contenu de index.html après mise à jour:</h3>
            <pre><?php echo htmlspecialchars(file_get_contents($index_path)); ?></pre>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>4. Instructions manuelles supplémentaires</h2>
        <p>Si le script n'a pas pu résoudre tous les problèmes, voici des étapes manuelles à suivre:</p>
        <ol>
            <li>Assurez-vous que <code>npm run build</code> a bien été exécuté pour générer les fichiers dans <code>dist/assets</code></li>
            <li>Vérifiez que les fichiers compilés contiennent un hachage (par exemple, <code>main.GxNrB2FB.js</code>)</li>
            <li>Modifiez manuellement <code>index.html</code> pour référencer ces fichiers avec les bons chemins:
                <pre>&lt;script type="module" src="/assets/main.GxNrB2FB.js"&gt;&lt;/script&gt;</pre>
            </li>
            <li>Assurez-vous que le serveur est configuré pour servir correctement les fichiers statiques du dossier <code>assets</code></li>
        </ol>
    </div>
    
    <p><a href="index.html">Retour à l'application</a></p>
</body>
</html>
