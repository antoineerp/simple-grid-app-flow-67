
<?php
header('Content-Type: text/html; charset=utf-8');

// Fonction pour trouver les fichiers hachés
function findHashedFiles($directory = './assets') {
    $result = [
        'js' => [],
        'css' => []
    ];
    
    // Vérifier si le répertoire existe
    if (!is_dir($directory)) {
        return $result;
    }
    
    // Rechercher les fichiers JavaScript hachés
    $js_files = glob($directory . '/*.js');
    foreach ($js_files as $file) {
        $filename = basename($file);
        // Détection de hachage par présence d'un pattern comme 'XXXX.js' ou '.XXXX.js'
        if (preg_match('/\.[A-Za-z0-9]{8,}\.js$/', $filename) || 
            preg_match('/[A-Za-z0-9]{8,}\.js$/', $filename)) {
            $result['js'][] = $filename;
        }
    }
    
    // Rechercher les fichiers CSS hachés
    $css_files = glob($directory . '/*.css');
    foreach ($css_files as $file) {
        $filename = basename($file);
        if (preg_match('/\.[A-Za-z0-9]{8,}\.css$/', $filename) || 
            preg_match('/[A-Za-z0-9]{8,}\.css$/', $filename)) {
            $result['css'][] = $filename;
        }
    }
    
    return $result;
}

// Fonction pour vérifier si un fichier est référencé dans index.html
function isFileReferenced($content, $filename) {
    return strpos($content, $filename) !== false;
}

// Fonction pour trouver le fichier principal (main ou index)
function findMainFiles($hashedFiles) {
    $main_js = null;
    $main_css = null;
    
    // Chercher le fichier JavaScript principal
    foreach ($hashedFiles['js'] as $file) {
        if (strpos($file, 'main.') === 0) {
            $main_js = $file;
            break;
        } else if (strpos($file, 'index.') === 0) {
            $main_js = $file;
        }
    }
    
    // Chercher le fichier CSS principal
    foreach ($hashedFiles['css'] as $file) {
        if (strpos($file, 'main.') === 0) {
            $main_css = $file;
            break;
        } else if (strpos($file, 'index.') === 0) {
            $main_css = $file;
        }
    }
    
    return [$main_js, $main_css];
}

// Vérifier et mettre à jour les références dans index.html
function updateIndexReferences($content, $main_js, $main_css) {
    $updated = false;
    $new_content = $content;
    
    if ($main_js) {
        // Rechercher les balises script de type module
        if (preg_match('/<script[^>]*type="module"[^>]*src="[^"]*\.js"[^>]*>/', $new_content)) {
            // Remplacer la référence JS existante
            $new_content = preg_replace(
                '/<script[^>]*type="module"[^>]*src="[^"]*\.js"[^>]*>/',
                '<script type="module" src="/assets/' . $main_js . '">',
                $new_content
            );
            $updated = true;
        } else {
            // Ajouter une nouvelle référence JS avant la fermeture de body
            $new_content = str_replace(
                '</body>',
                '  <script type="module" src="/assets/' . $main_js . '"></script>' . "\n</body>",
                $new_content
            );
            $updated = true;
        }
    }
    
    if ($main_css) {
        // Rechercher les balises link stylesheet
        if (preg_match('/<link[^>]*rel="stylesheet"[^>]*href="[^"]*\.css"[^>]*>/', $new_content)) {
            // Remplacer la référence CSS existante
            $new_content = preg_replace(
                '/<link[^>]*rel="stylesheet"[^>]*href="[^"]*\.css"[^>]*>/',
                '<link rel="stylesheet" href="/assets/' . $main_css . '">',
                $new_content
            );
            $updated = true;
        } else {
            // Ajouter une nouvelle référence CSS avant la fermeture de head
            $new_content = str_replace(
                '</head>',
                '  <link rel="stylesheet" href="/assets/' . $main_css . '">' . "\n</head>",
                $new_content
            );
            $updated = true;
        }
    }
    
    return [$updated, $new_content];
}

// Chemin vers index.html
$indexPath = './index.html';

// Vérifier si index.html existe
if (!file_exists($indexPath)) {
    die("Erreur: Le fichier index.html est introuvable.");
}

// Lire le contenu de index.html
$content = file_get_contents($indexPath);

// Trouver les fichiers hachés
$hashedFiles = findHashedFiles();

// Trouver les fichiers principaux
list($main_js, $main_css) = findMainFiles($hashedFiles);

// Statut des fichiers hachés trouvés
$status = [
    'js_files' => $hashedFiles['js'],
    'css_files' => $hashedFiles['css'],
    'main_js' => $main_js,
    'main_css' => $main_css,
    'main_js_referenced' => $main_js ? isFileReferenced($content, $main_js) : false,
    'main_css_referenced' => $main_css ? isFileReferenced($content, $main_css) : false
];

// Traitement de la demande de mise à jour
$updated = false;
$message = '';

if (isset($_POST['update'])) {
    // Créer une sauvegarde
    copy($indexPath, $indexPath . '.bak-' . date('YmdHis'));
    
    // Mettre à jour les références
    list($updated, $new_content) = updateIndexReferences($content, $main_js, $main_css);
    
    if ($updated) {
        // Enregistrer le fichier mis à jour
        file_put_contents($indexPath, $new_content);
        $message = "Le fichier index.html a été mis à jour avec succès.";
        
        // Mettre à jour le contenu pour l'affichage
        $content = $new_content;
        
        // Mettre à jour le statut
        $status['main_js_referenced'] = $main_js ? isFileReferenced($content, $main_js) : false;
        $status['main_css_referenced'] = $main_css ? isFileReferenced($content, $main_css) : false;
    } else {
        $message = "Aucune mise à jour n'était nécessaire.";
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des fichiers hachés</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        .section { margin: 20px 0; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Vérification des fichiers hachés</h1>
    
    <?php if ($message): ?>
    <div class="section">
        <p class="<?php echo $updated ? 'success' : 'info'; ?>"><?php echo $message; ?></p>
    </div>
    <?php endif; ?>
    
    <div class="section">
        <h2>Recherche des fichiers hachés</h2>
        <table>
            <tr>
                <th>Type</th>
                <th>Fichier trouvé</th>
                <th>Référencé dans index.html</th>
            </tr>
            <?php foreach ($hashedFiles['js'] as $file): ?>
            <tr>
                <td>JS</td>
                <td><?php echo htmlspecialchars($file); ?></td>
                <td>
                    <?php if (isFileReferenced($content, $file)): ?>
                    <span class="success">Oui</span>
                    <?php else: ?>
                    <span class="warning">Non</span>
                    <?php endif; ?>
                </td>
            </tr>
            <?php endforeach; ?>
            
            <?php foreach ($hashedFiles['css'] as $file): ?>
            <tr>
                <td>CSS</td>
                <td><?php echo htmlspecialchars($file); ?></td>
                <td>
                    <?php if (isFileReferenced($content, $file)): ?>
                    <span class="success">Oui</span>
                    <?php else: ?>
                    <span class="warning">Non</span>
                    <?php endif; ?>
                </td>
            </tr>
            <?php endforeach; ?>
            
            <?php if (empty($hashedFiles['js']) && empty($hashedFiles['css'])): ?>
            <tr>
                <td colspan="3"><span class="error">Aucun fichier haché trouvé dans le dossier assets/</span></td>
            </tr>
            <?php endif; ?>
        </table>
    </div>
    
    <div class="section">
        <h2>Fichiers principaux détectés</h2>
        <p>JavaScript principal: 
            <?php if ($main_js): ?>
                <span class="success"><?php echo htmlspecialchars($main_js); ?></span>
                <?php if ($status['main_js_referenced']): ?>
                    <span class="success">(Référencé dans index.html)</span>
                <?php else: ?>
                    <span class="error">(Non référencé dans index.html)</span>
                <?php endif; ?>
            <?php else: ?>
                <span class="error">Non trouvé</span>
            <?php endif; ?>
        </p>
        
        <p>CSS principal: 
            <?php if ($main_css): ?>
                <span class="success"><?php echo htmlspecialchars($main_css); ?></span>
                <?php if ($status['main_css_referenced']): ?>
                    <span class="success">(Référencé dans index.html)</span>
                <?php else: ?>
                    <span class="error">(Non référencé dans index.html)</span>
                <?php endif; ?>
            <?php else: ?>
                <span class="error">Non trouvé</span>
            <?php endif; ?>
        </p>
    </div>
    
    <div class="section">
        <h2>Actions disponibles</h2>
        <?php if (($main_js && !$status['main_js_referenced']) || ($main_css && !$status['main_css_referenced'])): ?>
            <form method="post">
                <button type="submit" name="update" class="button">Mettre à jour les références dans index.html</button>
            </form>
        <?php else: ?>
            <p>Toutes les références sont à jour. Aucune action nécessaire.</p>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>Contenu actuel de index.html</h2>
        <pre><?php echo htmlspecialchars($content); ?></pre>
    </div>
    
    <div class="section">
        <p><a href="index.html">Retour à l'application</a></p>
    </div>
</body>
</html>
