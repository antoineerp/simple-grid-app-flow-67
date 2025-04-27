
<?php
header('Content-Type: text/html; charset=utf-8');

function findLatestAsset($pattern) {
    $files = glob($pattern);
    if (empty($files)) {
        return null;
    }
    
    // Sort by modification time (newest first)
    usort($files, function($a, $b) {
        return filemtime($b) - filemtime($a);
    });
    
    return $files[0];
}

function detectEnvironment() {
    $isProduction = false;
    $host = $_SERVER['HTTP_HOST'] ?? '';
    
    if ($host === 'qualiopi.ch' || strpos($host, '.qualiopi.ch') !== false || 
        strpos($host, '.infomaniak.') !== false) {
        $isProduction = true;
    }
    
    return [
        'isProduction' => $isProduction,
        'host' => $host
    ];
}

// Vérifier si le script a été exécuté après une action
$updated = false;
$message = '';
$error = '';

if (isset($_POST['fix_assets'])) {
    try {
        // Rechercher les derniers fichiers de build
        $jsFile = findLatestAsset('./assets/main-*.js') ?: findLatestAsset('./assets/*.js');
        $cssFile = findLatestAsset('./assets/index-*.css') ?: findLatestAsset('./assets/*.css');
        
        if (!$jsFile && !$cssFile) {
            throw new Exception("Aucun fichier assets trouvé. Exécutez d'abord 'npm run build'.");
        }
        
        // Lire le contenu de index.html
        $indexPath = './index.html';
        if (!file_exists($indexPath)) {
            throw new Exception("Le fichier index.html n'existe pas.");
        }
        
        // Créer une sauvegarde
        copy($indexPath, $indexPath . '.bak');
        
        // Lire le contenu
        $content = file_get_contents($indexPath);
        
        // Remplacer les références aux fichiers JS et CSS
        if ($jsFile) {
            $jsPath = '/' . str_replace('./', '', $jsFile);
            // Remplacer le script src existant ou ajouter un nouveau
            if (preg_match('/<script[^>]*src=["\'](\/|\.\/)?assets\/[^"\']*\.js["\'][^>]*><\/script>/', $content)) {
                $content = preg_replace(
                    '/<script[^>]*src=["\'](\/|\.\/)?assets\/[^"\']*\.js["\'][^>]*><\/script>/',
                    '<script type="module" src="' . $jsPath . '"></script>',
                    $content
                );
            } elseif (preg_match('/<script[^>]*src=["\'](\/|\.\/)?src\/[^"\']*\.tsx?["\'][^>]*>/', $content)) {
                $content = preg_replace(
                    '/<script[^>]*src=["\'](\/|\.\/)?src\/[^"\']*\.tsx?["\'][^>]*>/',
                    '<script type="module" src="' . $jsPath . '">',
                    $content
                );
            } else {
                // Ajouter avant la fermeture du body
                $content = preg_replace(
                    '/<\/body>/',
                    '  <script type="module" src="' . $jsPath . '"></script>' . PHP_EOL . '</body>',
                    $content
                );
            }
        }
        
        if ($cssFile) {
            $cssPath = '/' . str_replace('./', '', $cssFile);
            // Remplacer le lien CSS existant ou ajouter un nouveau
            if (preg_match('/<link[^>]*href=["\'](\/|\.\/)?assets\/[^"\']*\.css["\'][^>]*>/', $content)) {
                $content = preg_replace(
                    '/<link[^>]*href=["\'](\/|\.\/)?assets\/[^"\']*\.css["\'][^>]*>/',
                    '<link rel="stylesheet" href="' . $cssPath . '">',
                    $content
                );
            } elseif (preg_match('/<link[^>]*href=["\'](\/|\.\/)?src\/[^"\']*\.css["\'][^>]*>/', $content)) {
                $content = preg_replace(
                    '/<link[^>]*href=["\'](\/|\.\/)?src\/[^"\']*\.css["\'][^>]*>/',
                    '<link rel="stylesheet" href="' . $cssPath . '">',
                    $content
                );
            } else {
                // Ajouter avant la fermeture du head
                $content = preg_replace(
                    '/<\/head>/',
                    '  <link rel="stylesheet" href="' . $cssPath . '">' . PHP_EOL . '</head>',
                    $content
                );
            }
        }
        
        // S'assurer que le script GPT Engineer est présent
        if (!strpos($content, 'cdn.gpteng.co/gptengineer.js')) {
            $content = preg_replace(
                '/<\/body>/',
                '  <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>' . PHP_EOL . '</body>',
                $content
            );
        }
        
        // Écrire le contenu mis à jour
        file_put_contents($indexPath, $content);
        
        $updated = true;
        $message = "Index.html mis à jour avec succès pour utiliser " . 
            ($jsFile ? basename($jsFile) : "aucun JS") . " et " . 
            ($cssFile ? basename($cssFile) : "aucun CSS");
            
    } catch (Exception $e) {
        $error = $e->getMessage();
    }
}

// Détecter l'environnement
$env = detectEnvironment();
?>

<!DOCTYPE html>
<html>
<head>
    <title>Correction des Assets - FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2 { color: #2c5282; }
        .container { background-color: #f7fafc; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: #2f855a; background-color: #c6f6d5; padding: 10px; border-radius: 4px; }
        .error { color: #c53030; background-color: #fed7d7; padding: 10px; border-radius: 4px; }
        pre { background-color: #edf2f7; padding: 15px; border-radius: 4px; overflow-x: auto; }
        button { background-color: #4299e1; color: white; border: none; padding: 12px 20px; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background-color: #3182ce; }
        .asset-list { margin-top: 20px; }
        .asset-item { background-color: #edf2f7; padding: 10px; margin-bottom: 5px; border-radius: 4px; }
        .asset-name { font-weight: bold; }
        .section { margin-bottom: 30px; }
        .env-info { background-color: #ebf4ff; padding: 10px; margin-bottom: 20px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Correction des Assets FormaCert</h1>
        
        <div class="env-info">
            <h3>Environnement</h3>
            <p>Hôte: <?php echo htmlspecialchars($env['host']); ?></p>
            <p>Type: <?php echo $env['isProduction'] ? 'Production' : 'Développement'; ?></p>
        </div>
        
        <?php if ($updated): ?>
            <div class="success">
                <p><?php echo htmlspecialchars($message); ?></p>
            </div>
        <?php endif; ?>
        
        <?php if ($error): ?>
            <div class="error">
                <p><?php echo htmlspecialchars($error); ?></p>
            </div>
        <?php endif; ?>
        
        <div class="section">
            <h2>1. Fichiers assets disponibles</h2>
            <div class="asset-list">
                <?php
                $jsFiles = glob('./assets/*.js');
                $cssFiles = glob('./assets/*.css');
                
                if (empty($jsFiles) && empty($cssFiles)): 
                ?>
                    <p class="error">Aucun fichier assets trouvé. Exécutez d'abord <code>npm run build</code>.</p>
                <?php else: ?>
                    <h3>Fichiers JavaScript:</h3>
                    <?php 
                    if (empty($jsFiles)) {
                        echo "<p>Aucun fichier JavaScript trouvé.</p>";
                    } else {
                        foreach ($jsFiles as $file) {
                            echo '<div class="asset-item">';
                            echo '<span class="asset-name">' . basename($file) . '</span> - ' . 
                                 round(filesize($file) / 1024, 2) . ' KB (modifié le ' . date('Y-m-d H:i', filemtime($file)) . ')';
                            echo '</div>';
                        }
                    }
                    ?>
                    
                    <h3>Fichiers CSS:</h3>
                    <?php 
                    if (empty($cssFiles)) {
                        echo "<p>Aucun fichier CSS trouvé.</p>";
                    } else {
                        foreach ($cssFiles as $file) {
                            echo '<div class="asset-item">';
                            echo '<span class="asset-name">' . basename($file) . '</span> - ' . 
                                 round(filesize($file) / 1024, 2) . ' KB (modifié le ' . date('Y-m-d H:i', filemtime($file)) . ')';
                            echo '</div>';
                        }
                    }
                    ?>
                <?php endif; ?>
            </div>
        </div>
        
        <div class="section">
            <h2>2. Mettre à jour index.html</h2>
            <?php if (file_exists('./index.html')): ?>
                <p>Le fichier index.html existe et a été modifié le <?php echo date('Y-m-d H:i', filemtime('./index.html')); ?>.</p>
                
                <form method="post" action="">
                    <input type="hidden" name="fix_assets" value="1">
                    <button type="submit">Mettre à jour index.html avec les derniers assets</button>
                </form>
            <?php else: ?>
                <p class="error">Le fichier index.html n'existe pas.</p>
            <?php endif; ?>
        </div>
        
        <div class="section">
            <h2>3. Instructions</h2>
            <ol>
                <li>Exécutez <code>npm run build</code> pour générer les fichiers assets</li>
                <li>Rafraîchissez cette page pour voir les fichiers générés</li>
                <li>Cliquez sur "Mettre à jour index.html" pour mettre à jour les références</li>
                <li>Testez l'application pour vérifier que tout fonctionne correctement</li>
            </ol>
        </div>
    </div>
</body>
</html>
