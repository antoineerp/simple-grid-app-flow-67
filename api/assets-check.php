
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
    </style>
</head>
<body>
    <h1>Diagnostic d'accès aux ressources</h1>
    
    <?php
    // Vérifier le répertoire actuel
    echo "<p>Répertoire de travail actuel: " . getcwd() . "</p>";
    
    // Vérifier les assets JS
    $jsDir = '../dist/assets';
    echo "<h2>Vérification du répertoire assets:</h2>";
    if (file_exists($jsDir)) {
        echo "<p class='success'>Le répertoire dist/assets existe!</p>";
        $files = glob($jsDir . '/*.js');
        echo "<p>Fichiers JS trouvés: " . count($files) . "</p>";
        foreach ($files as $file) {
            echo "<p>" . basename($file) . " - " . (is_readable($file) ? "<span class='success'>Lisible</span>" : "<span class='error'>Non lisible</span>") . "</p>";
        }
    } else {
        echo "<p class='error'>Le répertoire dist/assets n'existe pas!</p>";
        
        // Essayer de créer les répertoires si possible
        if (!is_dir('../dist')) {
            if (mkdir('../dist', 0755, true)) {
                echo "<p class='success'>Répertoire dist créé avec succès!</p>";
            } else {
                echo "<p class='error'>Impossible de créer le répertoire dist. Vérifiez les permissions.</p>";
            }
        }
        
        if (is_dir('../dist')) {
            if (mkdir($jsDir, 0755, true)) {
                echo "<p class='success'>Répertoire assets créé avec succès!</p>";
            } else {
                echo "<p class='error'>Impossible de créer le répertoire assets. Vérifiez les permissions.</p>";
            }
        }
        
        echo "<p>Note: La création des répertoires ne suffit pas. L'application doit être compilée pour générer les fichiers assets.</p>";
    }
    
    // Vérifier le fichier index.html
    $indexFile = '../index.html';
    echo "<h2>Vérification du fichier index.html:</h2>";
    if (file_exists($indexFile)) {
        echo "<p class='success'>Le fichier index.html existe!</p>";
        echo "<p>" . (is_readable($indexFile) ? "<span class='success'>Lisible</span>" : "<span class='error'>Non lisible</span>") . "</p>";
    } else {
        echo "<p class='error'>Le fichier index.html n'existe pas!</p>";
    }
    
    // Vérifier la configuration de l'application pour le chargement des assets
    echo "<h2>Configuration du chargement des assets:</h2>";
    $htaccess = '../.htaccess';
    if (file_exists($htaccess) && is_readable($htaccess)) {
        $htaccessContent = file_get_contents($htaccess);
        if (strpos($htaccessContent, 'RewriteRule ^assets/') !== false) {
            echo "<p class='success'>La règle de réécriture pour les assets est présente dans .htaccess</p>";
        } else {
            echo "<p class='error'>La règle de réécriture pour les assets est absente dans .htaccess</p>";
        }
    } else {
        echo "<p class='error'>Impossible de lire le fichier .htaccess</p>";
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
