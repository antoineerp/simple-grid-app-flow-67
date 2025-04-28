
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des Chemins d'Assets pour Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Correction des Chemins d'Assets pour Infomaniak</h1>
    
    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 5px solid #4CAF50; border-radius: 3px;">
        <p>Cet outil vérifie et corrige les problèmes de chemins d'assets spécifiques à l'hébergement Infomaniak.</p>
    </div>

    <?php
    // Vérifier la structure actuelle
    $document_root = $_SERVER['DOCUMENT_ROOT'];
    $parent_dir = dirname($document_root);
    $current_dir = getcwd();
    
    echo "<h2>Environnement détecté</h2>";
    echo "<p>DOCUMENT_ROOT: {$document_root}</p>";
    echo "<p>Répertoire parent: {$parent_dir}</p>";
    echo "<p>Répertoire courant: {$current_dir}</p>";
    
    // Vérifier les dossiers assets
    $assets_paths = [
        './assets' => 'Chemin relatif au répertoire courant',
        '../assets' => 'Chemin relatif au répertoire parent',
        $document_root . '/assets' => 'Chemin absolu depuis DOCUMENT_ROOT',
    ];
    
    echo "<h2>Emplacements des assets</h2>";
    echo "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>";
    echo "<tr><th>Chemin</th><th>Description</th><th>Statut</th></tr>";
    
    foreach ($assets_paths as $path => $desc) {
        $exists = is_dir($path);
        $status_class = $exists ? 'success' : 'error';
        $status_text = $exists ? 'Existe' : 'N\'existe pas';
        
        echo "<tr>
                <td>{$path}</td>
                <td>{$desc}</td>
                <td class='{$status_class}'>{$status_text}</td>
              </tr>";
    }
    echo "</table>";
    
    // Trouver les fichiers JS et CSS
    $js_files = [];
    $css_files = [];
    
    foreach ($assets_paths as $path => $desc) {
        if (is_dir($path)) {
            $found_js = glob($path . '/*.js');
            $found_css = glob($path . '/*.css');
            
            if (!empty($found_js)) {
                $js_files[$path] = $found_js;
            }
            
            if (!empty($found_css)) {
                $css_files[$path] = $found_css;
            }
        }
    }
    
    // Afficher les fichiers trouvés
    echo "<h2>Fichiers d'assets trouvés</h2>";
    
    if (empty($js_files) && empty($css_files)) {
        echo "<p class='error'>Aucun fichier d'asset trouvé!</p>";
    } else {
        foreach ($js_files as $path => $files) {
            echo "<h3>JavaScript dans {$path}</h3>";
            echo "<ul>";
            foreach ($files as $file) {
                $filename = basename($file);
                $size = round(filesize($file) / 1024, 2);
                echo "<li>{$filename} - {$size} KB</li>";
            }
            echo "</ul>";
        }
        
        foreach ($css_files as $path => $files) {
            echo "<h3>CSS dans {$path}</h3>";
            echo "<ul>";
            foreach ($files as $file) {
                $filename = basename($file);
                $size = round(filesize($file) / 1024, 2);
                echo "<li>{$filename} - {$size} KB</li>";
            }
            echo "</ul>";
        }
    }
    
    // Vérifier le fichier index.html
    $index_file = $document_root . '/index.html';
    echo "<h2>Analyse du fichier index.html</h2>";
    
    if (file_exists($index_file)) {
        echo "<p class='success'>Fichier index.html trouvé</p>";
        $content = file_get_contents($index_file);
        
        // Analyser les références
        $js_refs = [];
        preg_match_all('/<script[^>]*src=[\'"]([^\'"]*)[\'"][^>]*>/i', $content, $script_matches);
        foreach ($script_matches[1] as $src) {
            if (strpos($src, '.js') !== false) {
                $js_refs[] = $src;
            }
        }
        
        $css_refs = [];
        preg_match_all('/<link[^>]*href=[\'"]([^\'"]*)[\'"][^>]*>/i', $content, $link_matches);
        foreach ($link_matches[1] as $href) {
            if (strpos($href, '.css') !== false) {
                $css_refs[] = $href;
            }
        }
        
        echo "<p>Références JavaScript trouvées:</p>";
        echo "<ul>";
        foreach ($js_refs as $ref) {
            echo "<li>{$ref}</li>";
        }
        echo "</ul>";
        
        echo "<p>Références CSS trouvées:</p>";
        echo "<ul>";
        foreach ($css_refs as $ref) {
            echo "<li>{$ref}</li>";
        }
        echo "</ul>";
        
        // Vérifier les références
        $any_issue = false;
        
        foreach ($js_refs as $ref) {
            $physical_path = $document_root . $ref;
            if (!file_exists($physical_path)) {
                echo "<p class='error'>Le fichier référencé {$ref} n'existe pas à l'emplacement {$physical_path}</p>";
                $any_issue = true;
            }
        }
        
        foreach ($css_refs as $ref) {
            $physical_path = $document_root . $ref;
            if (!file_exists($physical_path)) {
                echo "<p class='error'>Le fichier référencé {$ref} n'existe pas à l'emplacement {$physical_path}</p>";
                $any_issue = true;
            }
        }
        
        if ($any_issue) {
            echo "<p class='error'>Des problèmes ont été détectés avec les références de fichiers.</p>";
        } else {
            echo "<p class='success'>Toutes les références de fichiers semblent correctes.</p>";
        }
    } else {
        echo "<p class='error'>Fichier index.html non trouvé à l'emplacement {$index_file}</p>";
    }
    
    // Proposer des corrections
    echo "<h2>Actions correctives</h2>";
    
    if (isset($_POST['fix_issues'])) {
        // Créer le dossier assets s'il n'existe pas
        if (!is_dir($document_root . '/assets')) {
            if (mkdir($document_root . '/assets', 0755, true)) {
                echo "<p class='success'>Dossier assets créé avec succès à {$document_root}/assets</p>";
            } else {
                echo "<p class='error'>Impossible de créer le dossier assets à {$document_root}/assets</p>";
            }
        }
        
        // Copier les fichiers si nécessaire
        $source_dir = '';
        if (is_dir('../assets')) {
            $source_dir = '../assets';
        } elseif (isset($js_files) && !empty($js_files)) {
            $source_dir = array_keys($js_files)[0];
        }
        
        if ($source_dir) {
            echo "<p>Copie des fichiers depuis {$source_dir} vers {$document_root}/assets</p>";
            
            // Copier les fichiers JS
            $js_copied = 0;
            $js_source_files = glob($source_dir . '/*.js');
            foreach ($js_source_files as $file) {
                $dest = $document_root . '/assets/' . basename($file);
                if (copy($file, $dest)) {
                    $js_copied++;
                }
            }
            echo "<p>Fichiers JavaScript copiés: {$js_copied}</p>";
            
            // Copier les fichiers CSS
            $css_copied = 0;
            $css_source_files = glob($source_dir . '/*.css');
            foreach ($css_source_files as $file) {
                $dest = $document_root . '/assets/' . basename($file);
                if (copy($file, $dest)) {
                    $css_copied++;
                }
            }
            echo "<p>Fichiers CSS copiés: {$css_copied}</p>";
            
            if ($js_copied > 0 || $css_copied > 0) {
                echo "<p class='success'>Fichiers copiés avec succès</p>";
                echo "<p>Vous devriez maintenant pouvoir accéder à votre application sans problèmes.</p>";
            } else {
                echo "<p class='warning'>Aucun fichier n'a été copié</p>";
            }
        } else {
            echo "<p class='error'>Aucun répertoire source valide trouvé pour copier les fichiers</p>";
        }
    } else {
        echo "<form method='post'>";
        echo "<input type='hidden' name='fix_issues' value='1'>";
        echo "<p>Cliquez sur le bouton ci-dessous pour tenter de résoudre automatiquement les problèmes de chemin d'assets :</p>";
        echo "<ul>";
        echo "<li>Création du dossier /assets à la racine du site si nécessaire</li>";
        echo "<li>Copie des fichiers JS et CSS depuis le répertoire source vers /assets</li>";
        echo "</ul>";
        echo "<button type='submit' class='fix-button'>Corriger les chemins d'assets</button>";
        echo "</form>";
    }
    ?>
    
    <h2>Recommandations manuelles</h2>
    <ol>
        <li>Assurez-vous que le dossier <code>assets</code> existe à la racine du site web</li>
        <li>Vérifiez que les fichiers JS et CSS compilés sont présents dans ce dossier</li>
        <li>Confirmez que les références dans <code>index.html</code> pointent vers des chemins commençant par <code>/assets/</code></li>
        <li>Si vous déployez à nouveau, assurez-vous que votre processus de déploiement copie le dossier <code>assets</code> au bon endroit</li>
    </ol>
</body>
</html>
