
<?php
header('Content-Type: text/html; charset=utf-8');

// Fonction pour vérifier l'existence d'un fichier ou dossier
function checkExists($path, $label) {
    $exists = file_exists($path);
    $type = is_dir($path) ? 'dossier' : 'fichier';
    echo "<p>$label ($path): ";
    if ($exists) {
        echo "<span style='color: green;'>" . strtoupper($type) . " EXISTE</span>";
    } else {
        echo "<span style='color: red;'>" . strtoupper($type) . " N'EXISTE PAS</span>";
    }
    echo "</p>";
    return $exists;
}

// Fonction pour lister les fichiers dans un dossier
function listFiles($dir, $pattern = '*') {
    if (!is_dir($dir)) {
        echo "<p><strong>Le dossier $dir n'existe pas</strong></p>";
        return [];
    }
    
    $files = glob("$dir/$pattern");
    if (empty($files)) {
        echo "<p>Aucun fichier trouvé dans $dir correspondant à $pattern</p>";
        return [];
    }
    
    echo "<ul>";
    foreach ($files as $file) {
        $basename = basename($file);
        $mtime = filemtime($file);
        echo "<li>$basename <small>(" . date('Y-m-d H:i:s', $mtime) . ")</small></li>";
    }
    echo "</ul>";
    return $files;
}

// Fonction pour copier les assets et mettre à jour index.html
function fixAssets() {
    $results = [
        'success' => true,
        'messages' => []
    ];
    
    // Étape 1: Vérifier/créer le dossier assets
    if (!is_dir('./assets')) {
        if (mkdir('./assets', 0755, true)) {
            $results['messages'][] = "Dossier assets créé avec succès";
        } else {
            $results['messages'][] = "Échec de création du dossier assets";
            $results['success'] = false;
            return $results;
        }
    }
    
    // Étape 2: Copier les assets depuis dist/assets si nécessaire
    if (is_dir('./dist/assets')) {
        $files = glob('./dist/assets/*');
        $copied = 0;
        foreach ($files as $file) {
            $dest = './assets/' . basename($file);
            if (copy($file, $dest)) {
                $copied++;
            }
        }
        $results['messages'][] = "$copied fichiers copiés depuis dist/assets vers assets";
    } else {
        $results['messages'][] = "Le dossier dist/assets n'existe pas, impossible de copier les assets";
    }
    
    // Étape 3: Corriger index.html
    $js_files = glob('./assets/*.js');
    $css_files = glob('./assets/*.css');
    
    if (!file_exists('./index.html')) {
        $results['messages'][] = "Fichier index.html non trouvé à la racine";
        $results['success'] = false;
    } else if (empty($js_files)) {
        $results['messages'][] = "Aucun fichier JavaScript trouvé dans le dossier assets";
        $results['success'] = false;
    } else {
        // Sauvegarde de index.html
        copy('./index.html', './index.html.bak');
        $results['messages'][] = "Sauvegarde de index.html créée (index.html.bak)";
        
        $content = file_get_contents('./index.html');
        $original = $content;
        
        // Identifier le fichier JS principal
        $main_js = '';
        foreach ($js_files as $file) {
            if (strpos(basename($file), 'main-') === 0 || strpos(basename($file), 'index-') === 0) {
                $main_js = '/assets/' . basename($file);
                break;
            }
        }
        if (empty($main_js) && !empty($js_files)) {
            $main_js = '/assets/' . basename($js_files[0]);
        }
        
        // Identifier le fichier CSS principal
        $main_css = '';
        if (!empty($css_files)) {
            foreach ($css_files as $file) {
                if (strpos(basename($file), 'index-') === 0) {
                    $main_css = '/assets/' . basename($file);
                    break;
                }
            }
            if (empty($main_css)) {
                $main_css = '/assets/' . basename($css_files[0]);
            }
        }
        
        // Mise à jour des références
        if (!empty($main_js)) {
            // Remplacer la référence à /src/main.tsx s'il existe
            if (preg_match('/<script[^>]*src=["\'](\/src\/main\.tsx)["\']/i', $content)) {
                $content = preg_replace(
                    '/<script[^>]*src=["\'](\/src\/main\.tsx)["\']/i',
                    '<script type="module" src="' . $main_js . '"',
                    $content
                );
                $results['messages'][] = "Référence à /src/main.tsx remplacée par $main_js";
            }
            // Sinon, ajouter la référence JS si elle n'existe pas
            else if (!preg_match('/<script[^>]*src=["\'](\/assets\/[^"\']*\.js)["\']/i', $content)) {
                $content = str_replace(
                    '</body>',
                    '  <script type="module" src="' . $main_js . '"></script>' . "\n" . '</body>',
                    $content
                );
                $results['messages'][] = "Référence JavaScript ajoutée: $main_js";
            }
        }
        
        // Ajouter la référence CSS si elle n'existe pas
        if (!empty($main_css) && !preg_match('/<link[^>]*href=["\'](\/assets\/[^"\']*\.css)["\']/i', $content)) {
            $content = str_replace(
                '</head>',
                '  <link rel="stylesheet" href="' . $main_css . '">' . "\n" . '</head>',
                $content
            );
            $results['messages'][] = "Référence CSS ajoutée: $main_css";
        }
        
        // Enregistrer les modifications
        if ($content !== $original) {
            if (file_put_contents('./index.html', $content)) {
                $results['messages'][] = "Fichier index.html mis à jour avec succès";
            } else {
                $results['messages'][] = "Échec de mise à jour du fichier index.html";
                $results['success'] = false;
            }
        } else {
            $results['messages'][] = "Aucune modification nécessaire dans index.html";
        }
    }
    
    return $results;
}

$action_results = null;
if (isset($_POST['fix_assets'])) {
    $action_results = fixAssets();
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des Assets en Temps Réel</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        code { background: #f0f0f0; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>Correction des Assets en Temps Réel</h1>
    
    <?php if ($action_results): ?>
        <div class="section">
            <h2>Résultats de la correction</h2>
            <div class="<?= $action_results['success'] ? 'success' : 'error' ?>">
                <p><strong><?= $action_results['success'] ? 'Correction réussie!' : 'Des problèmes ont été rencontrés' ?></strong></p>
                <ul>
                    <?php foreach ($action_results['messages'] as $message): ?>
                        <li><?= $message ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <p><a href="/?_=<?= time() ?>">Rafraîchir l'application</a> | <a href="verify-deploy.php">Vérifier le déploiement</a></p>
        </div>
    <?php endif; ?>
    
    <div class="section">
        <h2>1. Structure des fichiers actuelle</h2>
        <?php
        checkExists('./index.html', 'Fichier principal');
        checkExists('./assets', 'Dossier des assets');
        checkExists('./dist', 'Dossier de build');
        checkExists('./dist/assets', 'Dossier des assets compilés');
        ?>
    </div>
    
    <div class="section">
        <h2>2. Analyse des fichiers JavaScript et CSS</h2>
        <h3>Fichiers JavaScript dans assets/</h3>
        <?php $js_files = listFiles('./assets', '*.js'); ?>
        
        <h3>Fichiers CSS dans assets/</h3>
        <?php $css_files = listFiles('./assets', '*.css'); ?>
        
        <h3>Fichiers JavaScript dans dist/assets/</h3>
        <?php $dist_js_files = listFiles('./dist/assets', '*.js'); ?>
        
        <h3>Fichiers CSS dans dist/assets/</h3>
        <?php $dist_css_files = listFiles('./dist/assets', '*.css'); ?>
    </div>
    
    <div class="section">
        <h2>3. Analyse du fichier index.html</h2>
        <?php if (file_exists('./index.html')): ?>
            <?php
            $content = file_get_contents('./index.html');
            $has_js_ref = preg_match('/<script[^>]*src=["\'](\/assets\/[^"\']*\.js)["\']/i', $content, $js_matches);
            $has_css_ref = preg_match('/<link[^>]*href=["\'](\/assets\/[^"\']*\.css)["\']/i', $content, $css_matches);
            $has_src_ref = preg_match('/<script[^>]*src=["\'](\/src\/[^"\']*\.[jt]sx?)["\']/i', $content, $src_matches);
            
            echo "<p>Référence à un fichier JavaScript dans /assets/: ";
            if ($has_js_ref) {
                echo "<span class='success'>TROUVÉE</span> ({$js_matches[1]})";
            } else {
                echo "<span class='error'>NON TROUVÉE</span>";
            }
            echo "</p>";
            
            echo "<p>Référence à un fichier CSS dans /assets/: ";
            if ($has_css_ref) {
                echo "<span class='success'>TROUVÉE</span> ({$css_matches[1]})";
            } else {
                echo "<span class='error'>NON TROUVÉE</span>";
            }
            echo "</p>";
            
            echo "<p>Référence à un fichier dans /src/: ";
            if ($has_src_ref) {
                echo "<span class='error'>TROUVÉE</span> ({$src_matches[1]})";
            } else {
                echo "<span class='success'>NON TROUVÉE</span>";
            }
            echo "</p>";
            
            echo "<pre>" . htmlspecialchars($content) . "</pre>";
            ?>
        <?php else: ?>
            <p class="error">Le fichier index.html n'existe pas à la racine.</p>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>4. Correction automatique</h2>
        <p>Ce processus va :</p>
        <ol>
            <li>Copier les fichiers JavaScript et CSS depuis <code>dist/assets</code> vers <code>assets</code> (si nécessaire)</li>
            <li>Mettre à jour <code>index.html</code> pour référencer correctement ces fichiers</li>
            <li>Créer une sauvegarde de <code>index.html</code> avant toute modification</li>
        </ol>
        <form method="post">
            <input type="hidden" name="fix_assets" value="1">
            <button type="submit" class="fix-button">Corriger les problèmes</button>
        </form>
    </div>
</body>
</html>
