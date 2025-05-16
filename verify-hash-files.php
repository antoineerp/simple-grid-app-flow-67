
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
            preg_match('/[A-Za-z0-9]{8,}\.js$/', $filename) ||
            strpos($filename, 'main-') === 0) {
            $result['js'][] = $filename;
        }
    }
    
    // Rechercher les fichiers CSS hachés
    $css_files = glob($directory . '/*.css');
    foreach ($css_files as $file) {
        $filename = basename($file);
        if (preg_match('/\.[A-Za-z0-9]{8,}\.css$/', $filename) || 
            preg_match('/[A-Za-z0-9]{8,}\.css$/', $filename) ||
            strpos($filename, 'main-') === 0 ||
            $filename === 'main.12345678.css') {
            $result['css'][] = $filename;
        }
    }
    
    return $result;
}

// Fonction pour trouver le fichier principal (main ou index)
function findMainFiles($hashedFiles) {
    $main_js = null;
    $main_css = null;
    
    // Chercher le fichier JavaScript principal
    foreach ($hashedFiles['js'] as $file) {
        if (strpos($file, 'main.') === 0 || strpos($file, 'main-') === 0) {
            $main_js = $file;
            break;
        } else if (strpos($file, 'index.') === 0) {
            $main_js = $file;
        }
    }
    
    // Chercher le fichier CSS principal
    foreach ($hashedFiles['css'] as $file) {
        if (strpos($file, 'main.') === 0 || strpos($file, 'main-') === 0) {
            $main_css = $file;
            break;
        } else if (strpos($file, 'index.') === 0) {
            $main_css = $file;
        }
    }
    
    // Si aucun fichier principal n'est trouvé, utiliser le premier de la liste
    if (!$main_js && !empty($hashedFiles['js'])) {
        $main_js = $hashedFiles['js'][0];
    }
    
    if (!$main_css && !empty($hashedFiles['css'])) {
        $main_css = $hashedFiles['css'][0];
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

// Fonction pour mettre à jour toutes les références de script
function updateAllScriptReferences($content, $js_files) {
    $updated = false;
    $new_content = $content;
    
    // Chercher tous les fichiers JS qui pourraient être chargés dynamiquement
    $dynamic_load_section = '';
    foreach ($js_files as $file) {
        // Ne pas ajouter les fichiers déjà référencés
        if (isFileReferenced($new_content, $file)) {
            continue;
        }
        
        // Créer un script de préchargement pour chaque fichier
        $dynamic_load_section .= '  <link rel="preload" href="/assets/' . $file . '" as="script" />' . "\n";
        $updated = true;
    }
    
    // Ajouter la section de préchargement avant la fin de head si des scripts ont été trouvés
    if (!empty($dynamic_load_section)) {
        $new_content = str_replace('</head>', $dynamic_load_section . '</head>', $new_content);
    }
    
    return [$updated, $new_content];
}

// Traitement de la demande de mise à jour complète
if (isset($_POST['update_all'])) {
    // Créer une sauvegarde
    copy($indexPath, $indexPath . '.bak-all-' . date('YmdHis'));
    
    // Mettre à jour toutes les références
    list($updated_refs, $new_content) = updateAllScriptReferences($content, $hashedFiles['js']);
    
    if ($updated_refs) {
        // Enregistrer le fichier mis à jour
        file_put_contents($indexPath, $new_content);
        $message = "Toutes les références ont été ajoutées à index.html.";
        
        // Mettre à jour le contenu pour l'affichage
        $content = $new_content;
    } else {
        $message = "Aucune référence supplémentaire n'était nécessaire.";
    }
}

// Traitment pour créer un fichier CSS principal s'il n'existe pas
if (isset($_POST['create_css']) && !$main_css) {
    // Chercher le contenu CSS original
    $src_css = '';
    if (file_exists('./src/index.css')) {
        $src_css = file_get_contents('./src/index.css');
    }
    
    // Si pas de CSS source, créer un CSS minimal
    if (empty($src_css)) {
        $src_css = <<<EOT
/* Fichier CSS principal généré automatiquement */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 210 100% 35%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

button, .btn {
  cursor: pointer;
  border-radius: var(--radius);
  font-weight: 500;
  padding: 0.5rem 1rem;
  transition: background-color 0.2s, opacity 0.2s;
}

.btn-primary {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border: none;
}

.btn-primary:hover {
  opacity: 0.9;
}

input, select, textarea {
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 0.5rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid hsl(var(--border));
}

.card {
  background-color: white;
  border-radius: var(--radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}
EOT;
    }
    
    // Créer le dossier assets s'il n'existe pas
    if (!is_dir('./assets')) {
        mkdir('./assets', 0755, true);
    }
    
    // Générer un nom de fichier avec un hash
    $css_filename = 'main.' . substr(md5(time()), 0, 8) . '.css';
    
    // Enregistrer le fichier CSS
    file_put_contents('./assets/' . $css_filename, $src_css);
    
    $message = "Fichier CSS principal créé: $css_filename";
    
    // Mettre à jour index.html pour référencer le nouveau CSS
    $main_css = $css_filename;
    list($updated, $new_content) = updateIndexReferences($content, null, $main_css);
    
    if ($updated) {
        file_put_contents($indexPath, $new_content);
        $content = $new_content;
        $message .= " et référencé dans index.html";
    }
    
    // Mettre à jour le statut
    $hashedFiles = findHashedFiles();
    list($main_js, $main_css) = findMainFiles($hashedFiles);
    $status = [
        'js_files' => $hashedFiles['js'],
        'css_files' => $hashedFiles['css'],
        'main_js' => $main_js,
        'main_css' => $main_css,
        'main_js_referenced' => $main_js ? isFileReferenced($content, $main_js) : false,
        'main_css_referenced' => $main_css ? isFileReferenced($content, $main_css) : false
    ];
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
        .buttons { display: flex; gap: 10px; margin: 15px 0; }
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
        <div class="buttons">
            <?php if (($main_js && !$status['main_js_referenced']) || ($main_css && !$status['main_css_referenced'])): ?>
                <form method="post">
                    <button type="submit" name="update" class="button">Mettre à jour les références principales dans index.html</button>
                </form>
            <?php endif; ?>
            
            <?php if (!empty($hashedFiles['js']) && count(array_filter($hashedFiles['js'], function($file) use ($content) { return !isFileReferenced($content, $file); })) > 0): ?>
                <form method="post">
                    <button type="submit" name="update_all" class="button" style="background: #2196F3;">Ajouter toutes les références à index.html</button>
                </form>
            <?php endif; ?>
            
            <?php if (empty($main_css)): ?>
                <form method="post">
                    <button type="submit" name="create_css" class="button" style="background: #FF9800;">Créer un fichier CSS principal</button>
                </form>
            <?php endif; ?>
        </div>
        
        <?php if (($main_js && $status['main_js_referenced']) && ($main_css && $status['main_css_referenced'])): ?>
            <p><span class="success">Toutes les références principales sont à jour.</span></p>
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
