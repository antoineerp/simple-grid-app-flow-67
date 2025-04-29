
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification du Déploiement</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Vérification du Déploiement</h1>
    
    <h2>1. Informations PHP</h2>
    <p>PHP Version: <?php echo phpversion(); ?></p>
    <p>PHP Handler: <?php echo php_sapi_name(); ?></p>
    <p>Document Root: <?php echo $_SERVER['DOCUMENT_ROOT']; ?></p>
    
    <h2>2. Vérification des chemins critiques</h2>
    <?php
    $paths_to_check = [
        './.htaccess' => 'Fichier .htaccess racine',
        './api/.htaccess' => 'Fichier .htaccess API',
        './api/index.php' => 'Point d\'entrée API',
        './api/test.php' => 'Fichier de test API',
        './index.html' => 'Page principale',
        './assets/' => 'Dossier des assets'
    ];
    
    foreach ($paths_to_check as $path => $description) {
        echo "<p>$description ($path): ";
        if (file_exists($path)) {
            echo "<span class='success'>EXIST</span>";
            
            if (is_file($path)) {
                echo " (" . filesize($path) . " bytes)";
            } elseif (is_dir($path)) {
                $files = scandir($path);
                $file_count = count($files) - 2; // Minus . and ..
                echo " ($file_count files/directories)";
            }
        } else {
            echo "<span class='error'>MISSING</span>";
        }
        echo "</p>";
    }
    ?>
    
    <h2>3. Test d'exécution PHP</h2>
    <?php
    $test_url = 'http://' . $_SERVER['HTTP_HOST'] . '/api/test.php';
    
    echo "<p>Testing: $test_url</p>";
    
    $ch = curl_init($test_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, false);
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($status == 200) {
        echo "<p>Status: <span class='success'>OK ($status)</span></p>";
        echo "<pre>" . htmlspecialchars($response) . "</pre>";
        
        $data = json_decode($response, true);
        if ($data) {
            echo "<p>JSON Valid: <span class='success'>YES</span></p>";
            echo "<p>PHP Version from API: " . ($data['php_version'] ?? 'Not provided') . "</p>";
            echo "<p>Message: " . ($data['message'] ?? 'None') . "</p>";
        } else {
            echo "<p>JSON Valid: <span class='error'>NO</span></p>";
        }
    } else {
        echo "<p>Status: <span class='error'>ERROR ($status)</span></p>";
        echo "<pre>Connection failed or invalid response.</pre>";
    }
    ?>
    
    <h2>4. Vérification des assets</h2>
    <?php
    $asset_dirs = ['./assets', './dist/assets'];
    $js_found = false;
    $css_found = false;
    
    foreach ($asset_dirs as $dir) {
        if (is_dir($dir)) {
            echo "<p>Dossier $dir: <span class='success'>EXISTE</span></p>";
            
            $js_files = glob("$dir/*.js");
            if (!empty($js_files)) {
                echo "<p>Fichiers JS dans $dir: <span class='success'>" . count($js_files) . " trouvés</span></p>";
                echo "<ul>";
                foreach (array_slice($js_files, 0, 5) as $file) {
                    echo "<li>" . basename($file) . " (" . filesize($file) . " bytes)</li>";
                }
                if (count($js_files) > 5) {
                    echo "<li>... et " . (count($js_files) - 5) . " autres</li>";
                }
                echo "</ul>";
                $js_found = true;
            }
            
            $css_files = glob("$dir/*.css");
            if (!empty($css_files)) {
                echo "<p>Fichiers CSS dans $dir: <span class='success'>" . count($css_files) . " trouvés</span></p>";
                echo "<ul>";
                foreach (array_slice($css_files, 0, 5) as $file) {
                    echo "<li>" . basename($file) . " (" . filesize($file) . " bytes)</li>";
                }
                if (count($css_files) > 5) {
                    echo "<li>... et " . (count($css_files) - 5) . " autres</li>";
                }
                echo "</ul>";
                $css_found = true;
            }
        } else {
            echo "<p>Dossier $dir: <span class='error'>MANQUANT</span></p>";
        }
    }
    
    if (!$js_found) {
        echo "<p><span class='error'>AUCUN FICHIER JS TROUVÉ</span></p>";
    }
    
    if (!$css_found) {
        echo "<p><span class='error'>AUCUN FICHIER CSS TROUVÉ</span></p>";
    }
    ?>
    
    <p><a href="/">Retour à l'accueil</a> | <a href="/api/phpinfo.php">PHP Info</a></p>
</body>
</html>
