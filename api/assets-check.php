
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic des Assets</title>
    <style>
        body { font-family: sans-serif; padding: 20px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .info-box { background: #f5f5f5; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .command { background: #333; color: white; padding: 10px; border-radius: 3px; font-family: monospace; }
    </style>
</head>
<body>
    <h1>Diagnostic d'accès aux ressources</h1>
    
    <?php
    // Vérifier le répertoire actuel
    echo "<p>Répertoire de travail actuel: " . getcwd() . "</p>";
    
    // Définir les chemins
    $rootDir = dirname(__DIR__);
    $distDir = $rootDir . '/dist';
    $assetsDir = $distDir . '/assets';
    $srcDir = $rootDir . '/src';
    
    // Vérifier structure des répertoires
    echo "<h2>Structure des répertoires:</h2>";
    echo "<ul>";
    echo "<li>Répertoire racine: " . (is_dir($rootDir) ? "<span class='success'>OK</span>" : "<span class='error'>Non trouvé</span>") . "</li>";
    echo "<li>Répertoire dist: " . (is_dir($distDir) ? "<span class='success'>OK</span>" : "<span class='error'>Non trouvé</span>") . "</li>";
    echo "<li>Répertoire assets: " . (is_dir($assetsDir) ? "<span class='success'>OK</span>" : "<span class='error'>Non trouvé</span>") . "</li>";
    echo "<li>Répertoire src: " . (is_dir($srcDir) ? "<span class='success'>OK</span>" : "<span class='error'>Non trouvé</span>") . "</li>";
    echo "</ul>";
    
    // Si le répertoire dist n'existe pas, suggérer la création
    if (!is_dir($distDir)) {
        echo "<div class='info-box'>";
        echo "<h3 class='error'>Problème critique: Le répertoire 'dist' est manquant</h3>";
        echo "<p>Ce répertoire est essentiel car il contient les fichiers compilés de l'application.</p>";
        echo "<p>Solution: Exécutez la commande suivante sur votre serveur:</p>";
        echo "<p class='command'>npm run build</p>";
        echo "</div>";
    }
    
    // Si le répertoire assets n'existe pas, suggérer la création
    if (!is_dir($assetsDir)) {
        echo "<div class='info-box'>";
        echo "<h3 class='error'>Problème critique: Le répertoire 'dist/assets' est manquant</h3>";
        echo "<p>Ce répertoire est créé lors de la compilation et contient les fichiers JavaScript et CSS essentiels.</p>";
        echo "<p>Solution: Exécutez la commande suivante sur votre serveur:</p>";
        echo "<p class='command'>npm run build</p>";
        echo "</div>";
    }
    
    // Vérifier les droits d'écriture
    echo "<h2>Vérification des permissions:</h2>";
    echo "<ul>";
    echo "<li>Droits d'écriture sur le répertoire racine: " . (is_writable($rootDir) ? "<span class='success'>OK</span>" : "<span class='error'>Pas de droits d'écriture</span>") . "</li>";
    
    if (is_dir($distDir)) {
        echo "<li>Droits d'écriture sur le répertoire dist: " . (is_writable($distDir) ? "<span class='success'>OK</span>" : "<span class='error'>Pas de droits d'écriture</span>") . "</li>";
    }
    
    if (is_dir($assetsDir)) {
        echo "<li>Droits d'écriture sur le répertoire assets: " . (is_writable($assetsDir) ? "<span class='success'>OK</span>" : "<span class='error'>Pas de droits d'écriture</span>") . "</li>";
    }
    echo "</ul>";
    
    // Vérifier les assets JS
    if (is_dir($assetsDir)) {
        echo "<h2>Vérification des fichiers assets:</h2>";
        $files = glob($assetsDir . '/*.js');
        $cssFiles = glob($assetsDir . '/*.css');
        
        echo "<p>Fichiers JS trouvés: " . count($files) . "</p>";
        if (count($files) > 0) {
            echo "<ul>";
            foreach ($files as $file) {
                echo "<li>" . basename($file) . " - " . (is_readable($file) ? "<span class='success'>Lisible</span>" : "<span class='error'>Non lisible</span>") . "</li>";
            }
            echo "</ul>";
        } else {
            echo "<p class='error'>Aucun fichier JavaScript trouvé dans le répertoire assets!</p>";
            echo "<p>Cela suggère que la compilation n'a pas réussi ou n'a pas été exécutée.</p>";
        }
        
        echo "<p>Fichiers CSS trouvés: " . count($cssFiles) . "</p>";
        if (count($cssFiles) > 0) {
            echo "<ul>";
            foreach ($cssFiles as $file) {
                echo "<li>" . basename($file) . " - " . (is_readable($file) ? "<span class='success'>Lisible</span>" : "<span class='error'>Non lisible</span>") . "</li>";
            }
            echo "</ul>";
        }
    } else {
        echo "<h2>Impossible de vérifier les assets car le répertoire n'existe pas</h2>";
    }
    
    // Vérifier le fichier main.jsx dans src
    echo "<h2>Vérification des fichiers source:</h2>";
    $mainJsx = $srcDir . '/main.jsx';
    $mainTsx = $srcDir . '/main.tsx';
    $indexCss = $srcDir . '/index.css';
    
    echo "<ul>";
    echo "<li>main.jsx: " . (file_exists($mainJsx) ? "<span class='success'>Existe</span>" : "<span class='error'>Manquant</span>") . "</li>";
    echo "<li>main.tsx: " . (file_exists($mainTsx) ? "<span class='success'>Existe</span>" : "<span class='warning'>Manquant (optionnel)</span>") . "</li>";
    echo "<li>index.css: " . (file_exists($indexCss) ? "<span class='success'>Existe</span>" : "<span class='warning'>Manquant</span>") . "</li>";
    echo "</ul>";
    
    // Vérifier la configuration de l'application pour le chargement des assets
    echo "<h2>Configuration du chargement des assets:</h2>";
    $htaccess = $rootDir . '/.htaccess';
    if (file_exists($htaccess) && is_readable($htaccess)) {
        $htaccessContent = file_get_contents($htaccess);
        echo "<ul>";
        echo "<li>Règle de réécriture pour les assets: " . (strpos($htaccessContent, 'RewriteRule ^assets/') !== false ? 
            "<span class='success'>Présente</span>" : "<span class='error'>Absente</span>") . "</li>";
        echo "<li>Règle de réécriture pour le répertoire dist: " . (strpos($htaccessContent, 'RewriteRule ^dist/') !== false ? 
            "<span class='success'>Présente</span>" : "<span class='error'>Absente</span>") . "</li>";
        echo "<li>Accès aux fichiers source src: " . (strpos($htaccessContent, 'RewriteRule ^src/') !== false ? 
            "<span class='success'>Configuré</span>" : "<span class='warning'>Non configuré</span>") . "</li>";
        echo "</ul>";
    } else {
        echo "<p class='error'>Impossible de lire le fichier .htaccess</p>";
    }
    
    // Vérifier le fichier index.html
    $indexFile = $rootDir . '/index.html';
    echo "<h2>Vérification du fichier index.html:</h2>";
    if (file_exists($indexFile)) {
        echo "<p class='success'>Le fichier index.html existe!</p>";
        
        if (is_readable($indexFile)) {
            echo "<p>Le fichier est lisible: <span class='success'>OK</span></p>";
            
            // Analyser le contenu pour vérifier les références aux scripts
            $indexContent = file_get_contents($indexFile);
            $hasDevSrc = strpos($indexContent, 'src="/src/main.jsx"') !== false;
            $hasProdSrc = strpos($indexContent, 'src="/dist/assets/main.js"') !== false;
            
            echo "<p>Référence au script de développement: " . ($hasDevSrc ? "<span class='warning'>Présente</span>" : "<span class='success'>Absente</span>") . "</p>";
            echo "<p>Référence au script de production: " . ($hasProdSrc ? "<span class='success'>Présente</span>" : "<span class='error'>Absente</span>") . "</p>";
            
            if ($hasDevSrc && !$hasProdSrc) {
                echo "<div class='info-box'>";
                echo "<h3 class='warning'>Configuration de développement détectée</h3>";
                echo "<p>L'index.html pointe vers les fichiers source non compilés. Cela ne fonctionnera pas en production.</p>";
                echo "<p>Modifiez la référence au script principal dans index.html pour pointer vers /dist/assets/main.js au lieu de /src/main.jsx</p>";
                echo "</div>";
            }
        } else {
            echo "<p class='error'>Le fichier index.html n'est pas lisible!</p>";
        }
    } else {
        echo "<p class='error'>Le fichier index.html n'existe pas!</p>";
    }
    
    // Résumé et recommandations
    echo "<h2>Résumé et recommandations:</h2>";
    $hasIssues = false;
    
    if (!is_dir($distDir) || !is_dir($assetsDir)) {
        $hasIssues = true;
        echo "<div class='info-box'>";
        echo "<h3 class='error'>Build manquant</h3>";
        echo "<p>Le répertoire dist/assets est manquant ou incomplet. Vous devez exécuter la commande de build:</p>";
        echo "<p class='command'>npm run build</p>";
        echo "</div>";
    }
    
    if (is_dir($assetsDir) && count(glob($assetsDir . '/*.js')) == 0) {
        $hasIssues = true;
        echo "<div class='info-box'>";
        echo "<h3 class='error'>Fichiers JS manquants</h3>";
        echo "<p>Le répertoire assets existe mais ne contient aucun fichier JavaScript. La compilation a probablement échoué.</p>";
        echo "<p>Vérifiez les erreurs de compilation et exécutez à nouveau:</p>";
        echo "<p class='command'>npm run build</p>";
        echo "</div>";
    }
    
    if (file_exists($indexFile) && is_readable($indexFile)) {
        $indexContent = file_get_contents($indexFile);
        if (strpos($indexContent, 'src="/src/main.jsx"') !== false && !is_dir($assetsDir)) {
            echo "<div class='info-box'>";
            echo "<h3 class='warning'>Configuration de développement avec assets manquants</h3>";
            echo "<p>L'application est configurée pour utiliser les fichiers source non compilés, mais le dossier de build n'existe pas.</p>";
            echo "<p>Vous pouvez soit:</p>";
            echo "<ol>";
            echo "<li>Exécuter <span class='command'>npm run build</span> pour générer les fichiers de production</li>";
            echo "<li>OU configurer votre serveur pour servir correctement les fichiers source bruts (non recommandé en production)</li>";
            echo "</ol>";
            echo "</div>";
        }
    }
    
    if (!$hasIssues) {
        echo "<p class='success'>Aucun problème majeur détecté! Si l'application ne fonctionne toujours pas, vérifiez les journaux du serveur et de la console du navigateur.</p>";
    }
    ?>
    
    <h2>Test d'inclusion JavaScript</h2>
    <div id="js-test">Test JavaScript...</div>
    
    <script>
        document.getElementById('js-test').textContent = 'JavaScript fonctionne correctement!';
        document.getElementById('js-test').style.color = 'green';
    </script>
</body>
</html>
