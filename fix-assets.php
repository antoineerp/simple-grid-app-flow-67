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
        table { border-collapse: collapse; width: 100%; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
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
        
        // Fonction pour obtenir tous les fichiers JS et CSS, y compris dans les sous-dossiers
        function getFilesRecursively($dir, $extension) {
            $result = [];
            if (is_dir($dir)) {
                $files = glob("$dir/*.$extension");
                $result = array_merge($result, $files);
                
                // Recherche dans les sous-dossiers
                $subDirs = glob("$dir/*", GLOB_ONLYDIR);
                foreach ($subDirs as $subDir) {
                    $subFiles = getFilesRecursively($subDir, $extension);
                    $result = array_merge($result, $subFiles);
                }
            }
            return $result;
        }
        
        // Vérifier les assets JS dans dist et assets
        $js_dist_files = getFilesRecursively('./dist', 'js');
        $js_assets_files = getFilesRecursively('./assets', 'js');
        
        // Vérifier les assets CSS dans dist et assets
        $css_dist_files = getFilesRecursively('./dist', 'css');
        $css_assets_files = getFilesRecursively('./assets', 'css');
        
        // Afficher les fichiers JS dans dist
        echo "<h3>Fichiers JavaScript dans dist:</h3>";
        if (!empty($js_dist_files)) {
            echo "<table>";
            echo "<tr><th>Fichier</th><th>Taille</th></tr>";
            foreach ($js_dist_files as $file) {
                echo "<tr>";
                echo "<td>" . basename($file) . "</td>";
                echo "<td>" . number_format(filesize($file) / 1024, 2) . " KB</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p><span class='error'>Aucun fichier JavaScript trouvé dans dist</span></p>";
        }
        
        // Afficher les fichiers CSS dans dist
        echo "<h3>Fichiers CSS dans dist:</h3>";
        if (!empty($css_dist_files)) {
            echo "<table>";
            echo "<tr><th>Fichier</th><th>Taille</th></tr>";
            foreach ($css_dist_files as $file) {
                echo "<tr>";
                echo "<td>" . basename($file) . "</td>";
                echo "<td>" . number_format(filesize($file) / 1024, 2) . " KB</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p><span class='error'>Aucun fichier CSS trouvé dans dist</span></p>";
        }
        
        // Vérifier index.html
        $index_path = './index.html';
        echo "<h3>Analyse de index.html:</h3>";
        if (file_exists($index_path)) {
            echo "<p><span class='success'>Le fichier index.html existe</span></p>";
            $index_content = file_get_contents($index_path);
            
            // Trouver toutes les références de script
            preg_match_all('/<script[^>]*src=["\']([^"\']*)["\'][^>]*>/i', $index_content, $script_matches);
            $script_refs = $script_matches[1];
            
            // Trouver toutes les références de feuille de style
            preg_match_all('/<link[^>]*href=["\']([^"\']*)["\'][^>]*rel=["\']stylesheet["\'][^>]*>/i', $index_content, $style_matches1);
            preg_match_all('/<link[^>]*rel=["\']stylesheet["\'][^>]*href=["\']([^"\']*)["\'][^>]*>/i', $index_content, $style_matches2);
            $style_refs = array_merge($style_matches1[1], $style_matches2[1]);
            
            echo "<h4>Scripts référencés:</h4>";
            echo "<ul>";
            foreach ($script_refs as $ref) {
                echo "<li>" . htmlspecialchars($ref) . "</li>";
            }
            echo "</ul>";
            
            echo "<h4>Styles référencés:</h4>";
            echo "<ul>";
            foreach ($style_refs as $ref) {
                echo "<li>" . htmlspecialchars($ref) . "</li>";
            }
            echo "</ul>";
            
            // Vérifier si les fichiers principaux de dist sont référencés
            $main_js_dist = null;
            foreach ($js_dist_files as $js_file) {
                if (preg_match('/main\.[a-zA-Z0-9]+\.js$/', $js_file)) {
                    $main_js_dist = $js_file;
                    break;
                }
            }
            
            $main_css_dist = null;
            foreach ($css_dist_files as $css_file) {
                if (preg_match('/index\.[a-zA-Z0-9]+\.css$/', $css_file) || preg_match('/main\.[a-zA-Z0-9]+\.css$/', $css_file)) {
                    $main_css_dist = $css_file;
                    break;
                }
            }
            
            if ($main_js_dist) {
                $main_js_basename = basename($main_js_dist);
                $main_js_referenced = false;
                foreach ($script_refs as $ref) {
                    if (strpos($ref, $main_js_basename) !== false) {
                        $main_js_referenced = true;
                        break;
                    }
                }
                echo "<p>Fichier JavaScript principal (main.*.js): <strong>" . $main_js_basename . "</strong> - ";
                echo $main_js_referenced ? 
                    "<span class='success'>Correctement référencé dans index.html</span>" : 
                    "<span class='error'>Non référencé dans index.html</span>";
                echo "</p>";
            } else {
                echo "<p><span class='error'>Aucun fichier JavaScript principal (main.*.js) trouvé dans dist</span></p>";
            }
            
            if ($main_css_dist) {
                $main_css_basename = basename($main_css_dist);
                $main_css_referenced = false;
                foreach ($style_refs as $ref) {
                    if (strpos($ref, $main_css_basename) !== false) {
                        $main_css_referenced = true;
                        break;
                    }
                }
                echo "<p>Fichier CSS principal: <strong>" . $main_css_basename . "</strong> - ";
                echo $main_css_referenced ? 
                    "<span class='success'>Correctement référencé dans index.html</span>" : 
                    "<span class='error'>Non référencé dans index.html</span>";
                echo "</p>";
            } else {
                echo "<p><span class='error'>Aucun fichier CSS principal (index.*.css ou main.*.css) trouvé dans dist</span></p>";
            }
            
        } else {
            echo "<p><span class='error'>Le fichier index.html est introuvable</span></p>";
        }
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
            } else {
                echo "<p>Le dossier assets existe déjà: <span class='success'>OK</span></p>";
            }
            
            // 2. Copier les fichiers de dist/assets vers assets
            $copied_js = 0;
            $copied_css = 0;
            
            if (is_dir('./dist/assets')) {
                // Fonction récursive pour copier tous les fichiers
                function copyFilesRecursively($src, $dst, $fileTypes = []) {
                    $count = 0;
                    if (is_dir($src)) {
                        if (!is_dir($dst)) {
                            mkdir($dst, 0755, true);
                        }
                        
                        $files = scandir($src);
                        foreach ($files as $file) {
                            if ($file != "." && $file != "..") {
                                $srcPath = $src . '/' . $file;
                                $dstPath = $dst . '/' . $file;
                                
                                if (is_dir($srcPath)) {
                                    $count += copyFilesRecursively($srcPath, $dstPath, $fileTypes);
                                } else {
                                    $ext = pathinfo($file, PATHINFO_EXTENSION);
                                    if (empty($fileTypes) || in_array($ext, $fileTypes)) {
                                        if (copy($srcPath, $dstPath)) {
                                            $count++;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    return $count;
                }
                
                // Copier tous les fichiers JS
                $copied_js = copyFilesRecursively('./dist/assets', './assets', ['js']);
                echo "<p>Fichiers JavaScript copiés: <span class='success'>$copied_js</span></p>";
                
                // Copier tous les fichiers CSS
                $copied_css = copyFilesRecursively('./dist/assets', './assets', ['css']);
                echo "<p>Fichiers CSS copiés: <span class='success'>$copied_css</span></p>";
                
                // Copier tous les autres fichiers (images, polices, etc.)
                $copied_other = copyFilesRecursively('./dist/assets', './assets', ['svg', 'png', 'jpg', 'jpeg', 'gif', 'woff', 'woff2', 'ttf', 'eot']);
                echo "<p>Autres fichiers copiés (images, polices): <span class='success'>$copied_other</span></p>";
            } else {
                // Si le dossier dist/assets n'existe pas, essayer dist directement
                if (is_dir('./dist')) {
                    $copied_js = copyFilesRecursively('./dist', './assets', ['js']);
                    echo "<p>Fichiers JavaScript copiés depuis dist: <span class='success'>$copied_js</span></p>";
                    
                    $copied_css = copyFilesRecursively('./dist', './assets', ['css']);
                    echo "<p>Fichiers CSS copiés depuis dist: <span class='success'>$copied_css</span></p>";
                } else {
                    echo "<p>Dossier dist introuvable: <span class='error'>ÉCHEC</span></p>";
                }
            }
            
            // Vérifier si un fichier CSS a été trouvé, sinon créer un fichier index.css
            $css_files = getFilesRecursively('./assets', 'css');
            if (empty($css_files)) {
                // Aucun CSS trouvé, créer un fichier index.css basique
                $css_content = file_get_contents('./src/index.css');
                if (!$css_content) {
                    // Si src/index.css n'existe pas, créer un CSS basique
                    $css_content = "/* CSS généré automatiquement */\nbody { font-family: Arial, sans-serif; margin: 0; padding: 0; }\n";
                }
                file_put_contents('./assets/index.css', $css_content);
                echo "<p>Création d'un fichier CSS basique: <span class='success'>assets/index.css</span></p>";
                $css_files[] = './assets/index.css';
            }
            
            // 3. Trouver les fichiers principaux à référencer
            $main_js = '';
            $js_files = getFilesRecursively('./assets', 'js');
            foreach ($js_files as $file) {
                if (preg_match('/main\.[a-zA-Z0-9_-]+\.js$/', $file)) {
                    $main_js = str_replace('./', '/', $file);
                    break;
                }
            }
            
            $main_css = '';
            foreach ($css_files as $file) {
                if (preg_match('/index\.[a-zA-Z0-9_-]+\.css$/', $file) || preg_match('/main\.[a-zA-Z0-9_-]+\.css$/', $file)) {
                    $main_css = str_replace('./', '/', $file);
                    break;
                }
            }
            
            // Si aucun CSS principal trouvé, utiliser le premier CSS disponible
            if (empty($main_css) && !empty($css_files)) {
                $main_css = str_replace('./', '/', $css_files[0]);
                echo "<p>Utilisation du premier fichier CSS disponible: <span class='success'>" . basename($main_css) . "</span></p>";
            }
            
            // 4. Mettre à jour index.html pour référencer les fichiers
            if (file_exists('./index.html')) {
                $updated = false;
                $backup_created = false;
                $index_content = file_get_contents('./index.html');
                $new_content = $index_content;
                
                if (!$backup_created) {
                    copy('./index.html', './index.html.bak-' . date('YmdHis'));
                    $backup_created = true;
                    echo "<p>Sauvegarde de index.html créée: <span class='success'>OK</span></p>";
                }
                
                // Mettre à jour le lien vers le fichier JS principal
                if (!empty($main_js)) {
                    // Rechercher un script src qui pointe vers src/main.tsx
                    if (strpos($new_content, 'src="/src/main.tsx"') !== false) {
                        $new_content = str_replace(
                            'src="/src/main.tsx"',
                            'src="' . $main_js . '"',
                            $new_content
                        );
                        $updated = true;
                        echo "<p>Référence au fichier JavaScript principal mise à jour: <span class='success'>$main_js</span></p>";
                    } 
                    // Rechercher un script de type module
                    else if (preg_match('/<script[^>]*type=["\']module["\'][^>]*src=["\'][^"\']*["\'][^>]*>/i', $new_content)) {
                        $new_content = preg_replace(
                            '/<script[^>]*type=["\']module["\'][^>]*src=["\'][^"\']*["\'][^>]*>/i',
                            '<script type="module" src="' . $main_js . '">',
                            $new_content
                        );
                        $updated = true;
                        echo "<p>Référence au fichier JavaScript principal (module) mise à jour: <span class='success'>$main_js</span></p>";
                    }
                    // Sinon, ajouter un nouveau script à la fin de body
                    else {
                        $new_content = str_replace(
                            '</body>',
                            '  <script type="module" src="' . $main_js . '"></script>' . "\n</body>",
                            $new_content
                        );
                        $updated = true;
                        echo "<p>Ajout d'une nouvelle référence au fichier JavaScript principal: <span class='success'>$main_js</span></p>";
                    }
                } else {
                    echo "<p>Aucun fichier JavaScript principal trouvé à référencer: <span class='warning'>ATTENTION</span></p>";
                }
                
                // Mettre à jour le lien vers le fichier CSS principal
                if (!empty($main_css)) {
                    // Rechercher une balise link pour une feuille de style
                    if (preg_match('/<link[^>]*href=["\'][^"\']*["\'][^>]*rel=["\']stylesheet["\'][^>]*>/i', $new_content) || 
                        preg_match('/<link[^>]*rel=["\']stylesheet["\'][^>]*href=["\'][^"\']*["\'][^>]*>/i', $new_content)) {
                        $new_content = preg_replace(
                            '/<link[^>]*href=["\'][^"\']*["\'][^>]*rel=["\']stylesheet["\'][^>]*>/i',
                            '<link rel="stylesheet" href="' . $main_css . '">',
                            $new_content
                        );
                        $new_content = preg_replace(
                            '/<link[^>]*rel=["\']stylesheet["\'][^>]*href=["\'][^"\']*["\'][^>]*>/i',
                            '<link rel="stylesheet" href="' . $main_css . '">',
                            $new_content
                        );
                        $updated = true;
                        echo "<p>Référence au fichier CSS principal mise à jour: <span class='success'>$main_css</span></p>";
                    }
                    // Sinon, ajouter une nouvelle balise link dans head
                    else {
                        $new_content = str_replace(
                            '</head>',
                            '  <link rel="stylesheet" href="' . $main_css . '">' . "\n</head>",
                            $new_content
                        );
                        $updated = true;
                        echo "<p>Ajout d'une nouvelle référence au fichier CSS principal: <span class='success'>$main_css</span></p>";
                    }
                } else {
                    echo "<p>Aucun fichier CSS principal trouvé à référencer: <span class='warning'>ATTENTION</span></p>";
                    
                    // Créer un fichier CSS basique si aucun n'a été trouvé
                    if (empty($css_files)) {
                        $basic_css_path = './assets/index.css';
                        $basic_css_content = "/* CSS généré automatiquement */\nbody { font-family: Arial, sans-serif; margin: 0; padding: 0; }\n";
                        file_put_contents($basic_css_path, $basic_css_content);
                        echo "<p>Création d'un fichier CSS basique: <span class='success'>assets/index.css</span></p>";
                        
                        // Ajouter une référence à ce fichier CSS
                        $new_content = str_replace(
                            '</head>',
                            '  <link rel="stylesheet" href="/assets/index.css">' . "\n</head>",
                            $new_content
                        );
                        $updated = true;
                        echo "<p>Ajout d'une référence au fichier CSS basique: <span class='success'>/assets/index.css</span></p>";
                    }
                }
                
                // Enregistrer les modifications
                if ($updated) {
                    if (file_put_contents('./index.html', $new_content)) {
                        echo "<p>Mise à jour de index.html: <span class='success'>OK</span></p>";
                    } else {
                        echo "<p>Mise à jour de index.html: <span class='error'>ÉCHEC (erreur d'écriture)</span></p>";
                    }
                } else {
                    echo "<p>Aucune mise à jour nécessaire pour index.html: <span class='warning'>ATTENTION</span></p>";
                }
                
                // Créer un fichier .htaccess pour les assets si nécessaire
                $htaccess_path = './assets/.htaccess';
                if (!file_exists($htaccess_path)) {
                    $htaccess_content = <<<EOT
# Définition des types MIME pour les assets
AddType application/javascript .js
AddType application/javascript .mjs
AddType text/css .css

# Force les types MIME corrects
<FilesMatch "\.js$">
    ForceType application/javascript
    Header set Content-Type "application/javascript; charset=utf-8"
    Header set X-Content-Type-Options "nosniff"
</FilesMatch>

<FilesMatch "\.css$">
    ForceType text/css
    Header set Content-Type "text/css; charset=utf-8"
    Header set X-Content-Type-Options "nosniff"
</FilesMatch>

# Cache control
<FilesMatch "\.(js|css|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "max-age=31536000, public"
</FilesMatch>
EOT;
                    if (file_put_contents($htaccess_path, $htaccess_content)) {
                        echo "<p>Création du fichier .htaccess pour les assets: <span class='success'>OK</span></p>";
                    } else {
                        echo "<p>Création du fichier .htaccess pour les assets: <span class='error'>ÉCHEC</span></p>";
                    }
                }
            } else {
                echo "<p>Fichier index.html introuvable: <span class='error'>ÉCHEC</span></p>";
            }
            
            // 5. Si aucun CSS n'a été trouvé, copier src/index.css dans assets
            if (empty($css_files) && file_exists('./src/index.css')) {
                if (copy('./src/index.css', './assets/index.css')) {
                    echo "<p>Copie de src/index.css vers assets/index.css: <span class='success'>OK</span></p>";
                    
                    // Mettre à jour index.html pour référencer ce CSS
                    if (file_exists('./index.html')) {
                        $index_content = file_get_contents('./index.html');
                        if (strpos($index_content, '/assets/index.css') === false) {
                            $index_content = str_replace(
                                '</head>',
                                '  <link rel="stylesheet" href="/assets/index.css">' . "\n</head>",
                                $index_content
                            );
                            file_put_contents('./index.html', $index_content);
                            echo "<p>Ajout d'une référence à index.css dans index.html: <span class='success'>OK</span></p>";
                        }
                    }
                } else {
                    echo "<p>Copie de src/index.css vers assets/index.css: <span class='error'>ÉCHEC</span></p>";
                }
            }
        } else {
            ?>
            <form method="post">
                <p>Ce script va effectuer les actions suivantes:</p>
                <ol>
                    <li>Créer le dossier <code>assets</code> à la racine s'il n'existe pas</li>
                    <li>Copier tous les fichiers JS/CSS de <code>dist/assets</code> vers <code>assets</code></li>
                    <li>Si aucun fichier CSS n'est trouvé, copier <code>src/index.css</code> ou créer un CSS basique</li>
                    <li>Mettre à jour <code>index.html</code> pour référencer les fichiers compilés</li>
                    <li>Créer un fichier <code>.htaccess</code> dans le dossier <code>assets</code> pour configurer les types MIME</li>
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
            $new_js_files = getFilesRecursively('./assets', 'js');
            $new_css_files = getFilesRecursively('./assets', 'css');
            
            echo "<h3>Fichiers JavaScript dans assets après correction:</h3>";
            if (!empty($new_js_files)) {
                echo "<table>";
                echo "<tr><th>Fichier</th><th>Taille</th></tr>";
                foreach ($new_js_files as $file) {
                    echo "<tr>";
                    echo "<td>" . basename($file) . "</td>";
                    echo "<td>" . number_format(filesize($file) / 1024, 2) . " KB</td>";
                    echo "</tr>";
                }
                echo "</table>";
            } else {
                echo "<p><span class='error'>Aucun fichier JavaScript trouvé dans assets</span></p>";
            }
            
            echo "<h3>Fichiers CSS dans assets après correction:</h3>";
            if (!empty($new_css_files)) {
                echo "<table>";
                echo "<tr><th>Fichier</th><th>Taille</th></tr>";
                foreach ($new_css_files as $file) {
                    echo "<tr>";
                    echo "<td>" . basename($file) . "</td>";
                    echo "<td>" . number_format(filesize($file) / 1024, 2) . " KB</td>";
                    echo "</tr>";
                }
                echo "</table>";
            } else {
                echo "<p><span class='error'>Aucun fichier CSS trouvé dans assets</span></p>";
            }
            
            // Vérifier les références dans index.html
            if (file_exists('./index.html')) {
                $current_content = file_get_contents('./index.html');
                
                // Trouver toutes les références de script
                preg_match_all('/<script[^>]*src=["\']([^"\']*)["\'][^>]*>/i', $current_content, $script_matches);
                $script_refs = $script_matches[1];
                
                // Trouver toutes les références de feuille de style
                preg_match_all('/<link[^>]*href=["\']([^"\']*)["\'][^>]*rel=["\']stylesheet["\'][^>]*>/i', $current_content, $style_matches1);
                preg_match_all('/<link[^>]*rel=["\']stylesheet["\'][^>]*href=["\']([^"\']*)["\'][^>]*>/i', $current_content, $style_matches2);
                $style_refs = array_merge($style_matches1[1], $style_matches2[1]);
                
                echo "<h3>Références dans index.html après correction:</h3>";
                
                echo "<h4>Scripts référencés:</h4>";
                echo "<ul>";
                foreach ($script_refs as $ref) {
                    $js_ref_found = false;
                    foreach ($new_js_files as $js_file) {
                        if (strpos($ref, basename($js_file)) !== false) {
                            $js_ref_found = true;
                            break;
                        }
                    }
                    $class = $js_ref_found ? 'success' : 'error';
                    echo "<li class='$class'>" . htmlspecialchars($ref) . ($js_ref_found ? " ✓" : " ✗") . "</li>";
                }
                echo "</ul>";
                
                echo "<h4>Styles référencés:</h4>";
                echo "<ul>";
                foreach ($style_refs as $ref) {
                    $css_ref_found = false;
                    foreach ($new_css_files as $css_file) {
                        if (strpos($ref, basename($css_file)) !== false) {
                            $css_ref_found = true;
                            break;
                        }
                    }
                    $class = $css_ref_found ? 'success' : 'error';
                    echo "<li class='$class'>" . htmlspecialchars($ref) . ($css_ref_found ? " ✓" : " ✗") . "</li>";
                }
                echo "</ul>";
            }
            ?>
            <h3>Contenu de index.html après mise à jour:</h3>
            <pre><?php echo htmlspecialchars(file_get_contents('./index.html')); ?></pre>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>4. Instructions manuelles supplémentaires</h2>
        <p>Si le script n'a pas pu résoudre tous les problèmes, voici des étapes manuelles à suivre:</p>
        <ol>
            <li>Assurez-vous que <code>npm run build</code> a bien été exécuté pour générer les fichiers dans <code>dist/assets</code></li>
            <li>Vérifiez que les fichiers compilés contiennent un hachage (par exemple, <code>main.GxNrB2FB.js</code>)</li>
            <li>Si aucun fichier CSS n'est généré dans le build, vérifiez que votre configuration Vite importe correctement le CSS:</li>
            <li>Dans <code>src/main.tsx</code> ou <code>src/main.jsx</code>, assurez-vous d'avoir une ligne comme <code>import './index.css'</code></li>
            <li>Si vous avez des styles globaux, créez manuellement un fichier <code>assets/index.css</code> et référencez-le dans <code>index.html</code></li>
            <li>Vérifiez votre configuration dans <code>vite.config.ts</code> pour vous assurer que les styles CSS sont correctement extraits lors du build</li>
        </ol>
    </div>
    
    <p><a href="index.html">Retour à l'application</a></p>
</body>
</html>
