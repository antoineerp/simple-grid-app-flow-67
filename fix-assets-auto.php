
<?php
header('Content-Type: text/html; charset=utf-8');

// Fonction pour trouver le dernier fichier main.*.js
function findMainJsFile() {
    $mainJsPattern = './assets/main-*.js';
    $files = glob($mainJsPattern);
    
    if (!empty($files)) {
        // Trier par date de modification (le plus récent d'abord)
        usort($files, function($a, $b) {
            return filemtime($b) - filemtime($a);
        });
        return basename($files[0]);
    }
    
    return false;
}

// Fonction pour trouver le fichier CSS principal
function findMainCssFile() {
    $mainCssPattern = './assets/index-*.css';
    $files = glob($mainCssPattern);
    
    if (!empty($files)) {
        usort($files, function($a, $b) {
            return filemtime($b) - filemtime($a);
        });
        return basename($files[0]);
    }
    
    return false;
}

// Fonction pour mettre à jour index.html
function updateIndexHtml($jsFile, $cssFile) {
    if (!file_exists('./index.html')) {
        return ['success' => false, 'message' => 'Fichier index.html non trouvé'];
    }
    
    // Lire le fichier index.html
    $content = file_get_contents('./index.html');
    $originalContent = $content;
    $changes = [];
    
    // Remplacer la référence JavaScript
    if ($jsFile) {
        $newContent = preg_replace(
            '/<script[^>]*src="[^"]*\/src\/main\.tsx"[^>]*>/',
            '<script type="module" src="/assets/' . $jsFile . '">',
            $content
        );
        
        if ($newContent !== $content) {
            $content = $newContent;
            $changes[] = 'Référence JS mise à jour vers: /assets/' . $jsFile;
        } else {
            // Vérifier s'il y a déjà une référence à un fichier main-*.js
            if (preg_match('/<script[^>]*src="[^"]*\/assets\/main-[^"]*\.js"[^>]*>/', $content)) {
                $newContent = preg_replace(
                    '/<script[^>]*src="[^"]*\/assets\/main-[^"]*\.js"[^>]*>/',
                    '<script type="module" src="/assets/' . $jsFile . '">',
                    $content
                );
                
                if ($newContent !== $content) {
                    $content = $newContent;
                    $changes[] = 'Référence JS existante mise à jour vers: /assets/' . $jsFile;
                }
            } else {
                // Ajouter la référence si elle n'existe pas
                $newContent = str_replace(
                    '</body>',
                    '    <script type="module" src="/assets/' . $jsFile . '"></script>' . "\n" . '  </body>',
                    $content
                );
                
                if ($newContent !== $content) {
                    $content = $newContent;
                    $changes[] = 'Référence JS ajoutée: /assets/' . $jsFile;
                }
            }
        }
    }
    
    // Remplacer la référence CSS
    if ($cssFile) {
        $newContent = preg_replace(
            '/<link[^>]*href="[^"]*\/src\/index\.css"[^>]*>/',
            '<link rel="stylesheet" href="/assets/' . $cssFile . '">',
            $content
        );
        
        if ($newContent !== $content) {
            $content = $newContent;
            $changes[] = 'Référence CSS mise à jour vers: /assets/' . $cssFile;
        } else {
            // Vérifier s'il y a déjà une référence à un fichier index-*.css
            if (preg_match('/<link[^>]*href="[^"]*\/assets\/index-[^"]*\.css"[^>]*>/', $content)) {
                $newContent = preg_replace(
                    '/<link[^>]*href="[^"]*\/assets\/index-[^"]*\.css"[^>]*>/',
                    '<link rel="stylesheet" href="/assets/' . $cssFile . '">',
                    $content
                );
                
                if ($newContent !== $content) {
                    $content = $newContent;
                    $changes[] = 'Référence CSS existante mise à jour vers: /assets/' . $cssFile;
                }
            } else {
                // Ajouter la référence CSS dans head si elle n'existe pas
                $newContent = str_replace(
                    '</head>',
                    '    <link rel="stylesheet" href="/assets/' . $cssFile . '">' . "\n" . '  </head>',
                    $content
                );
                
                if ($newContent !== $content) {
                    $content = $newContent;
                    $changes[] = 'Référence CSS ajoutée: /assets/' . $cssFile;
                }
            }
        }
    }
    
    // S'assurer que la référence externe est correcte
    if (strpos($content, 'https://cdn.gpteng.co/gptengineer.js') === false) {
        $newContent = str_replace(
            '</body>',
            '    <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>' . "\n" . '  </body>',
            $content
        );
        
        if ($newContent !== $content) {
            $content = $newContent;
            $changes[] = 'Référence Script Lovable ajoutée';
        }
    }
    
    // Si des changements ont été détectés
    if ($originalContent !== $content) {
        // Créer une sauvegarde
        file_put_contents('./index.html.bak', $originalContent);
        
        // Écrire le nouveau contenu
        if (file_put_contents('./index.html', $content)) {
            return [
                'success' => true,
                'message' => 'Fichier index.html mis à jour avec succès',
                'changes' => $changes
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du fichier index.html',
                'changes' => $changes
            ];
        }
    } else {
        return [
            'success' => true,
            'message' => 'Aucune modification nécessaire',
            'changes' => []
        ];
    }
}

// Fonction pour vérifier et créer le dossier assets
function ensureAssetsFolder() {
    if (!is_dir('./assets')) {
        if (mkdir('./assets', 0755, true)) {
            return ['success' => true, 'message' => 'Dossier assets créé avec succès'];
        } else {
            return ['success' => false, 'message' => 'Impossible de créer le dossier assets'];
        }
    }
    
    return ['success' => true, 'message' => 'Le dossier assets existe déjà'];
}

// Fonction pour copier les fichiers de dist/assets vers assets
function copyDistAssets() {
    if (!is_dir('./dist/assets')) {
        return ['success' => false, 'message' => 'Dossier dist/assets non trouvé'];
    }
    
    $result = ensureAssetsFolder();
    if (!$result['success']) {
        return $result;
    }
    
    $files = glob('./dist/assets/*');
    $copied = 0;
    $failed = [];
    
    foreach ($files as $file) {
        $filename = basename($file);
        $dest = './assets/' . $filename;
        
        if (copy($file, $dest)) {
            $copied++;
        } else {
            $failed[] = $filename;
        }
    }
    
    return [
        'success' => true,
        'message' => "$copied fichiers copiés avec succès" . (count($failed) > 0 ? ", " . count($failed) . " échecs" : ""),
        'copied' => $copied,
        'failed' => $failed
    ];
}

// Script principal
function runFixAssetsScript() {
    $results = [];
    
    // Étape 1: Copier les fichiers depuis dist/assets si nécessaire
    if (is_dir('./dist/assets') && count(glob('./assets/*')) === 0) {
        $copyResult = copyDistAssets();
        $results['copy_assets'] = $copyResult;
    }
    
    // Étape 2: Trouver les derniers fichiers JS et CSS
    $jsFile = findMainJsFile();
    $cssFile = findMainCssFile();
    
    $results['files_found'] = [
        'js' => $jsFile ? $jsFile : 'non trouvé',
        'css' => $cssFile ? $cssFile : 'non trouvé'
    ];
    
    // Étape 3: Mettre à jour index.html
    $updateResult = updateIndexHtml($jsFile, $cssFile);
    $results['update_index'] = $updateResult;
    
    return $results;
}

// Exécuter le script automatiquement et afficher les résultats en JSON
if (php_sapi_name() === 'cli') {
    // Mode ligne de commande
    $results = runFixAssetsScript();
    echo json_encode($results, JSON_PRETTY_PRINT);
} else {
    // Mode web
    $results = runFixAssetsScript();
    
    // Déterminer le statut global
    $overallSuccess = $results['update_index']['success'] && 
                     (!isset($results['copy_assets']) || $results['copy_assets']['success']);
    
    header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction automatique des assets</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Correction automatique des références aux assets</h1>
    
    <div class="section">
        <h2>Résultat de l'opération</h2>
        <p>Statut global: 
            <span class="<?php echo $overallSuccess ? 'success' : 'error'; ?>">
                <?php echo $overallSuccess ? 'SUCCÈS' : 'ÉCHEC'; ?>
            </span>
        </p>
        <?php if (isset($results['copy_assets'])): ?>
        <h3>Copie des fichiers</h3>
        <p>
            <span class="<?php echo $results['copy_assets']['success'] ? 'success' : 'error'; ?>">
                <?php echo $results['copy_assets']['message']; ?>
            </span>
        </p>
        <?php endif; ?>
        
        <h3>Fichiers détectés</h3>
        <p>JavaScript principal: 
            <span class="<?php echo $results['files_found']['js'] !== 'non trouvé' ? 'success' : 'error'; ?>">
                <?php echo htmlspecialchars($results['files_found']['js']); ?>
            </span>
        </p>
        <p>CSS principal: 
            <span class="<?php echo $results['files_found']['css'] !== 'non trouvé' ? 'success' : 'error'; ?>">
                <?php echo htmlspecialchars($results['files_found']['css']); ?>
            </span>
        </p>
        
        <h3>Mise à jour de index.html</h3>
        <p>
            <span class="<?php echo $results['update_index']['success'] ? 'success' : 'error'; ?>">
                <?php echo htmlspecialchars($results['update_index']['message']); ?>
            </span>
        </p>
        <?php if (!empty($results['update_index']['changes'])): ?>
            <h4>Modifications effectuées:</h4>
            <ul>
                <?php foreach ($results['update_index']['changes'] as $change): ?>
                <li><?php echo htmlspecialchars($change); ?></li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>Étapes suivantes</h2>
        <ol>
            <li>Rafraîchissez votre application pour voir si les erreurs de synchronisation sont résolues</li>
            <li>Si les problèmes persistent, essayez de vider le cache de votre navigateur</li>
            <li>Vérifiez que tous les fichiers JS/CSS nécessaires sont bien présents dans le dossier <code>/assets</code></li>
        </ol>
    </div>
    
    <div class="section">
        <h2>Prévention des problèmes futurs</h2>
        <p>Pour éviter ces problèmes à l'avenir:</p>
        <ol>
            <li>Modifiez votre workflow GitHub pour exécuter automatiquement ce script après chaque déploiement</li>
            <li>Ajoutez une étape dans votre workflow qui vérifie les références dans index.html</li>
        </ol>
    </div>
</body>
</html>
<?php
}
?>
