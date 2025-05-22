
<?php
header('Content-Type: text/html; charset=utf-8');

function checkCssFiles() {
    $results = [
        'status' => 'unknown',
        'messages' => [],
        'dist_css_files' => [],
        'assets_css_files' => []
    ];
    
    // Vérifier les fichiers CSS dans dist/assets
    if (is_dir('./dist/assets')) {
        $css_files = glob('./dist/assets/*.css');
        $results['dist_css_files'] = array_map('basename', $css_files);
        $results['messages'][] = count($css_files) > 0 
            ? "Trouvé " . count($css_files) . " fichier(s) CSS dans dist/assets"
            : "Aucun fichier CSS trouvé dans dist/assets";
            
        if (count($css_files) == 0) {
            $results['status'] = 'error';
        }
    } else {
        $results['messages'][] = "Le dossier dist/assets n'existe pas. Avez-vous exécuté 'npm run build' ?";
        $results['status'] = 'error';
    }
    
    // Vérifier les fichiers CSS dans le dossier assets
    if (is_dir('./assets')) {
        $css_files = glob('./assets/*.css');
        $results['assets_css_files'] = array_map('basename', $css_files);
        $results['messages'][] = count($css_files) > 0 
            ? "Trouvé " . count($css_files) . " fichier(s) CSS dans le dossier assets"
            : "Aucun fichier CSS trouvé dans le dossier assets";
    } else {
        $results['messages'][] = "Le dossier assets à la racine n'existe pas";
    }
    
    // Vérifier les imports CSS dans index.html
    if (file_exists('./index.html')) {
        $content = file_get_contents('./index.html');
        if (preg_match('/<link[^>]*href="[^"]*\.css"[^>]*>/', $content)) {
            $results['messages'][] = "Des références CSS ont été trouvées dans index.html";
        } else {
            $results['messages'][] = "Aucune référence CSS n'a été trouvée dans index.html";
        }
    }
    
    // Vérifier les imports dans main.tsx
    if (file_exists('./src/main.tsx')) {
        $content = file_get_contents('./src/main.tsx');
        if (strpos($content, "import './index.css'") !== false) {
            $results['messages'][] = "L'import de CSS est présent dans main.tsx";
        } else {
            $results['messages'][] = "Aucun import CSS trouvé dans main.tsx";
            $results['status'] = 'error';
        }
    }
    
    // Définir le statut global si ce n'est pas déjà fait
    if ($results['status'] === 'unknown') {
        $results['status'] = count($results['dist_css_files']) > 0 ? 'success' : 'warning';
    }
    
    return $results;
}

function copyFiles($source, $destination) {
    if (!file_exists($destination)) {
        mkdir($destination, 0755, true);
    }
    
    $copied = 0;
    foreach (glob($source) as $file) {
        $dest = $destination . '/' . basename($file);
        if (copy($file, $dest)) {
            $copied++;
        }
    }
    
    return $copied;
}

$check_results = checkCssFiles();

// Traiter la demande de synchronisation si nécessaire
$sync_results = ['done' => false, 'messages' => []];
if (isset($_POST['action']) && $_POST['action'] === 'sync') {
    if (is_dir('./dist/assets') && count($check_results['dist_css_files']) > 0) {
        if (!is_dir('./assets')) {
            mkdir('./assets', 0755, true);
            $sync_results['messages'][] = "Dossier assets créé à la racine";
        }
        
        $copied = copyFiles('./dist/assets/*.css', './assets');
        $sync_results['messages'][] = "Copié $copied fichier(s) CSS vers le dossier assets";
        
        $copied = copyFiles('./dist/assets/*.js', './assets');
        $sync_results['messages'][] = "Copié $copied fichier(s) JS vers le dossier assets";
        
        $sync_results['done'] = true;
    } else {
        $sync_results['messages'][] = "Impossible de synchroniser - aucun fichier CSS trouvé dans dist/assets";
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des fichiers CSS</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
        button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        button:hover { background: #45a049; }
    </style>
</head>
<body>
    <h1>Vérification des fichiers CSS</h1>
    
    <div class="section">
        <h2>Résultats de la vérification</h2>
        <p>Statut: 
            <?php if ($check_results['status'] === 'success'): ?>
                <span class="success">OK - Des fichiers CSS ont été trouvés</span>
            <?php elseif ($check_results['status'] === 'warning'): ?>
                <span class="warning">ATTENTION - Situation inhabituelle</span>
            <?php else: ?>
                <span class="error">ERREUR - Problème détecté</span>
            <?php endif; ?>
        </p>
        
        <h3>Messages:</h3>
        <ul>
            <?php foreach ($check_results['messages'] as $message): ?>
                <li><?php echo htmlspecialchars($message); ?></li>
            <?php endforeach; ?>
        </ul>
        
        <?php if (!empty($check_results['dist_css_files'])): ?>
            <h3>Fichiers CSS dans dist/assets:</h3>
            <ul>
                <?php foreach ($check_results['dist_css_files'] as $file): ?>
                    <li><?php echo htmlspecialchars($file); ?></li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
        
        <?php if (!empty($check_results['assets_css_files'])): ?>
            <h3>Fichiers CSS dans assets:</h3>
            <ul>
                <?php foreach ($check_results['assets_css_files'] as $file): ?>
                    <li><?php echo htmlspecialchars($file); ?></li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </div>
    
    <?php if ($sync_results['done']): ?>
        <div class="section">
            <h2>Résultat de la synchronisation</h2>
            <ul>
                <?php foreach ($sync_results['messages'] as $message): ?>
                    <li><?php echo htmlspecialchars($message); ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php else: ?>
        <div class="section">
            <h2>Recommandations</h2>
            <?php if ($check_results['status'] === 'error'): ?>
                <p>Problèmes potentiels:</p>
                <ol>
                    <li>Le CSS pourrait être intégré dans les fichiers JS au lieu d'être extrait dans des fichiers séparés</li>
                    <li>Les imports CSS ne sont peut-être pas correctement configurés</li>
                    <li>La configuration de Vite pourrait ne pas être optimisée pour l'extraction CSS</li>
                </ol>
                
                <p>Solutions recommandées:</p>
                <ol>
                    <li>Vérifiez que vous importez bien <code>index.css</code> dans <code>main.tsx</code></li>
                    <li>Exécutez <code>npm run build</code> après avoir mis à jour la configuration de Vite</li>
                    <li>Vérifiez que le CSS est bien extrait dans des fichiers séparés</li>
                </ol>
            <?php elseif (!empty($check_results['dist_css_files']) && empty($check_results['assets_css_files'])): ?>
                <p>Des fichiers CSS ont été trouvés dans <code>dist/assets</code> mais pas dans le dossier <code>assets</code> à la racine.</p>
                <form method="post">
                    <input type="hidden" name="action" value="sync">
                    <button type="submit">Synchroniser les fichiers vers assets</button>
                </form>
            <?php else: ?>
                <p>Tout semble en ordre. Si vous rencontrez des problèmes d'affichage:</p>
                <ol>
                    <li>Assurez-vous que <code>index.html</code> contient les références vers les fichiers CSS</li>
                    <li>Utilisez le script <code>fix-index-html.php</code> pour vérifier et corriger les références</li>
                </ol>
            <?php endif; ?>
        </div>
    <?php endif; ?>
    
    <p><a href="/">Retour à l'application</a> | <a href="fix-index-html.php">Exécuter fix-index-html.php</a></p>
</body>
</html>
