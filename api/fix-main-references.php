
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
        'has_src_ref' => strpos($content, '/src/main.tsx') !== false || strpos($content, '/src/main.js') !== false,
        'has_gpteng' => strpos($content, 'gptengineer.js') !== false
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
            '/<\/head>/',
            '  <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>' . "\n  " . '</head>',
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

// Création d'un index.html de secours avec des références correctes aux modules ES6
function create_emergency_index_html($index_file, $main_js = null, $main_css = null) {
    $backup_path = backup_index_file($index_file);
    
    // Construire le contenu HTML de base
    $emergency_html = <<<HTML
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Qualite.cloud - Système de Management de la Qualité</title>
    <meta name="description" content="Application web pour la gestion de la qualité et la conformité ISO 27001" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>

HTML;
    
    // Ajouter la référence CSS si disponible
    if ($main_css) {
        $css_path = '/assets/' . basename($main_css);
        $emergency_html .= '    <link rel="stylesheet" href="' . $css_path . '">' . "\n";
    }
    
    // Compléter le HTML
    $emergency_html .= "  </head>\n  <body>\n    <div id=\"root\"></div>\n";
    
    // Ajouter la référence JS si disponible
    if ($main_js) {
        $js_path = '/assets/' . basename($main_js);
        $emergency_html .= '    <script type="module" src="' . $js_path . '"></script>' . "\n";
    } else {
        // Fallback sur index.js si main.js n'est pas trouvé
        $emergency_html .= '    <script type="module" src="/assets/index.js"></script>' . "\n";
    }
    
    $emergency_html .= "  </body>\n</html>";
    
    if (file_put_contents($index_file, $emergency_html)) {
        return [
            'success' => true, 
            'message' => 'Fichier index.html de secours créé avec succès',
            'backup' => $backup_path,
            'content' => $emergency_html
        ];
    }
    
    return ['success' => false, 'message' => 'Erreur lors de la création du fichier de secours'];
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
        .urgent { background-color: #ffcccc; border: 2px solid #ff6666; padding: 15px; margin: 20px 0; border-radius: 8px; }
        .info-box { background-color: #e8f4fd; border: 1px solid #b3d7ff; padding: 15px; margin: 20px 0; border-radius: 8px; }
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
                
                if ($index_analysis['has_gpteng']) {
                    echo "<p>Script GPT Engineer: <span class='success'>TROUVÉ</span></p>";
                } else {
                    echo "<p>Script GPT Engineer: <span class='error'>NON TROUVÉ</span> (nécessaire pour certaines fonctionnalités)</p>";
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
            
            <?php if ($index_analysis['has_src_ref']): ?>
            <div class="urgent">
                <h3>⚠️ ALERTE: Problème détecté avec les modules ES6</h3>
                <p>Votre index.html fait référence à <strong>/src/main.tsx</strong> qui n'est pas un format valide pour les modules ES6 en production.</p>
                <p>Ce problème peut causer l'erreur: <strong>Uncaught TypeError: Failed to resolve module specifier "react"</strong></p>
                <p>Utilisez la réparation d'urgence ci-dessous pour corriger ce problème.</p>
            </div>
            <?php endif; ?>
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
        
        // Réparation d'urgence
        if (isset($_POST['emergency_fix'])) {
            // Créer un index.html minimal mais fonctionnel avec des importations ES6 correctes
            $result = create_emergency_index_html($index_file, $main_js, $main_css);
            
            echo "<div class='section'>";
            echo "<h2>Réparation d'Urgence</h2>";
            
            if ($result['success']) {
                echo "<p><span class='success'>SUCCÈS:</span> Un index.html de secours a été créé avec des références correctes aux modules ES6.</p>";
                echo "<p>L'original a été sauvegardé sous " . basename($result['backup']) . "</p>";
                echo "<p>Contenu du nouvel index.html:</p>";
                echo "<pre>" . htmlspecialchars($result['content']) . "</pre>";
                
                echo "<div class='info-box'>";
                echo "<h3>🔄 Veuillez vider le cache de votre navigateur</h3>";
                echo "<p>Après cette réparation, il est important de vider complètement le cache de votre navigateur:</p>";
                echo "<ul>";
                echo "<li>Chrome/Edge: Ctrl+Shift+Suppr</li>";
                echo "<li>Firefox: Ctrl+Shift+Suppr ou ⌘+Shift+Suppr sur Mac</li>";
                echo "<li>Safari: Option+⌘+E</li>";
                echo "</ul>";
                echo "<p>Assurez-vous de cocher 'Données en cache' ou 'Images et fichiers en cache'.</p>";
                echo "</div>";
            } else {
                echo "<p><span class='error'>ERREUR:</span> Impossible de créer le fichier de secours.</p>";
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
                <div style="margin-bottom: 20px;">
                    <button type="submit" name="update_index" class="button">
                        Mettre à jour index.html avec les bons fichiers
                    </button>
                    <p><small>Met à jour les références dans index.html pour pointer vers les bons fichiers JS et CSS.</small></p>
                </div>
                <?php endif; ?>
                
                <div>
                    <button type="submit" name="emergency_fix" class="button" style="background-color: #f44336;">
                        RÉPARATION D'URGENCE - Erreur de module ES6
                    </button>
                    <p><small><strong>Recommandé:</strong> Crée un index.html de secours avec des importations ES6 correctes pour résoudre l'erreur "Failed to resolve module specifier".</small></p>
                </div>
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
            <h2>Dépannage de l'erreur "Failed to resolve module specifier"</h2>
            <ol>
                <li><strong>Problème:</strong> Cette erreur se produit lorsque votre application utilise des importations ES6 (par exemple <code>import React from 'react'</code>) mais que le navigateur ne peut pas résoudre le module.</li>
                <li><strong>Cause:</strong> En production, les chemins des modules doivent être relatifs (commençant par "./", "../" ou "/") ou utiliser un importmap.</li>
                <li><strong>Solution:</strong> Utiliser le bouton "RÉPARATION D'URGENCE" ci-dessus pour corriger les références dans index.html.</li>
                <li><strong>Après réparation:</strong> Vider complètement le cache de votre navigateur et recharger la page.</li>
                <li><strong>Si le problème persiste:</strong> Vérifiez que vos fichiers JavaScript compilés sont bien présents dans le dossier assets et que leurs noms correspondent à ceux référencés dans index.html.</li>
            </ol>
        </div>
        
        <div class="section">
            <h2>Conseils de Dépannage</h2>
            <ol>
                <li><strong>Videz le cache</strong> de votre navigateur après avoir appliqué les modifications.</li>
                <li><strong>Navigation privée/incognito:</strong> Testez votre site dans une fenêtre de navigation privée pour éviter les problèmes de cache.</li>
                <li><strong>Vérifiez la console développeur</strong> de votre navigateur (F12) pour des erreurs plus précises.</li>
                <li><strong>Si vous avez un CDN</strong> ou un service de cache, pensez à purger son cache également.</li>
                <li><strong>En dernier recours:</strong> Si rien ne fonctionne, reconstruisez l'application avec <code>npm run build</code> et redéployez tous les fichiers.</li>
            </ol>
        </div>
    </div>
</body>
</html>

