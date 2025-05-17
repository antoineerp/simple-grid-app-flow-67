
<?php
/**
 * Script simplifié pour vérifier et corriger les références aux fichiers CSS et JS dans index.html
 */
header('Content-Type: text/html; charset=utf-8');

$success_messages = [];
$error_messages = [];

try {
    // Vérifier si index.html existe
    if (!file_exists('index.html')) {
        throw new Exception('Le fichier index.html est introuvable');
    }
    
    // Lire le contenu de index.html
    $html = file_get_contents('index.html');
    if ($html === false) {
        throw new Exception('Impossible de lire le fichier index.html');
    }
    
    // Vérifier le dossier assets
    if (!is_dir('assets')) {
        if (!mkdir('assets', 0755, true)) {
            throw new Exception('Impossible de créer le dossier assets');
        }
        $success_messages[] = 'Dossier assets créé';
    }
    
    // Variables pour suivre les modifications
    $modified = false;
    
    // Vérifier et ajouter la référence à main.css
    if (strpos($html, 'href="/assets/main.css"') === false && strpos($html, "href='/assets/main.css'") === false) {
        $html = str_replace('</head>', '  <link rel="stylesheet" href="/assets/main.css">' . "\n</head>", $html);
        $modified = true;
        $success_messages[] = 'Référence à main.css ajoutée';
        
        // Créer main.css s'il n'existe pas
        if (!file_exists('assets/main.css')) {
            $main_css = "/* CSS principal généré automatiquement */\nbody { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }\n";
            file_put_contents('assets/main.css', $main_css);
            $success_messages[] = 'Fichier main.css créé';
        }
    }
    
    // Vérifier et ajouter la référence à index.js
    if (strpos($html, 'src="/assets/index.js"') === false && strpos($html, "src='/assets/index.js'") === false) {
        $html = str_replace('</body>', '  <script src="/assets/index.js"></script>' . "\n</body>", $html);
        $modified = true;
        $success_messages[] = 'Référence à index.js ajoutée';
        
        // Créer index.js s'il n'existe pas
        if (!file_exists('assets/index.js')) {
            $index_js = "// Script principal généré automatiquement\nconsole.log('Application chargée');\n";
            file_put_contents('assets/index.js', $index_js);
            $success_messages[] = 'Fichier index.js créé';
        }
    }
    
    // Sauvegarder les modifications
    if ($modified) {
        if (file_put_contents('index.html', $html) !== false) {
            $success_messages[] = 'index.html mis à jour avec succès';
        } else {
            $error_messages[] = 'Impossible d\'écrire dans index.html';
        }
    }
    
    // Copier les fichiers CSS et JS hachés vers des versions non-hachées
    $assets_files = scandir('assets');
    foreach ($assets_files as $file) {
        if (preg_match('/^(index|main)\.([a-zA-Z0-9]+)\.(js|css)$/', $file, $matches)) {
            $base_name = $matches[1] . '.' . $matches[3];
            if (!file_exists('assets/' . $base_name)) {
                copy('assets/' . $file, 'assets/' . $base_name);
                $success_messages[] = "Copie de $file vers $base_name";
            }
        }
    }
    
} catch (Exception $e) {
    $error_messages[] = 'Erreur: ' . $e->getMessage();
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des références CSS/JS</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 3px solid green; margin-bottom: 10px; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 3px solid red; margin-bottom: 10px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Correction des références CSS/JS</h1>
        
        <?php if (!empty($success_messages)): ?>
            <h2>Actions réussies:</h2>
            <?php foreach ($success_messages as $message): ?>
                <div class="success"><?php echo htmlspecialchars($message); ?></div>
            <?php endforeach; ?>
        <?php endif; ?>
        
        <?php if (!empty($error_messages)): ?>
            <h2>Erreurs:</h2>
            <?php foreach ($error_messages as $message): ?>
                <div class="error"><?php echo htmlspecialchars($message); ?></div>
            <?php endforeach; ?>
        <?php endif; ?>
        
        <?php if (empty($success_messages) && empty($error_messages)): ?>
            <div class="success">Aucune correction nécessaire. Les références CSS/JS sont déjà correctes.</div>
        <?php endif; ?>
        
        <h2>Contenu du dossier assets:</h2>
        <pre><?php 
        if (is_dir('assets')) {
            echo implode("\n", scandir('assets'));
        } else {
            echo "Le dossier assets/ n'existe pas.";
        }
        ?></pre>
        
        <p><a href="/">Retour à la page d'accueil</a> | <a href="check-build-status.php">Vérifier l'état du build</a> | <a href="pre-deploy-fix.php">Préparation au déploiement</a></p>
    </div>
</body>
</html>
