
<?php
/**
 * Script pour vérifier et corriger les références aux fichiers CSS et JS dans index.html
 * Simplifie l'utilisation des fichiers hachés générés par le build
 */
header('Content-Type: text/html; charset=utf-8');

$result = [
    'status' => 'init',
    'message' => 'Démarrage de la vérification',
    'actions' => []
];

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
        $result['actions'][] = 'Dossier assets créé';
    }
    
    // Rechercher les fichiers CSS et JS hachés dans le dossier assets
    $assets_files = scandir('assets');
    $js_hashed_files = [];
    $css_hashed_files = [];
    
    foreach ($assets_files as $file) {
        if (preg_match('/\.([a-zA-Z0-9]+)\.(js)$/', $file, $matches)) {
            $js_hashed_files[] = $file;
        } elseif (preg_match('/\.([a-zA-Z0-9]+)\.(css)$/', $file, $matches)) {
            $css_hashed_files[] = $file;
        }
    }
    
    // Chercher s'il manque des liens vers main.css et index.css
    $has_main_css_ref = strpos($html, 'href="/assets/main.css"') !== false;
    $has_index_css_ref = strpos($html, 'href="/assets/index.css"') !== false;
    $has_main_js_ref = strpos($html, 'src="/assets/main.js"') !== false;
    $has_index_js_ref = strpos($html, 'src="/assets/index.js"') !== false;
    
    $modified = false;
    
    // Ajouter les références CSS manquantes
    if (!$has_main_css_ref) {
        $html = str_replace('</head>', '  <link rel="stylesheet" href="/assets/main.css" type="text/css" />' . "\n</head>", $html);
        $modified = true;
        $result['actions'][] = 'Référence à main.css ajoutée';
        
        // Créer main.css s'il n'existe pas
        if (!file_exists('assets/main.css')) {
            $main_css = "/* CSS principal généré automatiquement */\nbody { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }\n";
            file_put_contents('assets/main.css', $main_css);
            $result['actions'][] = 'Fichier main.css créé';
        }
    }
    
    if (!$has_index_css_ref) {
        $html = str_replace('</head>', '  <link rel="stylesheet" href="/assets/index.css" type="text/css" />' . "\n</head>", $html);
        $modified = true;
        $result['actions'][] = 'Référence à index.css ajoutée';
        
        // Créer index.css s'il n'existe pas
        if (!file_exists('assets/index.css')) {
            $index_css = "/* CSS secondaire généré automatiquement */\n";
            file_put_contents('assets/index.css', $index_css);
            $result['actions'][] = 'Fichier index.css créé';
        }
    }
    
    // Ajouter les références JS manquantes
    if (!$has_main_js_ref) {
        $html = str_replace('</body>', '  <script src="/assets/main.js"></script>' . "\n</body>", $html);
        $modified = true;
        $result['actions'][] = 'Référence à main.js ajoutée';
        
        // Créer main.js s'il n'existe pas
        if (!file_exists('assets/main.js')) {
            $main_js = "// Script principal généré automatiquement\nconsole.log('Application chargée');\n";
            file_put_contents('assets/main.js', $main_js);
            $result['actions'][] = 'Fichier main.js créé';
        }
    }
    
    if (!$has_index_js_ref) {
        $html = str_replace('</body>', '  <script type="module" src="/assets/index.js"></script>' . "\n</body>", $html);
        $modified = true;
        $result['actions'][] = 'Référence à index.js ajoutée';
        
        // Créer index.js s'il n'existe pas
        if (!file_exists('assets/index.js')) {
            $index_js = "// Script d'entrée généré automatiquement\nconsole.log('Module index chargé');\n";
            file_put_contents('assets/index.js', $index_js);
            $result['actions'][] = 'Fichier index.js créé';
        }
    }
    
    // Vérifier si le script GPT Engineer est présent
    $has_gpt_engineer = strpos($html, 'src="https://cdn.gpteng.co/gptengineer.js"') !== false;
    if (!$has_gpt_engineer) {
        $script_tag = '<script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>';
        
        // Trouver la position pour insérer le script (avant le premier script)
        $script_pos = strpos($html, '<script');
        if ($script_pos !== false) {
            $html = substr($html, 0, $script_pos) . $script_tag . "\n  " . substr($html, $script_pos);
            $modified = true;
            $result['actions'][] = 'Script GPT Engineer ajouté';
        }
    }
    
    // Sauvegarder le fichier s'il y a eu des modifications
    if ($modified) {
        if (file_put_contents('index.html', $html) !== false) {
            $result['status'] = 'success';
            $result['message'] = 'Index.html mis à jour avec succès';
        } else {
            $result['status'] = 'error';
            $result['message'] = 'Impossible d\'écrire dans index.html';
        }
    } else {
        $result['status'] = 'success';
        $result['message'] = 'Aucune modification nécessaire';
    }
    
    // Création de liens symboliques pour les fichiers hachés si nécessaire
    foreach ($js_hashed_files as $js_file) {
        if (preg_match('/^(index|main)\..*\.js$/', $js_file, $matches)) {
            $base_name = $matches[1] . '.js';
            if (!file_exists('assets/' . $base_name)) {
                copy('assets/' . $js_file, 'assets/' . $base_name);
                $result['actions'][] = "Copie de $js_file vers $base_name";
            }
        }
    }
    
    foreach ($css_hashed_files as $css_file) {
        if (preg_match('/^(index|main)\..*\.css$/', $css_file, $matches)) {
            $base_name = $matches[1] . '.css';
            if (!file_exists('assets/' . $base_name)) {
                copy('assets/' . $css_file, 'assets/' . $base_name);
                $result['actions'][] = "Copie de $css_file vers $base_name";
            }
        }
    }
    
} catch (Exception $e) {
    $result['status'] = 'error';
    $result['message'] = 'Erreur: ' . $e->getMessage();
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des fichiers statiques</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; }
        .error { color: red; }
        .action { margin-left: 20px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; }
    </style>
</head>
<body>
    <h1>Correction des fichiers statiques</h1>
    
    <div class="<?php echo $result['status'] === 'success' ? 'success' : 'error'; ?>">
        <h2>Statut: <?php echo ucfirst($result['status']); ?></h2>
        <p><?php echo htmlspecialchars($result['message']); ?></p>
    </div>
    
    <?php if (!empty($result['actions'])): ?>
    <h2>Actions effectuées:</h2>
    <ul>
        <?php foreach ($result['actions'] as $action): ?>
        <li class="action"><?php echo htmlspecialchars($action); ?></li>
        <?php endforeach; ?>
    </ul>
    <?php endif; ?>
    
    <h2>Fichiers trouvés dans assets/:</h2>
    <pre><?php 
    if (is_dir('assets')) {
        echo implode("\n", scandir('assets'));
    } else {
        echo "Le dossier assets/ n'existe pas.";
    }
    ?></pre>
    
    <p><a href="/">Retour à la page d'accueil</a></p>
</body>
</html>
