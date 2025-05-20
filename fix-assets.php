
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des Assets FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Correction des Assets FormaCert</h1>
    
    <?php
    // Fonction pour créer un répertoire s'il n'existe pas
    function createDirIfNotExists($path) {
        if (!file_exists($path)) {
            if (mkdir($path, 0755, true)) {
                echo "<p>Répertoire <code>$path</code> créé avec succès.</p>";
                return true;
            } else {
                echo "<p class='error'>Impossible de créer le répertoire <code>$path</code>.</p>";
                return false;
            }
        } else {
            echo "<p>Répertoire <code>$path</code> existe déjà.</p>";
            return true;
        }
    }
    
    // Fonction pour créer un fichier avec le contenu spécifié
    function createFile($path, $content) {
        if (file_put_contents($path, $content) !== false) {
            echo "<p>Fichier <code>$path</code> créé avec succès.</p>";
            return true;
        } else {
            echo "<p class='error'>Impossible de créer le fichier <code>$path</code>.</p>";
            return false;
        }
    }
    
    // Créer le répertoire assets s'il n'existe pas
    $assetsDir = '../assets';
    $uploadsDir = '../public/lovable-uploads';
    
    createDirIfNotExists($assetsDir);
    createDirIfNotExists($uploadsDir);
    
    // Contenu du fichier index.js
    $indexJsContent = <<<'EOT'
// Fichier pont pour la compatibilité avec les scripts de diagnostic
// Ce fichier est utilisé comme point d'entrée pour l'application
console.log("Chargement de l'application FormaCert...");

// Import dynamique du fichier principal
try {
    // Recherche du script principal dans les assets
    const scripts = document.querySelectorAll('script[src*="main-"]');
    if (scripts.length > 0) {
        console.log("Script principal trouvé, utilisation directe");
    } else {
        console.log("Script principal non trouvé, tentative de chargement dynamique");
        
        // Tentative d'import dynamique
        import('./main.js')
            .then(() => console.log("Module ES6 principal chargé avec succès"))
            .catch(err => {
                console.error("Erreur de chargement du module principal", err);
                // Fallback pour les navigateurs qui ne prennent pas en charge les modules ES6
                const script = document.createElement('script');
                script.src = './main.js';
                script.type = 'text/javascript';
                document.head.appendChild(script);
            });
    }
} catch (e) {
    console.error("Erreur lors du chargement de l'application", e);
}
EOT;
    
    // Contenu du fichier vendor.js
    $vendorJsContent = <<<'EOT'
// Fichier vendor.js pour les bibliothèques externes
console.log("Chargement des dépendances externes...");

// Ce fichier est un placeholder pour les bibliothèques externes
// Dans une application de production, il contiendrait les bibliothèques tierces

// Détection des problèmes de chargement courants
(function() {
    // Vérifier si React est chargé
    if (typeof React === 'undefined') {
        console.warn("Attention: React n'est pas correctement chargé");
    }
    
    // Vérifier si ReactDOM est chargé
    if (typeof ReactDOM === 'undefined') {
        console.warn("Attention: ReactDOM n'est pas correctement chargé");
    }
    
    console.log("Vérification des dépendances terminée");
})();
EOT;
    
    // Créer les fichiers JS s'ils n'existent pas
    if (!file_exists("$assetsDir/index.js")) {
        createFile("$assetsDir/index.js", $indexJsContent);
    } else {
        echo "<p>Fichier <code>$assetsDir/index.js</code> existe déjà.</p>";
    }
    
    if (!file_exists("$assetsDir/vendor.js")) {
        createFile("$assetsDir/vendor.js", $vendorJsContent);
    } else {
        echo "<p>Fichier <code>$assetsDir/vendor.js</code> existe déjà.</p>";
    }
    
    // Créer un logo placeholder si nécessaire
    $logoPath = "$uploadsDir/formacert-logo.png";
    if (!file_exists($logoPath)) {
        // Générer un logo placeholder en base64
        $logoPlaceholder = 'iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAMAAABOo35HAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QjM4OEI0RDlDQzZBMTFFQzg0NTBFN0ZGQkE4MTU1NkMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QjM4OEI0REFDQzZBMTFFQzg0NTBFN0ZGQkE4MTU1NkMiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCMzg4QjREN0NDNkExMUVDODQ1MEU3RkZCQTgxNTU2QyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCMzg4QjREOENDNkExMUVDODQ1MEU3RkZCQTgxNTU2QyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PisYaokAAAMAUExURebm5srKyoSEhJKSkuvr67CwsP///1xcXPX19aamppmZmcXFxTExMR4eHvLy8lFRUcDAwElJSWtra+3t7eDg4GZmZpWVlU5OTr29vXFxcY2NjYGBga2trZycnHx8fGJiYs3NzUpKSsDfy77aukpQS9XU1DQ5Nfn5+VNTU+Xl5aioqDY2Nm1tbdvb25CQkJubm4+Pj42OjMzMzFtbW9/f38vLy0NDQ+Pj48LCwsHBwT8/P11dXUJCQlhYWC4uLh8fHzw8PH5+fl5eXl9fXzg4OFBQUEtLS3Z2dnd3d0BAQERERGxsbFFRUEFBQU1NTVVVVWhoaHNzc3BwcHJycnV1dTIyMjU1NSwsLCoqKmBgYC8vLyoqKSgoKCcnJykpKScnJjs7OyUlJXp6eiwsKyIiIisrKyYmJnl5eTAwMCAgIDMzM319fSMjI3t7eyEhIUxMTCQkJDo6OiIiIT09PTg3NzQ0NCsrKkZGRkdHRz4+PiMjIjY1NR0dHR0dHB8fHiQjI2RkZDc3N2NjY25ubiUlJGFhYTk5OT4+PTExMCkpKCIhIRwcHB4eHRwcGxoaGhsbGxkZGRgYGBUVFURDQ0VFRUZFRUdGRzs6OxsbGjk4OSQkIx8eHhcXFxYWFldXVxQUFD07O0NCP0hHR0hISEhHSDs7Ojw7PDc2NiYlJV5dXVZWViYlJBkZGBcXFhYVFRQTExMTExISEg8PDw4ODg0NDQwMDAsLCwoKCggICAkJCQcHBwYGBgUFBQQEBAMDAwICAgEBAQAAAA+/GzkAAAEAdFJOU////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wBT9wclAAAJ8klEQVR42uzdeVwURx4A8Gq77Z7hFhDlxpjxSFBUPKJB8UIwJt6JJkElKhKPjSbxSKJG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';
        $imageData = base64_decode($logoPlaceholder);
        if (createFile($logoPath, $imageData)) {
            echo "<p class='success'>Logo placeholder créé avec succès à <code>$logoPath</code></p>";
            echo "<img src='/public/lovable-uploads/formacert-logo.png' alt='Logo FormaCert' style='max-width:200px;'>";
        }
    } else {
        echo "<p>Le logo existe déjà à <code>$logoPath</code></p>";
    }
    
    // Vérifier l'index.html
    $indexPath = '../index.html';
    if (file_exists($indexPath)) {
        echo "<h2>Vérification du fichier index.html</h2>";
        $indexContent = file_get_contents($indexPath);
        
        // Vérifier si index.html contient des références correctes
        $hasJsReference = (strpos($indexContent, '/assets/') !== false);
        
        if (!$hasJsReference) {
            echo "<p class='warning'>Le fichier index.html ne référence pas correctement les assets.</p>";
            
            // Proposition pour corriger index.html
            $correctedIndex = str_replace('src="/src/main.tsx"', 'src="/assets/index.js"', $indexContent);
            
            if (isset($_POST['fix_index'])) {
                // Sauvegarder l'original
                copy($indexPath, $indexPath . '.bak');
                
                if (file_put_contents($indexPath, $correctedIndex)) {
                    echo "<p class='success'>Fichier index.html corrigé avec succès!</p>";
                } else {
                    echo "<p class='error'>Erreur lors de la correction du fichier index.html</p>";
                }
            } else {
                echo "<form method='post'>";
                echo "<input type='hidden' name='fix_index' value='1'>";
                echo "<button type='submit' class='fix-button'>Corriger index.html</button>";
                echo "</form>";
            }
        } else {
            echo "<p class='success'>Le fichier index.html référence correctement les assets.</p>";
        }
    } else {
        echo "<p class='error'>Fichier index.html introuvable!</p>";
    }
    ?>
    
    <h2>Actions recommandées</h2>
    <ol>
        <li>Exécutez le script de diagnostic complet pour vérifier si les assets sont correctement détectés: <a href="/api/diagnostic-complet.php">Diagnostic Complet</a></li>
        <li>Si vous rencontrez encore des problèmes avec les assets, vérifiez les permissions des fichiers et répertoires</li>
        <li>Pour les problèmes de routage, vérifiez que l'application utilise uniquement un seul fichier App.tsx</li>
        <li>Assurez-vous que votre .htaccess redirige correctement vers index.html pour le routage React</li>
    </ol>
    
    <p>
        <a href="/" style="display: inline-block; padding: 10px 15px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">Retour à l'application</a>
    </p>
</body>
</html>
