
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des Types MIME</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Vérification des Types MIME et des Fichiers JavaScript</h1>
    
    <h2>Test de chargement JavaScript direct</h2>
    <div id="js-test">Test de chargement JS...</div>
    
    <script>
        document.getElementById('js-test').textContent = 'JavaScript basique fonctionne correctement!';
        document.getElementById('js-test').style.color = 'green';
    </script>
    
    <h2>Test de chargement module ES</h2>
    <div id="module-test">Test de chargement de module ES...</div>
    
    <script type="module">
        document.getElementById('module-test').textContent = 'Les modules ES fonctionnent correctement!';
        document.getElementById('module-test').style.color = 'green';
    </script>
    
    <h2>Liste des fichiers JavaScript dans le dossier assets</h2>
    <?php
    $js_files = glob('assets/*.js');
    if (!empty($js_files)) {
        echo '<ul>';
        foreach ($js_files as $file) {
            $mime = mime_content_type($file);
            $color_class = ($mime === 'application/javascript' || $mime === 'text/javascript') ? 'success' : 'error';
            echo '<li>' . basename($file) . ' - Type MIME: <span class="' . $color_class . '">' . $mime . '</span></li>';
        }
        echo '</ul>';
    } else {
        echo '<p class="error">Aucun fichier JavaScript trouvé dans le dossier assets.</p>';
    }
    ?>
    
    <h2>Information server</h2>
    <pre><?php print_r($_SERVER); ?></pre>
    
    <h2>Test de l'en-tête Content-Type</h2>
    <?php
    echo '<p>Pour tester les en-têtes HTTP des fichiers JavaScript:</p>';
    echo '<ul>';
    foreach ($js_files as $file) {
        $url = 'http://' . $_SERVER['HTTP_HOST'] . '/' . $file;
        echo '<li><a href="' . $url . '" target="_blank">' . basename($file) . '</a> - <a href="#" onclick="testContentType(\'' . $url . '\')">Tester l\'en-tête Content-Type</a></li>';
    }
    echo '</ul>';
    ?>
    
    <div id="content-type-result"></div>
    
    <script>
    function testContentType(url) {
        const resultDiv = document.getElementById('content-type-result');
        resultDiv.innerHTML = 'Vérification de l\'en-tête pour ' + url + '...';
        
        fetch(url)
            .then(response => {
                const contentType = response.headers.get('content-type');
                resultDiv.innerHTML = `<p>URL: ${url}<br>Content-Type: <span class="${contentType.includes('javascript') ? 'success' : 'error'}">${contentType}</span></p>`;
            })
            .catch(error => {
                resultDiv.innerHTML = `<p class="error">Erreur lors de la vérification de ${url}: ${error.message}</p>`;
            });
            
        return false;
    }
    </script>
</body>
</html>
