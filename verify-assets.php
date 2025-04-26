
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des Assets</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Diagnostic des Assets</h1>
    
    <?php
    $assetsDir = './assets';
    $distDir = './dist';
    
    echo "<div class='section'>";
    echo "<h2>Vérification des répertoires</h2>";
    
    // Vérifier le répertoire assets
    if (is_dir($assetsDir)) {
        echo "<p>Répertoire assets: <span class='success'>EXISTE</span></p>";
        $jsFiles = glob("$assetsDir/*.js");
        $cssFiles = glob("$assetsDir/*.css");
        
        echo "<p>Fichiers JavaScript trouvés: " . count($jsFiles) . "</p>";
        foreach ($jsFiles as $file) {
            echo "<p>" . basename($file) . " - " . filesize($file) . " octets</p>";
        }
        
        echo "<p>Fichiers CSS trouvés: " . count($cssFiles) . "</p>";
        foreach ($cssFiles as $file) {
            echo "<p>" . basename($file) . " - " . filesize($file) . " octets</p>";
        }
    } else {
        echo "<p>Répertoire assets: <span class='error'>MANQUANT</span></p>";
    }
    
    // Vérifier le répertoire dist
    if (is_dir($distDir)) {
        echo "<p>Répertoire dist: <span class='success'>EXISTE</span></p>";
        if (is_dir("$distDir/assets")) {
            echo "<p>Répertoire dist/assets: <span class='success'>EXISTE</span></p>";
        } else {
            echo "<p>Répertoire dist/assets: <span class='error'>MANQUANT</span></p>";
        }
    } else {
        echo "<p>Répertoire dist: <span class='error'>MANQUANT</span></p>";
    }
    echo "</div>";
    
    // Vérifier index.html
    echo "<div class='section'>";
    echo "<h2>Vérification de index.html</h2>";
    if (file_exists('index.html')) {
        $content = file_get_contents('index.html');
        echo "<p>Fichier index.html: <span class='success'>EXISTE</span></p>";
        
        // Vérifier les références aux assets
        $hasJsRef = preg_match('/src=["\']\/?assets\/[^"\']+\.js/', $content);
        $hasCssRef = preg_match('/href=["\']\/?assets\/[^"\']+\.css/', $content);
        
        echo "<p>Référence JavaScript: " . ($hasJsRef ? "<span class='success'>TROUVÉE</span>" : "<span class='error'>MANQUANTE</span>") . "</p>";
        echo "<p>Référence CSS: " . ($hasCssRef ? "<span class='success'>TROUVÉE</span>" : "<span class='error'>MANQUANTE</span>") . "</p>";
    } else {
        echo "<p>Fichier index.html: <span class='error'>MANQUANT</span></p>";
    }
    echo "</div>";
    ?>
    
    <div class='section'>
        <h2>Actions recommandées</h2>
        <ol>
            <li>Exécutez <code>npm run build</code> pour générer les assets</li>
            <li>Vérifiez que tous les fichiers sont présents dans le dossier <code>dist/assets</code></li>
            <li>Copiez le contenu du dossier <code>dist</code> vers la racine du site</li>
            <li>Vérifiez que index.html référence correctement les fichiers d'assets</li>
        </ol>
    </div>
</body>
</html>
