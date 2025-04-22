
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification du Déploiement FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Vérification du Déploiement FormaCert</h1>
    
    <div class="section">
        <h2>1. Vérification des Fichiers Essentiels</h2>
        <?php
        $required_files = [
            'index.html' => 'Page principale',
            '.htaccess' => 'Configuration Apache',
            'assets/index-PHASH.js' => 'JavaScript compilé (pattern)',
            'api/index.php' => 'Point d\'entrée API',
            'api/.htaccess' => 'Configuration API',
            'api/config/env.php' => 'Configuration environnement'
        ];

        foreach ($required_files as $file => $description) {
            echo "<p>$description ($file): ";
            if (strpos($file, 'PHASH') !== false) {
                // Recherche de fichier avec pattern
                $pattern = str_replace('PHASH', '*', $file);
                $found_files = glob($pattern);
                if (!empty($found_files)) {
                    echo "<span class='success'>✓ Présent</span> (" . implode(', ', $found_files) . ")";
                } else {
                    echo "<span class='error'>✗ Manquant</span>";
                }
            } else if (file_exists($file)) {
                echo "<span class='success'>✓ Présent</span>";
            } else {
                echo "<span class='error'>✗ Manquant</span>";
            }
            echo "</p>";
        }
        ?>
    </div>

    <div class="section">
        <h2>2. Structure du répertoire</h2>
        <?php
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
    </div>

    <div class="section">
        <h2>3. Contenu de index.html</h2>
        <pre><?php 
        if (file_exists('./index.html')) {
            echo htmlspecialchars(file_get_contents('./index.html')); 
        } else {
            echo "<span class='error'>Fichier non trouvé</span>";
        }
        ?></pre>
    </div>

    <div class="section">
        <h2>4. Test de chargement JavaScript</h2>
        <div id="js-test">Si JavaScript fonctionne, ce texte sera remplacé.</div>
        <script>
            document.getElementById('js-test').textContent = 'JavaScript fonctionne correctement!';
            document.getElementById('js-test').style.color = 'green';
        </script>
    </div>

    <div class="section">
        <h2>5. Test d'accès à l'API</h2>
        <?php
        $api_endpoints = [
            '/api/test.php' => 'Test endpoint'
        ];

        foreach ($api_endpoints as $endpoint => $description) {
            echo "<p>Test $description ($endpoint): ";
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $endpoint);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            $result = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode >= 200 && $httpCode < 300) {
                echo "<span class='success'>✓ OK (Code $httpCode)</span>";
                echo "<pre>" . htmlspecialchars(substr($result, 0, 200)) . (strlen($result) > 200 ? '...' : '') . "</pre>";
            } else {
                echo "<span class='error'>✗ Erreur (Code $httpCode)</span>";
            }
            echo "</p>";
        }
        ?>
    </div>
</body>
</html>
