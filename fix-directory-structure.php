
<?php
header('Content-Type: text/html; charset=utf-8');
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
        // Vérifier les répertoires importants
        $directories = [
            './' => 'Répertoire racine',
            './assets' => 'Dossier des assets',
            '../assets' => 'Dossier des assets (un niveau au-dessus)',
            './api' => 'Dossier API',
            './public' => 'Dossier public'
        ];
        
        foreach ($directories as $dir => $desc) {
            echo "<p>$desc ($dir): ";
            if (is_dir($dir)) {
                echo "<span class='success'>EXISTE</span>";
                $files = glob($dir . '/*');
                echo " (" . count($files) . " fichiers/dossiers)";
            } else {
                echo "<span class='error'>N'EXISTE PAS</span>";
            }
            echo "</p>";
        }
        
        // Vérifier où se trouvent les fichiers JS
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
                echo "<span class='success'>TROUVÉ</span> (" . count($files) . " fichiers)";
                echo "<ul>";
                $counter = 0;
                foreach ($files as $file) {
                    if ($counter < 5) {
                        echo "<li>" . basename($file) . "</li>";
                    } else if ($counter == 5) {
                        echo "<li>... et " . (count($files) - 5) . " autres fichiers</li>";
                        break;
                    }
                    $counter++;
                }
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
            
            // Créer le dossier assets s'il n'existe pas
            if (!is_dir('./assets')) {
                if (mkdir('./assets', 0755, true)) {
                    echo "<p>Création du dossier <code>./assets</code>: <span class='success'>SUCCÈS</span></p>";
                } else {
                    echo "<p>Création du dossier <code>./assets</code>: <span class='error'>ÉCHEC</span></p>";
                }
            }
            
            // Chercher des fichiers JS au niveau supérieur pour les copier
            $source_js = glob('../assets/*.js');
            if (!empty($source_js)) {
                echo "<p>Copie des fichiers JS depuis <code>../assets/</code>: ";
                $success = true;
                $copied = 0;
                
                foreach ($source_js as $file) {
                    $dest = './assets/' . basename($file);
                    if (copy($file, $dest)) {
                        $copied++;
                    } else {
                        $success = false;
                    }
                }
                
                if ($success && $copied > 0) {
                    echo "<span class='success'>SUCCÈS</span> ($copied fichiers copiés)</p>";
                } else {
                    echo "<span class='error'>ÉCHEC</span> (problème lors de la copie)</p>";
                }
            } else {
                echo "<p>Aucun fichier JS trouvé dans <code>../assets/</code> à copier</p>";
            }
            
            // Chercher des fichiers CSS au niveau supérieur pour les copier
            $source_css = glob('../assets/*.css');
            if (!empty($source_css)) {
                echo "<p>Copie des fichiers CSS depuis <code>../assets/</code>: ";
                $success = true;
                $copied = 0;
                
                foreach ($source_css as $file) {
                    $dest = './assets/' . basename($file);
                    if (copy($file, $dest)) {
                        $copied++;
                    } else {
                        $success = false;
                    }
                }
                
                if ($success && $copied > 0) {
                    echo "<span class='success'>SUCCÈS</span> ($copied fichiers copiés)</p>";
                } else {
                    echo "<span class='error'>ÉCHEC</span> (problème lors de la copie)</p>";
                }
            } else {
                echo "<p>Aucun fichier CSS trouvé dans <code>../assets/</code> à copier</p>";
            }
            
            // Vérifier si index.html pointe maintenant vers les bons fichiers
            if (file_exists('./index.html')) {
                $index_content = file_get_contents('./index.html');
                
                // Vérifier les références aux fichiers compilés
                $has_js_reference = preg_match('/\/assets\/[^"]*\.js/i', $index_content);
                $has_css_reference = preg_match('/\/assets\/[^"]*\.css/i', $index_content);
                
                if (!$has_js_reference || !$has_css_reference) {
                    echo "<p>Mise à jour des références dans index.html: ";
                    
                    // Trouver les derniers fichiers JS et CSS
                    $js_files = glob('./assets/*.js');
                    $css_files = glob('./assets/*.css');
                    
                    if (!empty($js_files) && !empty($css_files)) {
                        // Trier par date de modification (le plus récent en premier)
                        usort($js_files, function($a, $b) {
                            return filemtime($b) - filemtime($a);
                        });
                        
                        usort($css_files, function($a, $b) {
                            return filemtime($b) - filemtime($a);
                        });
                        
                        // Identifier le fichier main-*.js et index-*.css
                        $main_js = null;
                        foreach ($js_files as $js_file) {
                            if (strpos(basename($js_file), 'main-') === 0) {
                                $main_js = basename($js_file);
                                break;
                            }
                        }
                        
                        $index_css = null;
                        foreach ($css_files as $css_file) {
                            if (strpos(basename($css_file), 'index-') === 0) {
                                $index_css = basename($css_file);
                                break;
                            }
                        }
                        
                        // Si aucun fichier main-*.js n'est trouvé, utiliser le premier fichier JS
                        if ($main_js === null && !empty($js_files)) {
                            $main_js = basename($js_files[0]);
                        }
                        
                        // Si aucun fichier index-*.css n'est trouvé, utiliser le premier fichier CSS
                        if ($index_css === null && !empty($css_files)) {
                            $index_css = basename($css_files[0]);
                        }
                        
                        if ($main_js !== null && $index_css !== null) {
                            // Créer une sauvegarde
                            copy('./index.html', './index.html.bak');
                            
                            // Modifier le contenu
                            $new_content = $index_content;
                            
                            // Remplacer la référence au fichier CSS
                            $new_content = preg_replace(
                                '/<link[^>]*rel="stylesheet"[^>]*>/',
                                '<link rel="stylesheet" href="/assets/' . $index_css . '">',
                                $new_content
                            );
                            
                            // Remplacer la référence au fichier JS
                            $new_content = preg_replace(
                                '/<script[^>]*src="\/src\/main\.tsx"[^>]*>/',
                                '<script type="module" src="/assets/' . $main_js . '">',
                                $new_content
                            );
                            
                            if (file_put_contents('./index.html', $new_content)) {
                                echo "<span class='success'>SUCCÈS</span> (fichiers référencés: $main_js et $index_css)</p>";
                            } else {
                                echo "<span class='error'>ÉCHEC</span> (impossible d'écrire dans index.html)</p>";
                            }
                        } else {
                            echo "<span class='error'>ÉCHEC</span> (fichiers JS/CSS appropriés non trouvés)</p>";
                        }
                    } else {
                        echo "<span class='error'>ÉCHEC</span> (fichiers JS/CSS non disponibles)</p>";
                    }
                } else {
                    echo "<p>Les références dans index.html sont déjà correctes</p>";
                }
            } else {
                echo "<p>Le fichier index.html n'existe pas à la racine</p>";
            }
        } else {
            // Afficher le formulaire pour la correction
            echo "<form method='post'>";
            echo "<p>Ce script va tenter de créer/corriger la structure des répertoires et de copier les fichiers nécessaires.</p>";
            echo "<input type='hidden' name='fix_structure' value='1'>";
            echo "<button type='submit' style='background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;'>Corriger la structure</button>";
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
