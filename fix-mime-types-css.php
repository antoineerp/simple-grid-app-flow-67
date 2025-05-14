
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>CSS MIME Type Fix</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .section { margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
        .fix-button { padding: 10px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Correcteur de types MIME pour CSS</h1>
    
    <div class="section">
        <h2>Test de type MIME CSS</h2>
        <?php
        // Tester un fichier CSS pour déterminer son type MIME
        $cssFiles = glob("assets/*.css");
        
        if (empty($cssFiles)) {
            echo "<p><span class='warning'>Aucun fichier CSS trouvé dans le dossier assets</span></p>";
            
            // Essayer de trouver les CSS dans d'autres emplacements possibles
            $altLocations = [
                'dist/assets/*.css',
                '*.css'
            ];
            
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
                foreach ($headers as $name => $value) {
                    if (is_string($name)) {
                        echo "$name: ";
                        if (is_array($value)) {
                            echo implode(', ', $value);
                        } else {
                            echo $value;
                        }
                        echo "\n";
                    }
                }
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
        <h2>Application de la correction</h2>
        <?php
        if (isset($_POST['fix_css'])) {
            // Vérifier si le module mod_headers est chargé
            $modHeadersLoaded = function_exists('apache_get_modules') && in_array('mod_headers', apache_get_modules());
            
            // Mettre à jour le fichier .htaccess dans le dossier assets
            $htaccessContent = "# Activer le moteur de réécriture
RewriteEngine On

# Configuration des types MIME
AddType application/javascript .js
AddType application/javascript .mjs
AddType text/css .css

# Forcer explicitement le type MIME pour CSS
<FilesMatch \"\.css$\">
    ForceType text/css
    Header set Content-Type \"text/css; charset=utf-8\"
</FilesMatch>

<FilesMatch \"\.js$\">
    ForceType application/javascript
    Header set Content-Type \"application/javascript; charset=utf-8\"
</FilesMatch>

# En-têtes de cache pour les assets
<FilesMatch \"\.(js|mjs|css)$\">
    Header set Cache-Control \"max-age=31536000, public\"
</FilesMatch>

# Autoriser l'accès aux fichiers
<Files *>
    Order Allow,Deny
    Allow from all
</Files>
";
            
            if (file_put_contents('assets/.htaccess', $htaccessContent) !== false) {
                echo "<p><span class='success'>Le fichier .htaccess dans le dossier assets a été mis à jour avec succès!</span></p>";
            } else {
                echo "<p><span class='error'>Impossible de mettre à jour le fichier .htaccess dans le dossier assets</span></p>";
            }
            
            // Mettre à jour également le .htaccess racine
            $rootHtaccessPath = '.htaccess';
            if (file_exists($rootHtaccessPath)) {
                $rootHtaccess = file_get_contents($rootHtaccessPath);
                
                // Ajouter la configuration MIME type si elle n'existe pas déjà
                if (strpos($rootHtaccess, 'ForceType text/css') === false) {
                    $mimeConfig = "\n# Forcer explicitement le type MIME pour CSS
<FilesMatch \"\.css$\">
    ForceType text/css
    Header set Content-Type \"text/css; charset=utf-8\"
</FilesMatch>\n";
                    
                    // Insérer après la section des types MIME
                    $pattern = '/AddType text\/css \.css/';
                    if (preg_match($pattern, $rootHtaccess)) {
                        $rootHtaccess = preg_replace($pattern, "AddType text/css .css\n$mimeConfig", $rootHtaccess);
                    } else {
                        // Si la déclaration n'existe pas, l'ajouter au début
                        $rootHtaccess = "AddType text/css .css\n$mimeConfig\n" . $rootHtaccess;
                    }
                    
                    if (file_put_contents($rootHtaccessPath, $rootHtaccess) !== false) {
                        echo "<p><span class='success'>Le fichier .htaccess racine a été mis à jour avec succès!</span></p>";
                    } else {
                        echo "<p><span class='error'>Impossible de mettre à jour le fichier .htaccess racine</span></p>";
                    }
                } else {
                    echo "<p><span class='success'>Le fichier .htaccess racine contient déjà la configuration MIME pour CSS</span></p>";
                }
            }
            
            echo "<p>Veuillez vider le cache de votre navigateur et rafraîchir la page pour voir les changements.</p>";
        }
        ?>
        
        <form method="post">
            <p>Cette correction va mettre à jour les fichiers .htaccess pour assurer que les fichiers CSS sont servis avec le bon type MIME.</p>
            <button type="submit" name="fix_css" class="fix-button">Appliquer la correction</button>
        </form>
    </div>
    
    <div class="section">
        <h2>Test de CSS</h2>
        <p>Élément stylisé en CSS interne:</p>
        <div id="css-test" style="padding: 10px; background-color: #e0f7fa; border: 1px solid #4fc3f7; margin: 10px 0;">
            Test de CSS interne
        </div>
        
        <p>Test de CSS externe:</p>
        <style>
            #external-css-test {
                padding: 10px;
                background-color: #f1f8e9;
                border: 1px solid #8bc34a;
                margin: 10px 0;
            }
        </style>
        <div id="external-css-test">
            Si vous voyez ce bloc avec un fond vert clair, le CSS interne fonctionne correctement.
        </div>
        
        <link rel="stylesheet" href="/assets/test-style.css" id="test-css">
        <div id="test-css-element">
            Ce texte devrait être stylisé si le fichier CSS externe est correctement chargé.
        </div>
        
        <script>
            // Créer un fichier CSS de test s'il n'existe pas déjà
            window.addEventListener('DOMContentLoaded', function() {
                fetch('/assets/test-style.css')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('CSS file not found, creating one');
                        }
                    })
                    .catch(() => {
                        // Créer le fichier CSS via AJAX
                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', 'create-test-css.php', true);
                        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                        xhr.send('create_css=1');
                        
                        // Après 1 seconde, essayer de recharger le CSS
                        setTimeout(function() {
                            const link = document.getElementById('test-css');
                            link.href = '/assets/test-style.css?t=' + new Date().getTime();
                        }, 1000);
                    });
            });
        </script>
    </div>
    
    <div class="section">
        <h2>Conseils supplémentaires</h2>
        <ol>
            <li>Si la modification du .htaccess ne résout pas le problème, vérifiez si le module <code>mod_headers</code> est activé sur votre serveur Apache.</li>
            <li>Assurez-vous que votre serveur web a les permissions pour définir les en-têtes HTTP.</li>
            <li>Si vous utilisez un CDN ou un proxy, vérifiez qu'il ne modifie pas les en-têtes Content-Type.</li>
            <li>Essayez de reconstruire votre application React avec <code>npm run build</code> puis redéployez.</li>
            <li>Vérifiez les logs d'erreur de votre serveur web pour plus d'informations sur d'éventuelles erreurs.</li>
        </ol>
    </div>
</body>
</html>
