
<?php
header('Content-Type: text/html; charset=utf-8');

function check_files() {
    $required_files = [
        'index.html' => 'Page d\'accueil',
        '.htaccess' => 'Configuration Apache'
    ];
    
    $js_files = glob('./assets/*.js');
    $css_files = glob('./assets/*.css');
    
    $results = [
        'success' => true,
        'files' => [],
        'js' => !empty($js_files),
        'css' => !empty($css_files),
        'js_file' => !empty($js_files) ? basename($js_files[0]) : '',
        'css_file' => !empty($css_files) ? basename($css_files[0]) : '',
    ];
    
    foreach ($required_files as $file => $description) {
        $exists = file_exists($file);
        $results['files'][$file] = [
            'exists' => $exists,
            'description' => $description
        ];
        
        if (!$exists) {
            $results['success'] = false;
        }
    }
    
    // Vérifier les références dans index.html
    if (file_exists('index.html')) {
        $content = file_get_contents('index.html');
        $results['index_content'] = $content;
        
        // Vérifier les références JS
        $has_js_ref = preg_match('/<script[^>]*src=["\'](\/assets\/[^"\']*\.js)["\']/i', $content, $js_matches);
        $results['has_js_ref'] = $has_js_ref;
        $results['js_ref'] = $has_js_ref ? $js_matches[1] : '';
        
        // Vérifier les références CSS
        $has_css_ref = preg_match('/<link[^>]*href=["\'](\/assets\/[^"\']*\.css)["\']/i', $content, $css_matches);
        $results['has_css_ref'] = $has_css_ref;
        $results['css_ref'] = $has_css_ref ? $css_matches[1] : '';
        
        // Vérifier s'il y a des références à /src/
        $has_src_ref = preg_match('/<script[^>]*src=["\'](\/src\/[^"\']*\.[jt]sx?)["\']/i', $content);
        $results['has_src_ref'] = $has_src_ref;
        
        if (!$has_js_ref || !$has_css_ref || $has_src_ref) {
            $results['success'] = false;
        }
    }
    
    return $results;
}

function fix_index_html() {
    if (!file_exists('index.html')) {
        return ['success' => false, 'message' => 'index.html introuvable'];
    }
    
    // Backup
    copy('index.html', 'index.html.bak');
    
    $content = file_get_contents('index.html');
    $original = $content;
    
    $js_files = glob('./assets/*.js');
    $css_files = glob('./assets/*.css');
    
    // Trouver les fichiers JS et CSS principaux
    $main_js = '';
    if (!empty($js_files)) {
        foreach ($js_files as $file) {
            if (strpos(basename($file), 'main-') === 0 || strpos(basename($file), 'index-') === 0) {
                $main_js = '/assets/' . basename($file);
                break;
            }
        }
        if (empty($main_js)) {
            $main_js = '/assets/' . basename($js_files[0]);
        }
    }
    
    $main_css = '';
    if (!empty($css_files)) {
        foreach ($css_files as $file) {
            if (strpos(basename($file), 'index-') === 0 || strpos(basename($file), 'main-') === 0) {
                $main_css = '/assets/' . basename($file);
                break;
            }
        }
        if (empty($main_css)) {
            $main_css = '/assets/' . basename($css_files[0]);
        }
    }
    
    $changes = [];
    
    // Corriger les références JS
    if (!empty($main_js)) {
        if (preg_match('/<script[^>]*src=["\'](\/src\/[^"\']*\.[jt]sx?)["\']/i', $content)) {
            $content = preg_replace(
                '/<script[^>]*src=["\'](\/src\/[^"\']*\.[jt]sx?)["\']/i',
                '<script type="module" src="' . $main_js . '"',
                $content
            );
            $changes[] = 'Référence /src/ remplacée par ' . $main_js;
        } else if (!preg_match('/<script[^>]*src=["\'](\/assets\/[^"\']*\.js)["\']/i', $content)) {
            $content = str_replace(
                '</body>',
                '  <script type="module" src="' . $main_js . '"></script>' . "\n  " . '</body>',
                $content
            );
            $changes[] = 'Ajout de la référence JS: ' . $main_js;
        }
    }
    
    // Corriger les références CSS
    if (!empty($main_css) && !preg_match('/<link[^>]*href=["\'](\/assets\/[^"\']*\.css)["\']/i', $content)) {
        $content = str_replace(
            '</head>',
            '  <link rel="stylesheet" href="' . $main_css . '">' . "\n  " . '</head>',
            $content
        );
        $changes[] = 'Ajout de la référence CSS: ' . $main_css;
    }
    
    if ($content !== $original) {
        file_put_contents('index.html', $content);
        return [
            'success' => true,
            'message' => 'index.html mis à jour avec succès',
            'changes' => $changes
        ];
    }
    
    return [
        'success' => true,
        'message' => 'Aucune modification nécessaire',
        'changes' => []
    ];
}

$check_results = check_files();
$fix_results = null;

if (isset($_POST['fix_index'])) {
    $fix_results = fix_index_html();
    $check_results = check_files(); // Refaire la vérification après la correction
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification du Déploiement</title>
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
    <h1>Vérification du Déploiement</h1>
    
    <div class="section">
        <h2>État des Fichiers</h2>
        <?php foreach ($check_results['files'] as $file => $info): ?>
            <p><?= $info['description'] ?> (<?= $file ?>): 
                <?php if ($info['exists']): ?>
                    <span class="success">EXISTE</span>
                    <?php if ($file == 'index.html'): ?>
                        (<?= filesize($file) ?> octets)
                    <?php endif; ?>
                <?php else: ?>
                    <span class="error">N'EXISTE PAS</span>
                <?php endif; ?>
            </p>
        <?php endforeach; ?>
    </div>
    
    <div class="section">
        <h2>Fichiers JavaScript et CSS</h2>
        <p>Fichiers JavaScript dans /assets/: 
            <?php if ($check_results['js']): ?>
                <span class="success">TROUVÉS</span> (<?= $check_results['js_file'] ?>)
            <?php else: ?>
                <span class="error">AUCUN</span>
            <?php endif; ?>
        </p>
        <p>Fichiers CSS dans /assets/: 
            <?php if ($check_results['css']): ?>
                <span class="success">TROUVÉS</span> (<?= $check_results['css_file'] ?>)
            <?php else: ?>
                <span class="error">AUCUN</span>
            <?php endif; ?>
        </p>
    </div>
    
    <div class="section">
        <h2>Vérification de index.html</h2>
        <?php if (isset($check_results['has_js_ref'])): ?>
            <p>Référence à un fichier JavaScript dans /assets/: 
                <?php if ($check_results['has_js_ref']): ?>
                    <span class="success">TROUVÉE</span> (<?= $check_results['js_ref'] ?>)
                <?php else: ?>
                    <span class="error">NON TROUVÉE</span>
                <?php endif; ?>
            </p>
            <p>Référence à un fichier CSS dans /assets/: 
                <?php if ($check_results['has_css_ref']): ?>
                    <span class="success">TROUVÉE</span> (<?= $check_results['css_ref'] ?>)
                <?php else: ?>
                    <span class="error">NON TROUVÉE</span>
                <?php endif; ?>
            </p>
            <p>Référence à un fichier dans /src/: 
                <?php if ($check_results['has_src_ref']): ?>
                    <span class="error">TROUVÉE</span> (doit être remplacée)
                <?php else: ?>
                    <span class="success">NON TROUVÉE</span>
                <?php endif; ?>
            </p>
        <?php endif; ?>
        
        <?php if (!$check_results['success'] && (!isset($_POST['fix_index']) || (isset($fix_results) && !$fix_results['success']))): ?>
            <form method="post">
                <input type="hidden" name="fix_index" value="1">
                <p>Des problèmes ont été détectés dans index.html. Cliquez ci-dessous pour les corriger automatiquement :</p>
                <button type="submit" class="fix-button">Corriger index.html</button>
            </form>
        <?php elseif (isset($fix_results)): ?>
            <div class="success">
                <p><?= $fix_results['message'] ?></p>
                <?php if (!empty($fix_results['changes'])): ?>
                    <ul>
                        <?php foreach ($fix_results['changes'] as $change): ?>
                            <li><?= $change ?></li>
                        <?php endforeach; ?>
                    </ul>
                <?php endif; ?>
            </div>
        <?php elseif ($check_results['success']): ?>
            <p><span class="success">Aucun problème détecté!</span></p>
        <?php endif; ?>
    </div>
    
    <?php if (isset($check_results['index_content'])): ?>
    <div class="section">
        <h3>Contenu actuel de index.html:</h3>
        <pre><?= htmlspecialchars($check_results['index_content']) ?></pre>
    </div>
    <?php endif; ?>
    
    <div class="section">
        <h2>Actions recommandées</h2>
        <?php if (!$check_results['success']): ?>
            <ol>
                <?php if (!$check_results['js']): ?>
                    <li class="error">CRITIQUE: Aucun fichier JavaScript trouvé dans /assets/. Générez un build (npm run build) et copiez les fichiers dans le dossier assets.</li>
                <?php endif; ?>
                
                <?php if (!$check_results['css']): ?>
                    <li class="warning">Aucun fichier CSS trouvé dans /assets/. Votre application pourrait ne pas s'afficher correctement.</li>
                <?php endif; ?>
                
                <?php if (isset($check_results['has_src_ref']) && $check_results['has_src_ref']): ?>
                    <li class="error">index.html référence un fichier dans /src/ qui n'existe pas en production. Corrigez cette référence.</li>
                <?php endif; ?>
                
                <?php if (isset($check_results['has_js_ref']) && !$check_results['has_js_ref']): ?>
                    <li class="error">index.html ne contient pas de référence à un fichier JavaScript. Votre application ne peut pas fonctionner.</li>
                <?php endif; ?>
            </ol>
        <?php else: ?>
            <p><span class="success">Votre déploiement semble correct!</span> Si vous rencontrez toujours des problèmes, vérifiez les éléments suivants:</p>
            <ul>
                <li>Videz le cache de votre navigateur</li>
                <li>Vérifiez les erreurs dans la console JavaScript</li>
                <li>Assurez-vous que votre backend API fonctionne correctement</li>
                <li>Vérifiez les logs du serveur pour des erreurs 404 ou 500</li>
            </ul>
        <?php endif; ?>
        
        <h3>Outils supplémentaires</h3>
        <p>
            <a href="fix-directory-structure.php">Corriger la structure des dossiers</a> | 
            <a href="check-assets-deployment.php">Diagnostic complet du déploiement</a> | 
            <a href="copy-assets.php">Copier les assets compilés</a>
        </p>
    </div>
</body>
</html>
