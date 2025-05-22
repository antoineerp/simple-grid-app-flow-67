
<?php
header('Content-Type: text/html; charset=utf-8');

// Fonction pour trouver le dernier fichier avec un motif donné
function findLatestFile($directory, $pattern) {
    $files = glob("$directory/$pattern");
    if (empty($files)) {
        return null;
    }
    
    // Trier par date de modification (le plus récent d'abord)
    usort($files, function($a, $b) {
        return filemtime($b) - filemtime($a);
    });
    
    return $files[0];
}

// Fonction pour analyser index.html
function analyzeIndex() {
    if (!file_exists('./index.html')) {
        return ['success' => false, 'message' => 'Fichier index.html non trouvé'];
    }
    
    $content = file_get_contents('./index.html');
    
    // Vérifier si les références existent
    $hasJsRef = preg_match('/<script[^>]*src="[^"]*\/assets\/[^"]*\.js"[^>]*>/', $content);
    $hasCssRef = preg_match('/<link[^>]*href="[^"]*\/assets\/[^"]*\.css"[^>]*>/', $content);
    $hasSrcRef = preg_match('/<script[^>]*src="[^"]*\/src\/main\.tsx"[^>]*>/', $content);
    
    return [
        'content' => $content,
        'hasJsRef' => $hasJsRef,
        'hasCssRef' => $hasCssRef,
        'hasSrcRef' => $hasSrcRef
    ];
}

// Fonction pour mettre à jour index.html
function updateIndexHtml() {
    $analysis = analyzeIndex();
    
    if (!isset($analysis['content'])) {
        return $analysis; // Erreur déjà définie
    }
    
    $content = $analysis['content'];
    $original = $content;
    $changes = [];
    
    // Trouver les derniers fichiers JS et CSS
    $latestJs = null;
    $latestCss = null;
    
    // Chercher d'abord dans le dossier dist/assets
    if (is_dir('./dist/assets')) {
        $latestJs = findLatestFile('./dist/assets', '*.js');
        $latestCss = findLatestFile('./dist/assets', '*.css');
        
        if ($latestJs) $latestJs = basename($latestJs);
        if ($latestCss) $latestCss = basename($latestCss);
    }
    
    // Chercher ensuite dans le dossier assets si rien n'a été trouvé
    if ((!$latestJs || !$latestCss) && is_dir('./assets')) {
        if (!$latestJs) {
            $js = findLatestFile('./assets', '*.js');
            if ($js) $latestJs = basename($js);
        }
        if (!$latestCss) {
            $css = findLatestFile('./assets', '*.css');
            if ($css) $latestCss = basename($css);
        }
    }
    
    // Vérifier si nous avons trouvé des fichiers
    if (!$latestJs && !$latestCss) {
        return ['success' => false, 'message' => 'Aucun fichier JS ou CSS trouvé dans les dossiers assets ou dist/assets'];
    }
    
    // Mettre à jour ou ajouter la référence JS
    if ($latestJs) {
        if ($analysis['hasSrcRef']) {
            // Remplacer la référence src/main.tsx
            $content = preg_replace(
                '/<script[^>]*src="[^"]*\/src\/main\.tsx"[^>]*>/',
                '<script type="module" src="/assets/' . $latestJs . '">',
                $content
            );
            $changes[] = "Référence src/main.tsx remplacée par /assets/$latestJs";
        } else if ($analysis['hasJsRef']) {
            // Mettre à jour la référence JS existante
            $content = preg_replace(
                '/<script[^>]*src="[^"]*\/assets\/[^"]*\.js"[^>]*>/',
                '<script type="module" src="/assets/' . $latestJs . '">',
                $content
            );
            $changes[] = "Référence JS mise à jour vers /assets/$latestJs";
        } else {
            // Ajouter la référence si elle n'existe pas
            $content = str_replace(
                '</body>',
                '  <script type="module" src="/assets/' . $latestJs . '"></script>' . "\n" . '</body>',
                $content
            );
            $changes[] = "Référence JS ajoutée: /assets/$latestJs";
        }
    }
    
    // Mettre à jour ou ajouter la référence CSS
    if ($latestCss) {
        if ($analysis['hasCssRef']) {
            // Mettre à jour la référence CSS existante
            $content = preg_replace(
                '/<link[^>]*href="[^"]*\/assets\/[^"]*\.css"[^>]*>/',
                '<link rel="stylesheet" href="/assets/' . $latestCss . '">',
                $content
            );
            $changes[] = "Référence CSS mise à jour vers /assets/$latestCss";
        } else {
            // Ajouter la référence si elle n'existe pas
            $content = str_replace(
                '</head>',
                '  <link rel="stylesheet" href="/assets/' . $latestCss . '">' . "\n" . '</head>',
                $content
            );
            $changes[] = "Référence CSS ajoutée: /assets/$latestCss";
        }
    }
    
    // Enregistrer les modifications si nécessaire
    if ($content !== $original) {
        // Créer une sauvegarde
        copy('./index.html', './index.html.bak');
        
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

// Vérifier si un dossier assets existe, sinon le créer
function checkAssetsFolder() {
    if (!is_dir('./assets')) {
        if (is_dir('./dist/assets')) {
            // Créer le dossier assets
            if (mkdir('./assets', 0755)) {
                // Copier les fichiers de dist/assets vers assets
                $files = glob('./dist/assets/*');
                $copied = 0;
                
                foreach ($files as $file) {
                    $filename = basename($file);
                    if (copy($file, './assets/' . $filename)) {
                        $copied++;
                    }
                }
                
                return [
                    'success' => true,
                    'message' => "Dossier assets créé et $copied fichiers copiés depuis dist/assets"
                ];
            }
            return ['success' => false, 'message' => 'Impossible de créer le dossier assets'];
        }
        return ['success' => false, 'message' => 'Aucun dossier assets ou dist/assets trouvé'];
    }
    
    return ['success' => true, 'message' => 'Le dossier assets existe déjà'];
}

// Fonction principale
function main() {
    $results = [];
    
    // Étape 1: Vérifier le dossier assets
    $results['assets'] = checkAssetsFolder();
    
    // Étape 2: Mettre à jour index.html
    $results['index'] = updateIndexHtml();
    
    return $results;
}

// Exécuter le script
$results = main();
?>

<!DOCTYPE html>
<html>
<head>
    <title>Correction des références d'assets</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .section { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Correction des références d'assets dans index.html</h1>
    
    <div class="section">
        <h2>Vérification du dossier assets</h2>
        <p>
            <?php 
            if ($results['assets']['success']) {
                echo '<span class="success">✓</span> ' . htmlspecialchars($results['assets']['message']);
            } else {
                echo '<span class="error">✗</span> ' . htmlspecialchars($results['assets']['message']);
            }
            ?>
        </p>
    </div>
    
    <div class="section">
        <h2>Mise à jour de index.html</h2>
        <p>
            <?php 
            if ($results['index']['success']) {
                echo '<span class="success">✓</span> ' . htmlspecialchars($results['index']['message']);
            } else {
                echo '<span class="error">✗</span> ' . htmlspecialchars($results['index']['message']);
            }
            ?>
        </p>
        
        <?php if (!empty($results['index']['changes'])): ?>
            <h3>Modifications effectuées:</h3>
            <ul>
                <?php foreach ($results['index']['changes'] as $change): ?>
                    <li><?php echo htmlspecialchars($change); ?></li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>Fichiers disponibles</h2>
        
        <h3>Dans le dossier dist/assets:</h3>
        <pre><?php echo is_dir('./dist/assets') ? htmlspecialchars(implode("\n", glob('./dist/assets/*'))) : 'Dossier non trouvé'; ?></pre>
        
        <h3>Dans le dossier assets:</h3>
        <pre><?php echo is_dir('./assets') ? htmlspecialchars(implode("\n", glob('./assets/*'))) : 'Dossier non trouvé'; ?></pre>
    </div>
    
    <p><a href="/">Retour à l'application</a></p>
</body>
</html>
