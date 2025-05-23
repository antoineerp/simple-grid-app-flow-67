
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
    $jsDir = '../assets';
    echo "<h2>Vérification du répertoire assets:</h2>";
    if (file_exists($jsDir)) {
        echo "<p class='success'>Le répertoire assets existe!</p>";
        $files = glob($jsDir . '/*.js');
        echo "<p>Fichiers JS trouvés: " . count($files) . "</p>";
        foreach ($files as $file) {
            echo "<p>" . basename($file) . " - " . (is_readable($file) ? "<span class='success'>Lisible</span>" : "<span class='error'>Non lisible</span>") . "</p>";
        }
    } else {
        echo "<p class='error'>Le répertoire assets n'existe pas!</p>";
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
    ?>
    
    <h2>Test d'inclusion JavaScript</h2>
    <div id="js-test">Test JavaScript...</div>
    
    <script>
        document.getElementById('js-test').textContent = 'JavaScript fonctionne correctement!';
        document.getElementById('js-test').style.color = 'green';
    </script>
</body>
</html>
