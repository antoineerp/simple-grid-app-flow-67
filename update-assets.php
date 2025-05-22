
<?php
header('Content-Type: text/html; charset=utf-8');

function findLatestAsset($directory, $pattern) {
    $files = glob("$directory/$pattern");
    if (empty($files)) {
        return null;
    }
    usort($files, function($a, $b) {
        return filemtime($b) - filemtime($a);
    });
    return str_replace('./', '/', $files[0]);
}

function updateIndexHtml() {
    if (!file_exists('./index.html')) {
        return ['success' => false, 'message' => 'index.html non trouvé'];
    }

    // Faire une sauvegarde
    copy('./index.html', './index.html.bak');
    
    $content = file_get_contents('./index.html');
    $original = $content;
    
    // Trouver les derniers fichiers JS et CSS
    $latestJs = null;
    $latestCss = null;
    
    // Vérifier d'abord dans le dossier dist/assets
    if (is_dir('./dist/assets')) {
        $latestJs = findLatestAsset('./dist/assets', '*.js');
        $latestCss = findLatestAsset('./dist/assets', '*.css');
        
        // Si trouvé dans dist/assets, ajuster les chemins
        if ($latestJs) {
            $latestJs = str_replace('/dist/assets/', '/assets/', $latestJs);
        }
        if ($latestCss) {
            $latestCss = str_replace('/dist/assets/', '/assets/', $latestCss);
        }
    }
    
    // Vérifier ensuite dans le dossier assets si rien n'a été trouvé
    if (!$latestJs && is_dir('./assets')) {
        $latestJs = findLatestAsset('./assets', '*.js');
    }
    if (!$latestCss && is_dir('./assets')) {
        $latestCss = findLatestAsset('./assets', '*.css');
    }
    
    // Afficher les fichiers détectés
    echo "Fichier JS détecté: " . ($latestJs ?? "Aucun") . "<br>";
    echo "Fichier CSS détecté: " . ($latestCss ?? "Aucun") . "<br>";
    
    $changes = [];
    
    if ($latestJs) {
        // Mettre à jour ou ajouter la référence JS
        if (preg_match('/<script[^>]*src="[^"]*\/src\/main\.tsx"[^>]*>/', $content)) {
            $content = preg_replace(
                '/<script[^>]*src="[^"]*\/src\/main\.tsx"[^>]*>/',
                '<script type="module" src="' . $latestJs . '">',
                $content
            );
            $changes[] = "Référence src/main.tsx remplacée par $latestJs";
        } else if (preg_match('/<script[^>]*src="[^"]*\/assets\/main[^"]*\.js"[^>]*>/', $content)) {
            $content = preg_replace(
                '/<script[^>]*src="[^"]*\/assets\/main[^"]*\.js"[^>]*>/',
                '<script type="module" src="' . $latestJs . '">',
                $content
            );
            $changes[] = "Référence JS mise à jour vers $latestJs";
        } else {
            // Ajouter la référence si elle n'existe pas
            $content = str_replace(
                '</body>',
                '  <script type="module" src="' . $latestJs . '"></script>' . "\n  " . '</body>',
                $content
            );
            $changes[] = "Référence JS ajoutée: $latestJs";
        }
    }
    
    if ($latestCss) {
        // Mettre à jour ou ajouter la référence CSS
        if (preg_match('/<link[^>]*href="[^"]*\.css"[^>]*>/', $content)) {
            $content = preg_replace(
                '/<link[^>]*href="[^"]*\.css"[^>]*>/',
                '<link rel="stylesheet" href="' . $latestCss . '">',
                $content
            );
            $changes[] = "Référence CSS mise à jour vers $latestCss";
        } else {
            // Ajouter la référence si elle n'existe pas
            $content = str_replace(
                '</head>',
                '  <link rel="stylesheet" href="' . $latestCss . '">' . "\n  " . '</head>',
                $content
            );
            $changes[] = "Référence CSS ajoutée: $latestCss";
        }
    }
    
    if ($content !== $original) {
        if (file_put_contents('./index.html', $content)) {
            return [
                'success' => true, 
                'message' => 'index.html mis à jour avec succès', 
                'changes' => $changes
            ];
        }
        return ['success' => false, 'message' => 'Échec lors de la mise à jour du fichier'];
    }
    
    return ['success' => true, 'message' => 'Aucune modification nécessaire', 'changes' => []];
}

// Exécuter et afficher les résultats
$result = updateIndexHtml();

$success = $result['success'] ? '<span style="color:green;font-weight:bold;">Succès</span>' : '<span style="color:red;font-weight:bold;">Échec</span>';
?>
<!DOCTYPE html>
<html>
<head>
    <title>Mise à jour des références d'assets</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .changes { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .button { background: #4CAF50; color: white; border: none; padding: 8px 16px; cursor: pointer; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 10px; }
        .button:hover { background: #45a049; }
    </style>
</head>
<body>
    <h1>Mise à jour des références d'assets</h1>
    
    <h2>Résultat: <?php echo $success; ?></h2>
    <p><?php echo htmlspecialchars($result['message']); ?></p>
    
    <?php if (!empty($result['changes'])): ?>
        <div class="changes">
            <h3>Modifications effectuées:</h3>
            <ul>
                <?php foreach ($result['changes'] as $change): ?>
                    <li><?php echo htmlspecialchars($change); ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>
    
    <h2>Structure des fichiers détectés</h2>
    <div class="changes">
        <h3>Dossier dist/assets:</h3>
        <pre><?php echo is_dir('./dist/assets') ? htmlspecialchars(implode("\n", glob('./dist/assets/*'))) : 'Dossier non trouvé'; ?></pre>
        
        <h3>Dossier assets:</h3>
        <pre><?php echo is_dir('./assets') ? htmlspecialchars(implode("\n", glob('./assets/*'))) : 'Dossier non trouvé'; ?></pre>
    </div>
    
    <h2>Prochaines étapes</h2>
    <ol>
        <li>Après avoir exécuté <code>npm run build</code>, utilisez ce script pour mettre à jour automatiquement index.html</li>
        <li>Vérifiez que l'application fonctionne correctement avec les nouvelles références</li>
        <li>Si besoin, restaurez la sauvegarde (index.html.bak) en cas de problème</li>
    </ol>
    
    <a href="/" class="button">Retour à l'application</a>
</body>
</html>
