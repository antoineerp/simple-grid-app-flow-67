
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Auto-correction des assets</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Auto-correction des références aux Assets</h1>
    
    <?php
    // Fonction pour trouver le dernier fichier main.*.js
    function findMainJsFile() {
        $pattern = './assets/main.*.js';
        $files = glob($pattern);
        if (!empty($files)) {
            // Trier par date de modification (le plus récent d'abord)
            usort($files, function($a, $b) {
                return filemtime($b) - filemtime($a);
            });
            return '/assets/' . basename($files[0]);
        }
        return false;
    }
    
    // Fonction pour trouver le fichier CSS principal
    function findMainCssFile() {
        if (file_exists('./assets/main.css')) {
            return '/assets/main.css';
        }
        
        $pattern = './assets/*.css';
        $files = glob($pattern);
        if (!empty($files)) {
            // Trier par date de modification (le plus récent d'abord)
            usort($files, function($a, $b) {
                return filemtime($b) - filemtime($a);
            });
            return '/assets/' . basename($files[0]);
        }
        return false;
    }
    
    // Vérifier si le fichier index.html existe
    if (file_exists('./index.html')) {
        echo "<p>Fichier index.html: <span class='success'>TROUVÉ</span></p>";
        
        // Lire le contenu actuel
        $content = file_get_contents('./index.html');
        $original_content = $content;
        
        // Trouver les assets
        $mainJs = findMainJsFile();
        $mainCss = findMainCssFile();
        
        echo "<p>Assets détectés:</p>";
        echo "<ul>";
        if ($mainJs) {
            echo "<li>JS principal: <span class='success'>" . htmlspecialchars($mainJs) . "</span></li>";
        } else {
            echo "<li>JS principal: <span class='error'>NON TROUVÉ</span></li>";
        }
        if ($mainCss) {
            echo "<li>CSS principal: <span class='success'>" . htmlspecialchars($mainCss) . "</span></li>";
        } else {
            echo "<li>CSS principal: <span class='error'>NON TROUVÉ</span></li>";
        }
        echo "</ul>";
        
        // Appliquer les corrections
        $changes_made = false;
        
        // Corriger la référence JS
        if ($mainJs) {
            $new_content = preg_replace(
                '/<script[^>]*src="\/assets\/main[^"]*\.js"[^>]*>/i',
                '<script type="module" src="' . $mainJs . '">',
                $content
            );
            if ($new_content != $content) {
                $content = $new_content;
                $changes_made = true;
                echo "<p>Référence JS mise à jour vers: <span class='success'>" . htmlspecialchars($mainJs) . "</span></p>";
            }
        }
        
        // Corriger la référence CSS
        if ($mainCss) {
            $new_content = preg_replace(
                '/<link[^>]*href="\/assets\/[^"]*\.css"[^>]*>/i',
                '<link rel="stylesheet" href="' . $mainCss . '">',
                $content
            );
            if ($new_content != $content) {
                $content = $new_content;
                $changes_made = true;
                echo "<p>Référence CSS mise à jour vers: <span class='success'>" . htmlspecialchars($mainCss) . "</span></p>";
            }
        }
        
        // S'assurer que la référence externe est correcte
        if (strpos($content, 'https://cdn.gpteng.co/gptengineer.js') === false) {
            // Ajouter la référence si elle n'existe pas
            $new_content = str_replace(
                '</body>',
                '    <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>' . "\n" . '  </body>',
                $content
            );
            if ($new_content != $content) {
                $content = $new_content;
                $changes_made = true;
                echo "<p>Référence externe ajoutée: <span class='success'>https://cdn.gpteng.co/gptengineer.js</span></p>";
            }
        }
        
        // Enregistrer les modifications si nécessaire
        if ($changes_made) {
            // Sauvegarder l'original
            file_put_contents('./index.html.bak', $original_content);
            
            if (file_put_contents('./index.html', $content)) {
                echo "<p><span class='success'>Modifications enregistrées avec succès!</span></p>";
                echo "<p>Une sauvegarde a été créée: index.html.bak</p>";
            } else {
                echo "<p><span class='error'>Impossible d'enregistrer les modifications.</span></p>";
            }
            
            echo "<h2>Nouveau contenu de index.html:</h2>";
            echo "<pre>" . htmlspecialchars($content) . "</pre>";
        } else {
            echo "<p><span class='success'>Aucune modification n'était nécessaire.</span></p>";
        }
    } else {
        echo "<p>Fichier index.html: <span class='error'>NON TROUVÉ</span></p>";
    }
    ?>
    
    <h2>Que faire après un build?</h2>
    <p>Après avoir exécuté <code>npm run build</code> et déployé les fichiers:</p>
    <ol>
        <li>Exécutez ce script pour mettre à jour automatiquement les références dans index.html</li>
        <li>Assurez-vous que le dossier <code>/assets</code> contient tous les fichiers JS et CSS nécessaires</li>
    </ol>
</body>
</html>
