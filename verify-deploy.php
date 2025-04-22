
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification Déploiement FormaCert</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Outil de Vérification du Déploiement</h1>
    
    <h2>1. Structure des fichiers</h2>
    <?php
    // Vérification des répertoires essentiels
    $directories = [
        '.' => 'Répertoire racine',
        './assets' => 'Répertoire assets',
        './api' => 'Répertoire API',
        './public' => 'Répertoire public',
        './public/lovable-uploads' => 'Répertoire uploads'
    ];
    
    foreach ($directories as $dir => $name) {
        echo "<p>$name: ";
        if (is_dir($dir)) {
            echo "<span class='success'>OK</span>";
            // Liste des fichiers
            $files = scandir($dir);
            $fileCount = count($files) - 2; // Moins . et ..
            echo " ($fileCount fichiers)";
        } else {
            echo "<span class='error'>MANQUANT</span>";
        }
        echo "</p>";
    }
    ?>
    
    <h2>2. Fichiers clés</h2>
    <?php
    // Vérification des fichiers essentiels
    $files = [
        './index.html' => 'Page principale',
        './.htaccess' => 'Configuration Apache',
        './assets/index.js' => 'JavaScript principal',
        './assets/index.css' => 'CSS principal'
    ];
    
    foreach ($files as $file => $name) {
        echo "<p>$name ($file): ";
        if (file_exists($file)) {
            echo "<span class='success'>OK</span>";
        } else {
            echo "<span class='error'>MANQUANT</span>";
        }
        echo "</p>";
    }
    ?>
    
    <h2>3. Contenu de index.html</h2>
    <pre><?php 
    if (file_exists('./index.html')) {
        echo htmlspecialchars(file_get_contents('./index.html')); 
    } else {
        echo "<span class='error'>Fichier non trouvé</span>";
    }
    ?></pre>
    
    <h2>4. Test de chargement JavaScript</h2>
    <div id="js-test">Si JavaScript fonctionne, ce texte sera remplacé.</div>
    <script>
        document.getElementById('js-test').textContent = 'JavaScript fonctionne correctement!';
        document.getElementById('js-test').style.color = 'green';
    </script>
    
    <h2>5. Test d'accès à l'API</h2>
    <?php
    $apiUrl = '/api';
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "<p>Code de réponse API: ";
    if ($httpCode >= 200 && $httpCode < 300) {
        echo "<span class='success'>$httpCode (OK)</span>";
    } else {
        echo "<span class='error'>$httpCode (Erreur)</span>";
    }
    echo "</p>";
    ?>
</body>
</html>
