
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic de Déploiement</title>
    <style>
        body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { color: blue; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        h2 { margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        code { background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
        .details { margin-top: 5px; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>Diagnostic de Déploiement FormaCert</h1>
    
    <div class="section">
        <h2>Informations Serveur</h2>
        <p>Serveur: <?php echo $_SERVER['SERVER_SOFTWARE']; ?></p>
        <p>PHP Version: <?php echo phpversion(); ?></p>
        <p>Document Root: <?php echo $_SERVER['DOCUMENT_ROOT']; ?></p>
        <p>Répertoire Courant: <?php echo getcwd(); ?></p>
    </div>
    
    <div class="section">
        <h2>Structure des Fichiers</h2>
        <?php
        $directories = [
            '../dist/assets' => 'Dossier des assets JS/CSS compilés',
            '../public' => 'Dossier des fichiers publics',
            '../public/lovable-uploads' => 'Dossier des uploads',
            '../api' => 'Dossier API'
        ];
        
        foreach ($directories as $dir => $description) {
            echo "<p>$description ($dir): ";
            if (file_exists($dir)) {
                echo "<span class='success'>Existe</span>";
                $files = scandir($dir);
                $fileCount = count($files) - 2; // Moins . et ..
                echo " ($fileCount fichiers)";
            } else {
                echo "<span class='error'>N'existe pas</span>";
            }
            echo "</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Fichiers JavaScript</h2>
        <?php
        $jsDir = '../dist/assets';
        if (file_exists($jsDir)) {
            $jsFiles = glob($jsDir . '/*.js');
            echo "<table>";
            echo "<tr><th>Fichier</th><th>Taille</th><th>Date de modification</th><th>Statut</th></tr>";
            foreach ($jsFiles as $file) {
                echo "<tr>";
                echo "<td>" . basename($file) . "</td>";
                echo "<td>" . number_format(filesize($file) / 1024, 2) . " KB</td>";
                echo "<td>" . date("Y-m-d H:i:s", filemtime($file)) . "</td>";
                echo "<td>" . (is_readable($file) ? "<span class='success'>Lisible</span>" : "<span class='error'>Non lisible</span>") . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p class='error'>Le répertoire dist/assets n'existe pas!</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Fichiers CSS</h2>
        <?php
        $cssDir = '../dist/assets';
        if (file_exists($cssDir)) {
            $cssFiles = glob($cssDir . '/*.css');
            if (count($cssFiles) > 0) {
                echo "<table>";
                echo "<tr><th>Fichier</th><th>Taille</th><th>Date de modification</th><th>Statut</th></tr>";
                foreach ($cssFiles as $file) {
                    echo "<tr>";
                    echo "<td>" . basename($file) . "</td>";
                    echo "<td>" . number_format(filesize($file) / 1024, 2) . " KB</td>";
                    echo "<td>" . date("Y-m-d H:i:s", filemtime($file)) . "</td>";
                    echo "<td>" . (is_readable($file) ? "<span class='success'>Lisible</span>" : "<span class='error'>Non lisible</span>") . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
            } else {
                echo "<p class='info'>Aucun fichier CSS trouvé dans dist/assets</p>";
            }
        } else {
            echo "<p class='error'>Le répertoire dist/assets n'existe pas!</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Fichiers Clés</h2>
        <?php
        $key_files = [
            '../index.html' => 'Page d\'accueil',
            '../.htaccess' => 'Configuration Apache',
            '../dist/assets/index.js' => 'JavaScript principal',
            '../dist/assets/index.css' => 'CSS principal (si présent)'
        ];
        
        echo "<table>";
        echo "<tr><th>Fichier</th><th>Description</th><th>Statut</th><th>Taille</th></tr>";
        foreach ($key_files as $file => $description) {
            echo "<tr>";
            echo "<td>$file</td>";
            echo "<td>$description</td>";
            
            if (file_exists($file)) {
                echo "<td><span class='success'>Existe</span></td>";
                echo "<td>" . number_format(filesize($file) / 1024, 2) . " KB</td>";
            } else {
                echo "<td><span class='error'>N'existe pas</span></td>";
                echo "<td>-</td>";
            }
            echo "</tr>";
        }
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>Validation de l'Index HTML</h2>
        <?php
        $indexFile = '../index.html';
        if (file_exists($indexFile)) {
            $content = file_get_contents($indexFile);
            
            // Vérifier les scripts et styles
            $hasModuleScript = preg_match('/<script[^>]*type="module"[^>]*src="\/assets\/[^"]*"[^>]*>/', $content);
            $hasStylesheet = preg_match('/<link[^>]*rel="stylesheet"[^>]*href="\/assets\/[^"]*"[^>]*>/', $content);
            $rootElement = preg_match('/<div\s+id="root"><\/div>/', $content);
            
            echo "<p>Élément racine (div id=\"root\"): " . ($rootElement ? "<span class='success'>Présent</span>" : "<span class='error'>Manquant</span>") . "</p>";
            echo "<p>Script JS (type=\"module\"): " . ($hasModuleScript ? "<span class='success'>Présent</span>" : "<span class='error'>Manquant</span>") . "</p>";
            echo "<p>Feuille de style CSS: " . ($hasStylesheet ? "<span class='success'>Présent</span>" : "<span class='error'>Manquant</span>") . "</p>";
            
            // Afficher les 10 premières lignes
            echo "<p><strong>Aperçu (10 premières lignes):</strong></p>";
            echo "<pre>";
            $lines = explode("\n", $content);
            for ($i = 0; $i < min(10, count($lines)); $i++) {
                echo htmlspecialchars($lines[$i]) . "\n";
            }
            echo "</pre>";
        } else {
            echo "<p class='error'>Le fichier index.html n'existe pas!</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Configuration .htaccess</h2>
        <?php
        $htaccessFile = '../.htaccess';
        if (file_exists($htaccessFile)) {
            $content = file_get_contents($htaccessFile);
            
            // Vérifier les règles essentielles
            $hasAssetRule = strpos($content, 'RewriteRule ^assets/') !== false;
            $hasApiRule = strpos($content, 'RewriteRule ^api/') !== false;
            $hasSpaRule = strpos($content, 'RewriteRule ^(?!api/).*$ index.html') !== false;
            
            echo "<p>Règle de réécriture pour assets: " . ($hasAssetRule ? "<span class='success'>Présente</span>" : "<span class='error'>Manquante</span>") . "</p>";
            echo "<p>Règle de réécriture pour API: " . ($hasApiRule ? "<span class='success'>Présente</span>" : "<span class='error'>Manquante</span>") . "</p>";
            echo "<p>Règle de réécriture pour SPA: " . ($hasSpaRule ? "<span class='success'>Présente</span>" : "<span class='error'>Manquante</span>") . "</p>";
            
            // Afficher les 10 premières lignes
            echo "<p><strong>Aperçu (10 premières lignes):</strong></p>";
            echo "<pre>";
            $lines = explode("\n", $content);
            for ($i = 0; $i < min(10, count($lines)); $i++) {
                echo htmlspecialchars($lines[$i]) . "\n";
            }
            echo "</pre>";
        } else {
            echo "<p class='error'>Le fichier .htaccess n'existe pas!</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Test d'Inclusion JavaScript</h2>
        <div id="js-test">Test JavaScript...</div>
        
        <script>
            document.getElementById('js-test').textContent = 'JavaScript fonctionne correctement!';
            document.getElementById('js-test').style.color = 'green';
        </script>
    </div>
    
    <div class="section">
        <h2>Instructions de Déploiement</h2>
        <ol>
            <li>Assurez-vous que le contenu du répertoire <code>dist/assets</code> est accessible</li>
            <li>Vérifiez que le fichier <code>index.html</code> pointe vers <code>/assets/index.js</code></li>
            <li>Assurez-vous que le fichier <code>.htaccess</code> contient les règles de réécriture correctes</li>
            <li>Vérifiez que toutes les dépendances JavaScript et CSS sont incluses dans le HTML</li>
        </ol>
        
        <p class="details">Si vous rencontrez des problèmes avec la SPA (Single Page Application), vérifiez:</p>
        <ol>
            <li>Que les routes React Router sont correctement configurées</li>
            <li>Que le <code>basename</code> du router est correctement défini si l'application n'est pas à la racine du domaine</li>
            <li>Que votre configuration <code>.htaccess</code> redirige correctement vers <code>index.html</code> pour toutes les routes de l'application</li>
        </ol>
    </div>
</body>
</html>

