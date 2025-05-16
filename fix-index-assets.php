
<?php
header('Content-Type: text/html; charset=utf-8');

// Fonction pour trouver le dernier fichier JS/CSS avec un hachage
function findLatestAsset($directory, $prefix, $extension) {
    $pattern = $directory . '/' . $prefix . '*.' . $extension;
    $files = glob($pattern);
    
    if (empty($files)) {
        return null;
    }
    
    // Trier par date de modification (le plus récent en premier)
    usort($files, function($a, $b) {
        return filemtime($b) - filemtime($a);
    });
    
    return '/assets/' . basename($files[0]);
}

// Chemins possibles pour les assets
$possible_paths = [
    './assets',
    '/assets',
    $_SERVER['DOCUMENT_ROOT'] . '/assets',
    $_SERVER['DOCUMENT_ROOT'] . '/sites/qualiopi.ch/assets'
];

$main_js = null;
$main_css = null;

// Chercher les fichiers dans les différents chemins possibles
foreach ($possible_paths as $path) {
    if (is_dir($path)) {
        if (!$main_js) {
            $main_js = findLatestAsset($path, 'main-', 'js');
        }
        if (!$main_css) {
            $main_css = findLatestAsset($path, 'index-', 'css');
        }
        if ($main_js && $main_css) {
            break;
        }
    }
}

$indexPath = './index.html';
$success = false;
$message = '';

if (file_exists($indexPath)) {
    $content = file_get_contents($indexPath);
    $original = $content;
    
    if ($main_js || $main_css) {
        // Créer une sauvegarde
        copy($indexPath, $indexPath . '.bak');
        
        if ($main_js) {
            // Remplacer ou ajouter le JS
            if (preg_match('/<script[^>]*src="[^"]*"[^>]*type="module"[^>]*>/', $content)) {
                $content = preg_replace(
                    '/<script[^>]*src="[^"]*"[^>]*type="module"[^>]*>/',
                    '<script type="module" src="' . $main_js . '">',
                    $content
                );
            } else {
                $content = str_replace(
                    '</body>',
                    '    <script type="module" src="' . $main_js . '"></script>' . "\n  </body>",
                    $content
                );
            }
            
            $message .= "Fichier JS trouvé et inséré: " . htmlspecialchars($main_js) . "<br>";
        }
        
        if ($main_css) {
            // Remplacer ou ajouter le CSS
            if (preg_match('/<link[^>]*rel="stylesheet"[^>]*href="[^"]*"[^>]*>/', $content)) {
                $content = preg_replace(
                    '/<link[^>]*rel="stylesheet"[^>]*href="[^"]*"[^>]*>/',
                    '<link rel="stylesheet" href="' . $main_css . '">',
                    $content
                );
            } else {
                $content = str_replace(
                    '</head>',
                    '    <link rel="stylesheet" href="' . $main_css . '">' . "\n  </head>",
                    $content
                );
            }
            
            $message .= "Fichier CSS trouvé et inséré: " . htmlspecialchars($main_css) . "<br>";
        }
        
        // Enregistrer si des modifications ont été faites
        if ($content !== $original) {
            file_put_contents($indexPath, $content);
            $success = true;
            $message .= "Les modifications ont été appliquées à index.html<br>";
        } else {
            $message = "Aucune modification nécessaire dans index.html<br>";
        }
    } else {
        $message = "Aucun fichier JS/CSS principal trouvé dans les dossiers assets<br>";
    }
} else {
    $message = "Fichier index.html non trouvé<br>";
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des assets dans index.html</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; }
        .error { color: red; }
        .box { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Correction des références aux assets dans index.html</h1>
    
    <div class="box">
        <h2>Résultat</h2>
        <p class="<?php echo $success ? 'success' : 'error'; ?>">
            <?php echo $message; ?>
        </p>
    </div>
    
    <?php if ($success): ?>
    <div class="box">
        <h2>Nouveau contenu de index.html</h2>
        <pre><?php echo htmlspecialchars($content); ?></pre>
    </div>
    <?php endif; ?>
    
    <div class="box">
        <h2>Chemins des assets vérifiés</h2>
        <ul>
        <?php foreach($possible_paths as $path): ?>
            <li>
                <?php echo htmlspecialchars($path); ?>: 
                <?php echo is_dir($path) ? '<span class="success">Existe</span>' : '<span class="error">N\'existe pas</span>'; ?>
            </li>
        <?php endforeach; ?>
        </ul>
    </div>
    
    <div class="box">
        <p><a href="index.html">Retour à l'accueil</a></p>
    </div>
</body>
</html>
