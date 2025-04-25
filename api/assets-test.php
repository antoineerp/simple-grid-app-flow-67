
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test de Chargement des Assets</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .button { background: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Test de Chargement des Assets</h1>
    
    <div class="section">
        <h2>1. Analyse des Assets Disponibles</h2>
        <?php
        $root_path = $_SERVER['DOCUMENT_ROOT'];
        $assets_path = $root_path . '/assets';
        
        echo "<p>Chemin racine: $root_path</p>";
        echo "<p>Chemin assets: $assets_path</p>";
        
        if (is_dir($assets_path)) {
            echo "<p class='success'>Le répertoire assets existe!</p>";
            
            // Lister les fichiers JS
            $js_files = glob($assets_path . '/*.js');
            echo "<h3>Fichiers JavaScript:</h3>";
            if (!empty($js_files)) {
                echo "<ul>";
                foreach ($js_files as $file) {
                    $filename = basename($file);
                    $size = filesize($file);
                    $readable = is_readable($file) ? "Lisible" : "Non lisible";
                    echo "<li>$filename - $size octets - <span class='" . (is_readable($file) ? "success" : "error") . "'>$readable</span></li>";
                }
                echo "</ul>";
            } else {
                echo "<p class='error'>Aucun fichier JavaScript trouvé!</p>";
            }
            
            // Lister les fichiers CSS
            $css_files = glob($assets_path . '/*.css');
            echo "<h3>Fichiers CSS:</h3>";
            if (!empty($css_files)) {
                echo "<ul>";
                foreach ($css_files as $file) {
                    $filename = basename($file);
                    $size = filesize($file);
                    $readable = is_readable($file) ? "Lisible" : "Non lisible";
                    echo "<li>$filename - $size octets - <span class='" . (is_readable($file) ? "success" : "error") . "'>$readable</span></li>";
                }
                echo "</ul>";
            } else {
                echo "<p class='error'>Aucun fichier CSS trouvé!</p>";
            }
        } else {
            echo "<p class='error'>Le répertoire assets n'existe pas!</p>";
        }
        ?>
    </div>

    <div class="section">
        <h2>2. Test de Chargement JavaScript</h2>
        <div id="js-test">Test JavaScript en cours...</div>
        
        <?php
        if (!empty($js_files)) {
            $main_js = basename($js_files[0]);
            echo "<p>Tentative de chargement de: $main_js</p>";
            echo "<script src='/assets/$main_js'></script>";
        }
        ?>
        
        <script>
            document.getElementById('js-test').innerHTML = "✓ JavaScript fonctionne correctement!";
            document.getElementById('js-test').className = "success";
            
            // Tester le chargement d'un asset via fetch
            async function testFetch() {
                try {
                    const response = await fetch('/api/cors-test.php');
                    const data = await response.json();
                    document.getElementById('fetch-result').innerHTML = 
                        "✓ Requête fetch réussie!<pre>" + JSON.stringify(data, null, 2) + "</pre>";
                    document.getElementById('fetch-result').className = "success";
                } catch (error) {
                    document.getElementById('fetch-result').innerHTML = 
                        "✗ Erreur fetch: " + error.message;
                    document.getElementById('fetch-result').className = "error";
                }
            }
        </script>
    </div>
    
    <div class="section">
        <h2>3. Test CORS & API</h2>
        <button class="button" onclick="testFetch()">Tester CORS & API</button>
        <div id="fetch-result">Cliquez sur le bouton pour tester...</div>
    </div>
    
    <div class="section">
        <h2>4. Informations Serveur</h2>
        <p>User Agent: <?= $_SERVER['HTTP_USER_AGENT'] ?></p>
        <p>Server Software: <?= $_SERVER['SERVER_SOFTWARE'] ?></p>
        <p>PHP Version: <?= phpversion() ?></p>
        <p>Document Root: <?= $_SERVER['DOCUMENT_ROOT'] ?></p>
        <p>Request URI: <?= $_SERVER['REQUEST_URI'] ?></p>
    </div>
</body>
</html>
