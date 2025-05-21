
<?php
header('Content-Type: text/html; charset=utf-8');

// Configuration
$root_dir = dirname(__DIR__); // Remonter d'un niveau depuis /api
$index_file = $root_dir . '/index.html';
$assets_dir = $root_dir . '/assets';
$dist_assets_dir = $root_dir . '/dist/assets';

// Fonction pour journaliser
function log_message($message) {
    error_log("[fix-main-references] " . $message);
    echo "<p>" . htmlspecialchars($message) . "</p>";
}

// Fonction pour trouver le fichier principal (JS ou CSS)
function find_main_file($directory, $pattern) {
    if (!is_dir($directory)) {
        return null;
    }
    
    $files = glob($directory . '/' . $pattern);
    if (empty($files)) {
        return null;
    }
    
    // Trier par date de modification (plus récent d'abord)
    usort($files, function($a, $b) {
        return filemtime($b) - filemtime($a);
    });
    
    return $files[0];
}

// Sauvegarde de index.html
function backup_index_file($file_path) {
    if (file_exists($file_path)) {
        $backup_path = $file_path . '.bak.' . date('Y-m-d-His');
        copy($file_path, $backup_path);
        return $backup_path;
    }
    return false;
}

// Fonction pour copier les assets de dist vers le dossier assets
function copy_dist_assets($from_dir, $to_dir) {
    if (!is_dir($from_dir)) {
        return ['success' => false, 'message' => "Le dossier source $from_dir n'existe pas"];
    }
    
    // Créer le dossier de destination s'il n'existe pas
    if (!is_dir($to_dir)) {
        if (!mkdir($to_dir, 0755, true)) {
            return ['success' => false, 'message' => "Impossible de créer le dossier $to_dir"];
        }
    }
    
    $files = glob($from_dir . '/*');
    $copied = 0;
    $failed = 0;
    
    foreach ($files as $file) {
        $filename = basename($file);
        $dest = $to_dir . '/' . $filename;
        
        if (copy($file, $dest)) {
            $copied++;
        } else {
            $failed++;
        }
    }
    
    return [
        'success' => $copied > 0,
        'copied' => $copied,
        'failed' => $failed,
        'message' => "Copié $copied fichiers, $failed échecs"
    ];
}

// Analyser index.html
function analyze_index_html($file_path) {
    if (!file_exists($file_path)) {
        return ['exists' => false];
    }
    
    $content = file_get_contents($file_path);
    
    return [
        'exists' => true,
        'size' => filesize($file_path),
        'content' => $content,
        'has_js' => preg_match('/<script[^>]*src=[\'"]([^\'"]*)[\'"]/', $content, $js_matches),
        'has_css' => preg_match('/<link[^>]*href=[\'"]([^\'"]*\.css)[\'"]/', $content, $css_matches),
        'js_path' => isset($js_matches[1]) ? $js_matches[1] : null,
        'css_path' => isset($css_matches[1]) ? $css_matches[1] : null,
        'has_src_ref' => strpos($content, '/src/main.tsx') !== false || strpos($content, '/src/main.js') !== false
    ];
}

// Mettre à jour index.html
function update_index_html($file_path, $js_path = null, $css_path = null) {
    if (!file_exists($file_path)) {
        return ['success' => false, 'message' => 'Le fichier index.html n\'existe pas'];
    }
    
    $content = file_get_contents($file_path);
    $original = $content;
    $changes = [];
    
    // Mettre à jour la référence JS si fournie
    if ($js_path) {
        $js_path_relative = '/assets/' . basename($js_path);
        
        if (strpos($content, '/src/main.tsx') !== false || strpos($content, '/src/main.js') !== false) {
            // Remplacer la référence à src/main.tsx ou src/main.js
            $content = preg_replace(
                '/<script[^>]*src=[\'"][^\'"]*\/src\/main\.[tj]sx?[\'"][^>]*>/',
                '<script type="module" src="' . $js_path_relative . '">',
                $content
            );
            $changes[] = "Remplacé référence /src/main.tsx par $js_path_relative";
        } elseif (preg_match('/<script[^>]*src=[\'"]\/assets\/[^\'"]*\.js[\'"][^>]*>/', $content)) {
            // Remplacer une référence existante à un fichier dans /assets/
            $content = preg_replace(
                '/<script[^>]*src=[\'"]\/assets\/[^\'"]*\.js[\'"][^>]*>/',
                '<script type="module" src="' . $js_path_relative . '">',
                $content
            );
            $changes[] = "Mis à jour référence JS vers $js_path_relative";
        } else {
            // Ajouter une nouvelle référence avant la fermeture de body
            $content = preg_replace(
                '/<\/body>/',
                '  <script type="module" src="' . $js_path_relative . '"></script>' . "\n  " . '</body>',
                $content
            );
            $changes[] = "Ajouté référence JS $js_path_relative";
        }
    }
    
    // Mettre à jour la référence CSS si fournie
    if ($css_path) {
        $css_path_relative = '/assets/' . basename($css_path);
        
        if (preg_match('/<link[^>]*href=[\'"]\/assets\/[^\'"]*\.css[\'"][^>]*>/', $content)) {
            // Remplacer la référence CSS existante
            $content = preg_replace(
                '/<link[^>]*href=[\'"]\/assets\/[^\'"]*\.css[\'"][^>]*>/',
                '<link rel="stylesheet" href="' . $css_path_relative . '">',
                $content
            );
            $changes[] = "Mis à jour référence CSS vers $css_path_relative";
        } else {
            // Ajouter une nouvelle référence CSS avant la fermeture de head
            $content = preg_replace(
                '/<\/head>/',
                '  <link rel="stylesheet" href="' . $css_path_relative . '">' . "\n  " . '</head>',
                $content
            );
            $changes[] = "Ajouté référence CSS $css_path_relative";
        }
    }
    
    // Vérifier la présence du script GPT Engineer
    if (strpos($content, 'cdn.gpteng.co/gptengineer.js') === false) {
        $content = preg_replace(
            '/<\/body>/',
            '  <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>' . "\n  " . '</body>',
            $content
        );
        $changes[] = "Ajouté script GPT Engineer";
    }
    
    // Enregistrer les modifications si nécessaire
    if ($content !== $original) {
        if (file_put_contents($file_path, $content)) {
            return ['success' => true, 'message' => 'Fichier mis à jour avec succès', 'changes' => $changes];
        } else {
            return ['success' => false, 'message' => 'Erreur lors de la mise à jour du fichier', 'changes' => $changes];
        }
    }
    
    return ['success' => false, 'message' => 'Aucune modification nécessaire', 'changes' => []];
}

// Afficher l'interface utilisateur
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des Références de Fichiers</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.6; }
        .container { max-width: 1000px; margin: 0 auto; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
        pre { background: #f9f9f9; padding: 15px; border-radius: 5px; overflow-x: auto; border: 1px solid #eee; }
        .button { background: #4CAF50; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 4px; font-size: 16px; }
        .button:hover { background: #45a049; }
        .button-secondary { background: #607d8b; }
        .file-list { max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; }
        table { width: 100%; border-collapse: collapse; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Correction des Références de Fichiers</h1>
        
        <div class="section">
            <h2>État Actuel</h2>
            <?php
            // Vérification de index.html
            $index_analysis = analyze_index_html($index_file);
            if ($index_analysis['exists']) {
                echo "<p>Fichier index.html: <span class='success'>TROUVÉ</span> (" . $index_analysis['size'] . " octets)</p>";
                
                if ($index_analysis['has_js']) {
                    echo "<p>Référence JavaScript: <span class='success'>TROUVÉE</span> (" . $index_analysis['js_path'] . ")</p>";
                } else {
                    echo "<p>Référence JavaScript: <span class='error'>NON TROUVÉE</span></p>";
                }
                
                if ($index_analysis['has_css']) {
                    echo "<p>Référence CSS: <span class='success'>TROUVÉE</span> (" . $index_analysis['css_path'] . ")</p>";
                } else {
                    echo "<p>Référence CSS: <span class='error'>NON TROUVÉE</span></p>";
                }
                
                if ($index_analysis['has_src_ref']) {
                    echo "<p>Référence à /src/: <span class='warning'>TROUVÉE</span> (devrait être remplacée)</p>";
                }
            } else {
                echo "<p>Fichier index.html: <span class='error'>NON TROUVÉ</span></p>";
            }
            
            // Vérification des dossiers d'assets
            if (is_dir($assets_dir)) {
                $assets_count = count(glob($assets_dir . '/*'));
                echo "<p>Dossier assets: <span class='success'>TROUVÉ</span> ($assets_count fichiers)</p>";
            } else {
                echo "<p>Dossier assets: <span class='error'>NON TROUVÉ</span></p>";
            }
            
            if (is_dir($dist_assets_dir)) {
                $dist_assets_count = count(glob($dist_assets_dir . '/*'));
                echo "<p>Dossier dist/assets: <span class='success'>TROUVÉ</span> ($dist_assets_count fichiers)</p>";
            } else {
                echo "<p>Dossier dist/assets: <span class='error'>NON TROUVÉ</span></p>";
            }
            
            // Recherche des fichiers principaux
            $main_js = find_main_file($assets_dir, 'main*.js') ?: find_main_file($assets_dir, 'index*.js');
            $main_css = find_main_file($assets_dir, 'index*.css') ?: find_main_file($assets_dir, 'main*.css');
            
            echo "<h3>Fichiers principaux détectés:</h3>";
            if ($main_js) {
                echo "<p>JavaScript principal: <span class='success'>" . basename($main_js) . "</span></p>";
            } else {
                echo "<p>JavaScript principal: <span class='error'>NON TROUVÉ</span></p>";
            }
            
            if ($main_css) {
                echo "<p>CSS principal: <span class='success'>" . basename($main_css) . "</span></p>";
            } else {
                echo "<p>CSS principal: <span class='error'>NON TROUVÉ</span></p>";
            }
            
            // Liste des fichiers dans assets
            if (is_dir($assets_dir)) {
                $js_files = glob($assets_dir . '/*.js');
                $css_files = glob($assets_dir . '/*.css');
                
                if (!empty($js_files) || !empty($css_files)) {
                    echo "<h3>Fichiers disponibles dans /assets/:</h3>";
                    echo "<div class='file-list'>";
                    echo "<table>";
                    echo "<tr><th>Nom du fichier</th><th>Type</th><th>Taille</th></tr>";
                    
                    foreach ($js_files as $file) {
                        echo "<tr>";
                        echo "<td>" . basename($file) . "</td>";
                        echo "<td>JavaScript</td>";
                        echo "<td>" . filesize($file) . " octets</td>";
                        echo "</tr>";
                    }
                    
                    foreach ($css_files as $file) {
                        echo "<tr>";
                        echo "<td>" . basename($file) . "</td>";
                        echo "<td>CSS</td>";
                        echo "<td>" . filesize($file) . " octets</td>";
                        echo "</tr>";
                    }
                    
                    echo "</table>";
                    echo "</div>";
                }
            }
            ?>
        </div>
        
        <?php
        // Actions à effectuer si des boutons sont cliqués
        $action_result = null;
        
        // Copier les assets
        if (isset($_POST['copy_assets']) && is_dir($dist_assets_dir)) {
            $copy_result = copy_dist_assets($dist_assets_dir, $assets_dir);
            
            if ($copy_result['success']) {
                echo "<div class='section'>";
                echo "<h2>Résultat de la copie des assets</h2>";
                echo "<p><span class='success'>Succès:</span> " . $copy_result['message'] . "</p>";
                
                // Rafraîchir les chemins des fichiers principaux
                $main_js = find_main_file($assets_dir, 'main*.js') ?: find_main_file($assets_dir, 'index*.js');
                $main_css = find_main_file($assets_dir, 'index*.css') ?: find_main_file($assets_dir, 'main*.css');
                
                if ($main_js) {
                    echo "<p>JavaScript principal trouvé: <span class='success'>" . basename($main_js) . "</span></p>";
                }
                if ($main_css) {
                    echo "<p>CSS principal trouvé: <span class='success'>" . basename($main_css) . "</span></p>";
                }
                
                echo "</div>";
            } else {
                echo "<div class='section'>";
                echo "<h2>Erreur lors de la copie des assets</h2>";
                echo "<p><span class='error'>Erreur:</span> " . $copy_result['message'] . "</p>";
                echo "</div>";
            }
        }
        
        // Mettre à jour index.html
        if (isset($_POST['update_index']) && file_exists($index_file) && ($main_js || $main_css)) {
            $backup_path = backup_index_file($index_file);
            
            if ($backup_path) {
                echo "<div class='section'>";
                echo "<h2>Sauvegarde de index.html</h2>";
                echo "<p>Une sauvegarde a été créée: <span class='success'>" . basename($backup_path) . "</span></p>";
                echo "</div>";
            }
            
            $update_result = update_index_html($index_file, $main_js, $main_css);
            
            echo "<div class='section'>";
            echo "<h2>Résultat de la mise à jour de index.html</h2>";
            
            if ($update_result['success']) {
                echo "<p><span class='success'>Succès:</span> " . $update_result['message'] . "</p>";
                
                if (!empty($update_result['changes'])) {
                    echo "<h3>Modifications effectuées:</h3>";
                    echo "<ul>";
                    foreach ($update_result['changes'] as $change) {
                        echo "<li>" . htmlspecialchars($change) . "</li>";
                    }
                    echo "</ul>";
                }
                
                // Afficher le nouveau contenu
                echo "<h3>Nouveau contenu de index.html:</h3>";
                echo "<pre>" . htmlspecialchars(file_get_contents($index_file)) . "</pre>";
            } else {
                echo "<p><span class='error'>Erreur:</span> " . $update_result['message'] . "</p>";
            }
            
            echo "</div>";
            
            // Rafraîchir l'analyse de index.html
            $index_analysis = analyze_index_html($index_file);
        }
        ?>
        
        <div class="section">
            <h2>Actions Disponibles</h2>
            <form method="post">
                <?php if (is_dir($dist_assets_dir)): ?>
                <div style="margin-bottom: 20px;">
                    <button type="submit" name="copy_assets" class="button">
                        Copier les fichiers de dist/assets vers assets
                    </button>
                    <p><small>Copie tous les fichiers compilés du dossier dist/assets vers le dossier assets à la racine.</small></p>
                </div>
                <?php endif; ?>
                
                <?php if (file_exists($index_file) && ($main_js || $main_css)): ?>
                <div>
                    <button type="submit" name="update_index" class="button">
                        Mettre à jour index.html avec les bons fichiers
                    </button>
                    <p><small>Met à jour les références dans index.html pour pointer vers les bons fichiers JS et CSS.</small></p>
                </div>
                <?php endif; ?>
            </form>
        </div>
        
        <div class="section">
            <h2>Contenu de index.html</h2>
            <?php
            if ($index_analysis['exists']) {
                echo "<pre>" . htmlspecialchars($index_analysis['content']) . "</pre>";
            } else {
                echo "<p><span class='error'>Le fichier index.html n'existe pas.</span></p>";
            }
            ?>
        </div>
        
        <div class="section">
            <h2>Conseils de Dépannage</h2>
            <ol>
                <li><strong>Si vous venez de déployer l'application</strong>, assurez-vous que les fichiers compilés sont présents dans le dossier <code>dist/assets</code>.</li>
                <li><strong>Si vous avez déjà des fichiers dans <code>assets</code></strong> mais que l'application ne fonctionne pas, vérifiez que index.html y fait référence correctement.</li>
                <li><strong>En cas de problème persistant</strong>, exécutez <code>npm run build</code> localement, puis transférez le contenu du dossier <code>dist</code> à la racine de votre site.</li>
                <li>N'oubliez pas de vider le cache de votre navigateur après avoir appliqué les modifications.</li>
            </ol>
        </div>
        
        <div class="section">
            <h2>Réparation d'Urgence</h2>
            <?php 
            // Bouton de réparation d'urgence
            if (isset($_POST['emergency_fix'])) {
                // Créer un index.html minimal mais fonctionnel
                $emergency_html = <<<HTML
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Qualite.cloud - Système de Management de la Qualité</title>
    <meta name="description" content="Application web pour la gestion de la qualité et la conformité ISO 27001" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
  </head>
  <body>
    <div id="root"></div>
    <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>
HTML;
                
                // Ajouter les références aux fichiers existants
                if ($main_js) {
                    $js_path = '/assets/' . basename($main_js);
                    $emergency_html .= "    <script type=\"module\" src=\"{$js_path}\"></script>\n";
                }
                
                if ($main_css) {
                    $css_path = '/assets/' . basename($main_css);
                    $emergency_html .= "    <link rel=\"stylesheet\" href=\"{$css_path}\">\n";
                } else {
                    // Si aucun CSS n'est trouvé, on ajoute un style minimal
                    $emergency_html .= "    <style>body{font-family:sans-serif}</style>\n";
                }
                
                $emergency_html .= "  </body>\n</html>";
                
                // Faire une sauvegarde
                $backup_path = backup_index_file($index_file);
                
                // Écrire le fichier d'urgence
                $success = file_put_contents($index_file, $emergency_html);
                
                if ($success) {
                    echo "<p><span class='success'>SUCCÈS:</span> Un index.html de secours a été créé. L'original a été sauvegardé sous " . basename($backup_path) . "</p>";
                    echo "<p>Contenu du nouvel index.html:</p>";
                    echo "<pre>" . htmlspecialchars($emergency_html) . "</pre>";
                } else {
                    echo "<p><span class='error'>ERREUR:</span> Impossible de créer le fichier de secours.</p>";
                }
            }
            ?>
            <form method="post">
                <p><strong>ATTENTION:</strong> Utilisez cette option seulement en cas d'urgence. Cela créera un fichier index.html minimal avec les bonnes références.</p>
                <button type="submit" name="emergency_fix" class="button" style="background-color: #f44336;">
                    Créer un index.html de secours
                </button>
            </form>
        </div>
    </div>
</body>
</html>
