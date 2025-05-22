
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction manuelle des assets</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Correction manuelle des assets</h1>
    
    <div class="section">
        <h2>Statut actuel</h2>
        <?php
        // Vérifier les dossiers
        $dist_exists = is_dir('./dist');
        $dist_assets_exists = is_dir('./dist/assets');
        $assets_exists = is_dir('./assets');
        
        // Compter les fichiers si les dossiers existent
        $dist_assets_files = $dist_assets_exists ? glob('./dist/assets/*') : [];
        $assets_files = $assets_exists ? glob('./assets/*') : [];
        $dist_assets_count = count($dist_assets_files);
        $assets_count = count($assets_files);
        
        // Afficher l'état des dossiers
        echo "<p>Dossier dist: " . ($dist_exists ? "<span class='success'>EXISTE</span>" : "<span class='error'>MANQUANT</span>") . "</p>";
        echo "<p>Dossier dist/assets: " . ($dist_assets_exists ? "<span class='success'>EXISTE</span> ($dist_assets_count fichiers)" : "<span class='error'>MANQUANT</span>") . "</p>";
        echo "<p>Dossier assets: " . ($assets_exists ? "<span class='success'>EXISTE</span> ($assets_count fichiers)" : "<span class='error'>MANQUANT</span>") . "</p>";
        
        // Vérifier index.html
        if (file_exists('./index.html')) {
            $index_content = file_get_contents('./index.html');
            $has_js_ref = preg_match('/<script[^>]*src="[^"]*\/assets\/[^"]*\.js"[^>]*>/i', $index_content);
            $has_css_ref = preg_match('/<link[^>]*href="[^"]*\/assets\/[^"]*\.css"[^>]*>/i', $index_content);
            
            echo "<p>Référence JS dans index.html: " . ($has_js_ref ? "<span class='success'>TROUVÉE</span>" : "<span class='error'>MANQUANTE</span>") . "</p>";
            echo "<p>Référence CSS dans index.html: " . ($has_css_ref ? "<span class='success'>TROUVÉE</span>" : "<span class='error'>MANQUANTE</span>") . "</p>";
        } else {
            echo "<p>Fichier index.html: <span class='error'>MANQUANT</span></p>";
        }
        ?>
    </div>
    
    <?php if (isset($_POST['action']) && $_POST['action'] === 'fix'): ?>
        <div class="section">
            <h2>Résultat des opérations</h2>
            <?php
            $success = true;
            $messages = [];
            
            // 1. Créer le dossier assets si nécessaire
            if (!$assets_exists) {
                if (mkdir('./assets', 0755)) {
                    $messages[] = "Création du dossier assets: <span class='success'>RÉUSSIE</span>";
                } else {
                    $messages[] = "Création du dossier assets: <span class='error'>ÉCHEC</span>";
                    $success = false;
                }
            }
            
            // 2. Copier les fichiers de dist/assets vers assets
            if ($dist_assets_exists) {
                $copied = 0;
                foreach ($dist_assets_files as $file) {
                    $filename = basename($file);
                    if (copy($file, './assets/' . $filename)) {
                        $copied++;
                    }
                }
                $messages[] = "Copie des fichiers: <span class='success'>$copied fichiers copiés</span>";
                
                // Obtenir les noms des nouveaux fichiers JS et CSS
                $js_files = glob('./assets/*.js');
                $css_files = glob('./assets/*.css');
                
                $main_js = '';
                foreach ($js_files as $file) {
                    if (strpos(basename($file), 'main.') === 0 || strpos(basename($file), 'index-') === 0) {
                        $main_js = '/assets/' . basename($file);
                        break;
                    }
                }
                if (empty($main_js) && !empty($js_files)) {
                    $main_js = '/assets/' . basename($js_files[0]);
                }
                
                $main_css = '';
                foreach ($css_files as $file) {
                    if (strpos(basename($file), 'index-') === 0 || strpos(basename($file), 'style') === 0) {
                        $main_css = '/assets/' . basename($file);
                        break;
                    }
                }
                if (empty($main_css) && !empty($css_files)) {
                    $main_css = '/assets/' . basename($css_files[0]);
                }
                
                // 3. Mettre à jour index.html
                if (file_exists('./index.html')) {
                    $index_content = file_get_contents('./index.html');
                    $original_content = $index_content;
                    $updated = false;
                    
                    // Ajouter la référence JS si nécessaire
                    if (!empty($main_js) && !preg_match('/<script[^>]*src="[^"]*\/assets\/[^"]*\.js"[^>]*>/i', $index_content)) {
                        // Remplacer la référence src/main.tsx si elle existe
                        if (preg_match('/<script[^>]*src="[^"]*\/src\/main\.tsx"[^>]*>/i', $index_content)) {
                            $index_content = preg_replace(
                                '/<script[^>]*src="[^"]*\/src\/main\.tsx"[^>]*>/i',
                                '<script type="module" src="' . $main_js . '">',
                                $index_content
                            );
                        } else {
                            // Sinon, ajouter avant la fermeture de body
                            $index_content = str_replace(
                                '</body>',
                                '  <script type="module" src="' . $main_js . '"></script>' . "\n" . '</body>',
                                $index_content
                            );
                        }
                        $updated = true;
                        $messages[] = "Ajout de la référence JS: <span class='success'>$main_js</span>";
                    }
                    
                    // Ajouter la référence CSS si nécessaire
                    if (!empty($main_css) && !preg_match('/<link[^>]*href="[^"]*\/assets\/[^"]*\.css"[^>]*>/i', $index_content)) {
                        $index_content = str_replace(
                            '</head>',
                            '  <link rel="stylesheet" href="' . $main_css . '">' . "\n" . '</head>',
                            $index_content
                        );
                        $updated = true;
                        $messages[] = "Ajout de la référence CSS: <span class='success'>$main_css</span>";
                    }
                    
                    if ($updated) {
                        if (file_put_contents('./index.html', $index_content)) {
                            $messages[] = "Mise à jour de index.html: <span class='success'>RÉUSSIE</span>";
                        } else {
                            $messages[] = "Mise à jour de index.html: <span class='error'>ÉCHEC</span>";
                            $success = false;
                        }
                    } else {
                        $messages[] = "Mise à jour de index.html: <span class='warning'>NON NÉCESSAIRE</span>";
                    }
                }
            } else {
                $messages[] = "<span class='error'>ERREUR: Le dossier dist/assets n'existe pas. Exécutez d'abord npm run build.</span>";
                $success = false;
            }
            
            // Afficher les messages
            foreach ($messages as $message) {
                echo "<p>$message</p>";
            }
            
            if ($success) {
                echo "<p class='success'>OPÉRATION RÉUSSIE! Vous devriez maintenant voir votre application correctement.</p>";
            } else {
                echo "<p class='error'>Des erreurs se sont produites. Vérifiez les messages ci-dessus.</p>";
            }
            ?>
            <p><a href="index.html">Tester l'application</a></p>
        </div>
    <?php else: ?>
        <div class="section">
            <h2>Corriger le problème</h2>
            <p>Ce script va:</p>
            <ol>
                <li>Créer le dossier <code>assets</code> à la racine s'il n'existe pas</li>
                <li>Copier tous les fichiers de <code>dist/assets</code> vers <code>assets</code></li>
                <li>Mettre à jour <code>index.html</code> avec les bonnes références JS et CSS</li>
            </ol>
            <form method="post">
                <input type="hidden" name="action" value="fix">
                <button type="submit" class="fix-button">Corriger maintenant</button>
            </form>
        </div>
        
        <div class="section">
            <h2>Pour le faire manuellement</h2>
            <p>Si vous préférez faire les corrections manuellement:</p>
            <ol>
                <li>Assurez-vous que le dossier <code>assets</code> existe à la racine du site</li>
                <li>Copiez tous les fichiers de <code>dist/assets</code> vers <code>assets</code></li>
                <li>Éditez <code>index.html</code> pour ajouter les références:</li>
                <ul>
                    <li>Ajoutez une balise <code>&lt;link&gt;</code> dans <code>&lt;head&gt;</code> pointant vers le CSS</li>
                    <li>Remplacez la référence à <code>/src/main.tsx</code> par le fichier JS principal compilé</li>
                </ul>
            </ol>
        </div>
    <?php endif; ?>
</body>
</html>
