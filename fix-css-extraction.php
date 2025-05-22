
<?php
header('Content-Type: text/html; charset=utf-8');

// Fonction pour créer un répertoire assets à la racine
function createAssetsDirectory() {
    if (!file_exists('./assets') && !mkdir('./assets', 0755, true)) {
        return ['success' => false, 'message' => 'Impossible de créer le répertoire assets'];
    }
    return ['success' => true, 'message' => 'Répertoire assets créé avec succès'];
}

// Fonction pour copier les assets de dist/assets vers assets
function copyDistAssets() {
    if (!file_exists('./dist/assets')) {
        return ['success' => false, 'message' => 'Le répertoire dist/assets n\'existe pas'];
    }
    
    if (!file_exists('./assets')) {
        mkdir('./assets', 0755, true);
    }
    
    $copied = 0;
    foreach (glob('./dist/assets/*') as $file) {
        $filename = basename($file);
        if (copy($file, './assets/' . $filename)) {
            $copied++;
        }
    }
    
    return [
        'success' => $copied > 0, 
        'message' => "Copié $copied fichiers depuis dist/assets vers assets"
    ];
}

// Fonction pour créer un CSS minimal par défaut
function createDefaultCss() {
    if (!file_exists('./assets')) {
        mkdir('./assets', 0755, true);
    }
    
    $default_css = <<<EOT
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Styles globaux */
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f9fafb;
  color: #1f2937;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1rem;
}

/* Utilitaires */
.text-center {
  text-align: center;
}
EOT;
    
    if (file_put_contents('./assets/index.css', $default_css)) {
        return ['success' => true, 'message' => 'Fichier CSS par défaut créé avec succès'];
    }
    
    return ['success' => false, 'message' => 'Impossible de créer le fichier CSS par défaut'];
}

// Fonction pour mettre à jour index.html avec les références CSS
function updateIndexHtml() {
    if (!file_exists('./index.html')) {
        return ['success' => false, 'message' => 'Le fichier index.html n\'existe pas'];
    }
    
    $content = file_get_contents('./index.html');
    $original = $content;
    
    // Vérifier si une référence CSS existe déjà
    if (strpos($content, '<link rel="stylesheet" href="/assets/index.css">') === false) {
        // Ajouter la référence CSS avant la fermeture de head
        $content = str_replace('</head>', '    <link rel="stylesheet" href="/assets/index.css">' . "\n  " . '</head>', $content);
    }
    
    if ($content !== $original) {
        if (file_put_contents('./index.html', $content)) {
            return ['success' => true, 'message' => 'Références CSS ajoutées à index.html'];
        }
        return ['success' => false, 'message' => 'Impossible de mettre à jour index.html'];
    }
    
    return ['success' => true, 'message' => 'Aucune modification nécessaire pour index.html'];
}

// Exécuter les actions
$results = [
    'assets_dir' => createAssetsDirectory(),
    'copy_assets' => file_exists('./dist/assets') ? copyDistAssets() : ['success' => false, 'message' => 'Le répertoire dist/assets n\'existe pas'],
    'default_css' => !file_exists('./assets/index.css') ? createDefaultCss() : ['success' => true, 'message' => 'Un fichier CSS existe déjà'],
    'update_html' => updateIndexHtml()
];

// Vérifier si le CSS est importé dans main.tsx
$main_tsx_status = ['success' => false, 'message' => 'Impossible de vérifier main.tsx'];
if (file_exists('./src/main.tsx')) {
    $main_content = file_get_contents('./src/main.tsx');
    $main_tsx_status = [
        'success' => strpos($main_content, "import './index.css'") !== false,
        'message' => strpos($main_content, "import './index.css'") !== false 
            ? 'L\'import CSS est correctement configuré dans main.tsx' 
            : 'L\'import CSS est manquant dans main.tsx'
    ];
}
$results['main_tsx'] = $main_tsx_status;
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction de l'extraction CSS</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .button { display: inline-block; padding: 8px 16px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Correction de l'extraction CSS</h1>
    
    <div class="section">
        <h2>Résultats des actions</h2>
        
        <h3>1. Création du répertoire assets</h3>
        <p class="<?php echo $results['assets_dir']['success'] ? 'success' : 'error'; ?>">
            <?php echo htmlspecialchars($results['assets_dir']['message']); ?>
        </p>
        
        <h3>2. Copie des fichiers depuis dist/assets</h3>
        <p class="<?php echo $results['copy_assets']['success'] ? 'success' : 'warning'; ?>">
            <?php echo htmlspecialchars($results['copy_assets']['message']); ?>
        </p>
        
        <h3>3. Création d'un CSS par défaut</h3>
        <p class="<?php echo $results['default_css']['success'] ? 'success' : 'error'; ?>">
            <?php echo htmlspecialchars($results['default_css']['message']); ?>
        </p>
        
        <h3>4. Mise à jour de index.html</h3>
        <p class="<?php echo $results['update_html']['success'] ? 'success' : 'error'; ?>">
            <?php echo htmlspecialchars($results['update_html']['message']); ?>
        </p>
        
        <h3>5. Vérification de l'import CSS dans main.tsx</h3>
        <p class="<?php echo $results['main_tsx']['success'] ? 'success' : 'error'; ?>">
            <?php echo htmlspecialchars($results['main_tsx']['message']); ?>
        </p>
    </div>
    
    <div class="section">
        <h2>Structure des fichiers actuels</h2>
        
        <h3>Dossier assets:</h3>
        <pre><?php echo file_exists('./assets') ? htmlspecialchars(implode("\n", glob('./assets/*'))) : 'Le dossier assets n\'existe pas'; ?></pre>
        
        <h3>Fichier CSS:</h3>
        <?php if (file_exists('./assets/index.css')): ?>
            <p class="success">Le fichier CSS existe (<?php echo filesize('./assets/index.css'); ?> octets)</p>
        <?php else: ?>
            <p class="error">Le fichier CSS n'existe pas</p>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>Prochaines étapes</h2>
        <ol>
            <li>Exécutez <code>npm run build</code> localement pour générer les fichiers de build</li>
            <li>Transférez les fichiers vers votre serveur, notamment le dossier <code>dist</code></li>
            <li>Accédez à <code>check-css-build.php</code> pour vérifier que les fichiers CSS sont correctement extraits</li>
            <li>Si nécessaire, utilisez <code>fix-index-html.php</code> pour corriger les références dans index.html</li>
        </ol>
        
        <p>Si vous ne pouvez pas exécuter <code>npm run build</code>, ce script a créé un CSS minimal par défaut qui devrait permettre à votre application de s'afficher correctement.</p>
    </div>
    
    <a href="/" class="button">Retour à l'application</a>
</body>
</html>
