
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
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .section { margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Diagnostic des Types MIME</h1>
    
    <div class="section">
        <h2>Test de type MIME CSS</h2>
        <?php
        // Tester un fichier CSS pour déterminer son type MIME
        $cssFiles = glob("assets/*.css");
        
        if (empty($cssFiles)) {
            echo "<p><span class='warning'>Aucun fichier CSS trouvé dans le dossier assets</span></p>";
            
            // Essayer de trouver les CSS dans d'autres emplacements possibles
            $altLocations = ['dist/assets/*.css', '*.css'];
            
            foreach ($altLocations as $pattern) {
                $altFiles = glob($pattern);
                if (!empty($altFiles)) {
                    echo "<p>Fichiers CSS trouvés dans $pattern:</p><ul>";
                    foreach ($altFiles as $file) {
                        echo "<li>$file</li>";
                    }
                    echo "</ul>";
                    $cssFiles = $altFiles;
                    break;
                }
            }
        }
        
        if (!empty($cssFiles)) {
            echo "<h3>Vérification des types MIME:</h3><ul>";
            
            foreach ($cssFiles as $css) {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mime = finfo_file($finfo, $css);
                finfo_close($finfo);
                
                $status = ($mime === 'text/css') ? 'success' : 'error';
                echo "<li>$css: <span class='$status'>$mime</span></li>";
            }
            
            echo "</ul>";
            
            // Tester si le serveur web renvoie correctement les en-têtes
            $cssUrl = 'assets/' . basename($cssFiles[0]);
            echo "<h3>Test d'en-tête HTTP pour le premier fichier CSS:</h3>";
            echo "<p>URL testée: $cssUrl</p>";
            
            $headers = @get_headers($_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/' . $cssUrl, 1);
            
            if ($headers) {
                echo "<pre>";
                print_r($headers);
                echo "</pre>";
                
                $contentType = isset($headers['Content-Type']) ? $headers['Content-Type'] : 'Non défini';
                $status = (strpos($contentType, 'text/css') !== false) ? 'success' : 'error';
                echo "<p>Content-Type: <span class='$status'>$contentType</span></p>";
            } else {
                echo "<p><span class='error'>Impossible de récupérer les en-têtes HTTP</span></p>";
            }
        }
        ?>
    </div>

    <div class="section">
        <h2>Test de CSS</h2>
        <p>Élément stylisé en CSS interne:</p>
        <div style="padding: 10px; background-color: #e0f7fa; border: 1px solid #4fc3f7; margin: 10px 0;">
            Test de CSS interne
        </div>
        
        <p>Test de CSS externe:</p>
        <div id="test-css-element">
            Ce texte devrait être stylisé si le fichier CSS externe est correctement chargé.
        </div>
        
        <script>
            // Créer un élément link pour tester le chargement CSS
            function testCssLoading() {
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '/assets/test-style.css?t=' + new Date().getTime();
                
                link.onload = function() {
                    document.getElementById('css-status').innerHTML = '<span class="success">CSS chargé avec succès!</span>';
                };
                
                link.onerror = function() {
                    document.getElementById('css-status').innerHTML = '<span class="error">Échec du chargement CSS!</span>';
                };
                
                document.head.appendChild(link);
            }
            
            window.onload = testCssLoading;
        </script>
        
        <p>Statut du chargement CSS: <span id="css-status">Test en cours...</span></p>
    </div>
    
    <div class="section">
        <h2>Recommandations</h2>
        <ol>
            <li>Assurez-vous que le fichier .htaccess dans assets/ contient les bonnes directives pour les types MIME</li>
            <li>Vérifiez que le module mod_headers est activé sur votre serveur Apache</li>
            <li>Si nécessaire, contactez votre hébergeur pour qu'il confirme la configuration</li>
            <li>Vérifiez que vos fichiers CSS sont correctement placés dans le dossier assets/</li>
        </ol>
    </div>
</body>
</html>
