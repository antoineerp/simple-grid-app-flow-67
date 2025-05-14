
<?php
header('Content-Type: text/html; charset=utf-8');

function checkMimeTypes() {
    $results = [];
    
    // Vérifier la configuration actuelle du serveur
    $results['server_software'] = $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible';
    $results['document_root'] = $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible';
    
    // Vérifier si mod_mime est activé
    $mod_mime_active = function_exists('apache_get_modules') ? 
        in_array('mod_mime', apache_get_modules()) : 'Non détectable';
    $results['mod_mime'] = $mod_mime_active;
    
    // Vérification des fichiers .htaccess
    $root_htaccess = file_exists('.htaccess') ? file_get_contents('.htaccess') : false;
    $api_htaccess = file_exists('api/.htaccess') ? file_get_contents('api/.htaccess') : false;
    $assets_htaccess = file_exists('assets/.htaccess') ? file_get_contents('assets/.htaccess') : false;
    
    $results['htaccess_files'] = [
        'root' => $root_htaccess !== false,
        'api' => $api_htaccess !== false,
        'assets' => $assets_htaccess !== false
    ];
    
    // Vérifier les directives AddType
    if ($root_htaccess) {
        $has_css_type = preg_match('/AddType\s+text\/css\s+\.css/i', $root_htaccess);
        $has_force_type = preg_match('/ForceType\s+text\/css/i', $root_htaccess);
        $has_content_type_header = preg_match('/Header\s+set\s+Content-Type\s+[\'"]text\/css/i', $root_htaccess);
        
        $results['root_htaccess_config'] = [
            'has_css_type' => $has_css_type,
            'has_force_type' => $has_force_type,
            'has_content_type_header' => $has_content_type_header
        ];
    }
    
    // Test direct des fichiers CSS
    $test_url = 'http' . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 's' : '') . 
                '://' . $_SERVER['HTTP_HOST'] . '/assets/index.css';
    $headers = get_headers($test_url, 1);
    
    $results['css_test'] = [
        'url' => $test_url,
        'status' => $headers[0] ?? 'Non disponible',
        'content_type' => $headers['Content-Type'] ?? 'Non disponible'
    ];
    
    return $results;
}

function createAssetHtaccess() {
    $htaccess_content = <<<EOT
# Forcer le type MIME pour CSS et JavaScript
<IfModule mod_mime.c>
    AddType text/css .css
    AddType application/javascript .js
</IfModule>

# Définir explicitement le Content-Type via les en-têtes HTTP
<IfModule mod_headers.c>
    <FilesMatch "\.css$">
        ForceType text/css
        Header set Content-Type "text/css; charset=utf-8"
        Header set X-Content-Type-Options "nosniff"
    </FilesMatch>
    
    <FilesMatch "\.js$">
        ForceType application/javascript
        Header set Content-Type "application/javascript; charset=utf-8"
        Header set X-Content-Type-Options "nosniff"
    </FilesMatch>
</IfModule>

# Empêcher la mise en cache lors du débogage
<IfModule mod_headers.c>
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</IfModule>
EOT;

    $directory = 'assets';
    if (!is_dir($directory)) {
        mkdir($directory, 0755, true);
    }
    
    return file_put_contents('assets/.htaccess', $htaccess_content);
}

function updateRootHtaccess() {
    if (!file_exists('.htaccess')) {
        return false;
    }
    
    $htaccess = file_get_contents('.htaccess');
    $mime_section = <<<EOT
    
# Définir explicitement le type MIME pour CSS
<FilesMatch "\.css$">
    ForceType text/css
    Header set Content-Type "text/css; charset=utf-8"
    Header set X-Content-Type-Options "nosniff"
</FilesMatch>

# Définir explicitement le type MIME pour JavaScript
<FilesMatch "\.js$">
    ForceType application/javascript
    Header set Content-Type "application/javascript; charset=utf-8"
    Header set X-Content-Type-Options "nosniff"
</FilesMatch>

EOT;
    
    // Ne pas ajouter si les directives existent déjà
    if (strpos($htaccess, 'ForceType text/css') === false) {
        // Insérer après les directives AddType si elles existent
        if (preg_match('/AddType\s+text\/css\s+\.css/i', $htaccess)) {
            $htaccess = preg_replace('/(AddType\s+text\/css\s+\.css.*?)(\n|\r\n)/', '$1$2' . $mime_section, $htaccess);
        } else {
            // Sinon ajouter au début du fichier
            $htaccess = $mime_section . $htaccess;
        }
        
        return file_put_contents('.htaccess', $htaccess);
    }
    
    return true;
}

function testCssAccess() {
    $css_url = '/assets/index.css';
    $full_url = 'http' . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 's' : '') . 
                '://' . $_SERVER['HTTP_HOST'] . $css_url;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $full_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HEADER, 1);
    curl_setopt($ch, CURLOPT_NOBODY, 1);
    $headers = curl_exec($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);
    
    return [
        'url' => $full_url,
        'status_code' => $info['http_code'],
        'content_type' => $info['content_type'],
        'headers' => $headers
    ];
}

// Traiter les actions
$message = '';
$status = '';
$action_taken = false;
$diagnostic_results = checkMimeTypes();
$test_results = null;

if (isset($_POST['fix_css_mime'])) {
    $action_taken = true;
    
    // Créer un .htaccess dans le répertoire assets
    $assets_htaccess_result = createAssetHtaccess();
    
    // Mettre à jour le .htaccess de la racine
    $root_htaccess_result = updateRootHtaccess();
    
    if ($assets_htaccess_result && $root_htaccess_result) {
        $status = 'success';
        $message = 'Les fichiers .htaccess ont été mis à jour pour corriger les types MIME CSS et JavaScript.';
    } else {
        $status = 'error';
        $message = 'Problème lors de la mise à jour des fichiers .htaccess. Vérifiez les permissions.';
    }
    
    // Tester à nouveau après les modifications
    $test_results = testCssAccess();
    
    // Actualiser les résultats du diagnostic
    $diagnostic_results = checkMimeTypes();
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction du type MIME CSS</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 1000px; margin: 0 auto; }
        .header { background-color: #4a6da7; color: white; padding: 1rem; border-radius: 5px; }
        .section { background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background-color: #f8f8f8; padding: 10px; border-radius: 5px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
        th { background-color: #f2f2f2; }
        .btn { display: inline-block; padding: 10px 15px; background: #4a6da7; color: white; text-decoration: none; border-radius: 4px; border: none; cursor: pointer; }
        .btn:hover { background: #3a5d97; }
        .test-box { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; }
    </style>
    <script>
        // Script pour tester si le CSS peut être chargé
        window.onload = function() {
            // Créer un élément link pour tester le chargement CSS
            var linkTest = document.createElement('link');
            linkTest.rel = 'stylesheet';
            linkTest.href = '/assets/test-style.css?t=' + new Date().getTime();
            
            // Afficher le résultat du test
            linkTest.onload = function() {
                document.getElementById('css-test-result').innerHTML = '<span class="success">Le CSS a été chargé avec succès!</span>';
            };
            
            linkTest.onerror = function() {
                document.getElementById('css-test-result').innerHTML = '<span class="error">Échec du chargement du CSS! Le problème de type MIME persiste.</span>';
            };
            
            document.head.appendChild(linkTest);
            
            // Créer un CSS de test si nécessaire
            var testCss = `.css-test-element { color: blue; background-color: #e0f7fa; padding: 15px; border: 2px solid #4fc3f7; border-radius: 5px; margin-top: 10px; }`;
            var styleTest = document.createElement('style');
            styleTest.innerHTML = testCss;
            document.head.appendChild(styleTest);
        }
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Diagnostic et Correction des Types MIME CSS</h1>
        </div>
        
        <?php if ($message): ?>
        <div class="section">
            <p class="<?php echo $status; ?>"><?php echo $message; ?></p>
            <?php if ($status === 'success'): ?>
            <p>Veuillez vider le cache de votre navigateur et actualiser la page principale de l'application.</p>
            <?php endif; ?>
        </div>
        <?php endif; ?>
        
        <div class="section">
            <h2>Diagnostic du Problème</h2>
            <p>Le problème que vous rencontrez est que les fichiers CSS sont servis avec le mauvais type MIME (<code>text/html</code> au lieu de <code>text/css</code>), ce qui fait que le navigateur refuse de les charger.</p>
            
            <h3>Détails du Serveur</h3>
            <table>
                <tr>
                    <th>Logiciel Serveur</th>
                    <td><?php echo $diagnostic_results['server_software']; ?></td>
                </tr>
                <tr>
                    <th>Document Root</th>
                    <td><?php echo $diagnostic_results['document_root']; ?></td>
                </tr>
                <tr>
                    <th>mod_mime Actif</th>
                    <td><?php echo is_string($diagnostic_results['mod_mime']) ? $diagnostic_results['mod_mime'] : ($diagnostic_results['mod_mime'] ? 'Oui' : 'Non'); ?></td>
                </tr>
            </table>
            
            <h3>Fichiers .htaccess</h3>
            <table>
                <tr>
                    <th>Racine (.htaccess)</th>
                    <td class="<?php echo $diagnostic_results['htaccess_files']['root'] ? 'success' : 'error'; ?>">
                        <?php echo $diagnostic_results['htaccess_files']['root'] ? 'Existe' : 'Manquant'; ?>
                    </td>
                </tr>
                <tr>
                    <th>API (api/.htaccess)</th>
                    <td class="<?php echo $diagnostic_results['htaccess_files']['api'] ? 'success' : 'error'; ?>">
                        <?php echo $diagnostic_results['htaccess_files']['api'] ? 'Existe' : 'Manquant'; ?>
                    </td>
                </tr>
                <tr>
                    <th>Assets (assets/.htaccess)</th>
                    <td class="<?php echo $diagnostic_results['htaccess_files']['assets'] ? 'success' : 'error'; ?>">
                        <?php echo $diagnostic_results['htaccess_files']['assets'] ? 'Existe' : 'Manquant'; ?>
                    </td>
                </tr>
            </table>
            
            <?php if (isset($diagnostic_results['root_htaccess_config'])): ?>
            <h3>Configuration du .htaccess Principal</h3>
            <table>
                <tr>
                    <th>AddType pour CSS</th>
                    <td class="<?php echo $diagnostic_results['root_htaccess_config']['has_css_type'] ? 'success' : 'warning'; ?>">
                        <?php echo $diagnostic_results['root_htaccess_config']['has_css_type'] ? 'Présent' : 'Manquant'; ?>
                    </td>
                </tr>
                <tr>
                    <th>ForceType pour CSS</th>
                    <td class="<?php echo $diagnostic_results['root_htaccess_config']['has_force_type'] ? 'success' : 'warning'; ?>">
                        <?php echo $diagnostic_results['root_htaccess_config']['has_force_type'] ? 'Présent' : 'Manquant'; ?>
                    </td>
                </tr>
                <tr>
                    <th>Header Content-Type pour CSS</th>
                    <td class="<?php echo $diagnostic_results['root_htaccess_config']['has_content_type_header'] ? 'success' : 'warning'; ?>">
                        <?php echo $diagnostic_results['root_htaccess_config']['has_content_type_header'] ? 'Présent' : 'Manquant'; ?>
                    </td>
                </tr>
            </table>
            <?php endif; ?>
            
            <h3>Test d'Accès CSS</h3>
            <table>
                <tr>
                    <th>URL Testée</th>
                    <td><?php echo $diagnostic_results['css_test']['url']; ?></td>
                </tr>
                <tr>
                    <th>Status</th>
                    <td><?php echo $diagnostic_results['css_test']['status']; ?></td>
                </tr>
                <tr>
                    <th>Content-Type</th>
                    <td class="<?php echo (strpos($diagnostic_results['css_test']['content_type'], 'text/css') !== false) ? 'success' : 'error'; ?>">
                        <?php echo $diagnostic_results['css_test']['content_type']; ?>
                    </td>
                </tr>
            </table>
        </div>
        
        <?php if ($test_results): ?>
        <div class="section">
            <h2>Résultats du Test Après Correction</h2>
            <table>
                <tr>
                    <th>URL Testée</th>
                    <td><?php echo $test_results['url']; ?></td>
                </tr>
                <tr>
                    <th>Code Status</th>
                    <td><?php echo $test_results['status_code']; ?></td>
                </tr>
                <tr>
                    <th>Content-Type</th>
                    <td class="<?php echo (strpos($test_results['content_type'], 'text/css') !== false) ? 'success' : 'error'; ?>">
                        <?php echo $test_results['content_type']; ?>
                    </td>
                </tr>
            </table>
            
            <h3>En-têtes HTTP Détaillés</h3>
            <pre><?php echo $test_results['headers']; ?></pre>
        </div>
        <?php endif; ?>
        
        <div class="section">
            <h2>Test de Chargement CSS</h2>
            <div id="css-test-result">Test de chargement CSS en cours...</div>
            
            <div class="test-box css-test-element">
                Si ce texte apparaît avec un style particulier (fond bleu clair et bordure), le CSS a été correctement chargé.
            </div>
        </div>
        
        <div class="section">
            <h2>Appliquer la Correction</h2>
            <form method="post" action="">
                <p>Cette correction va créer ou mettre à jour les fichiers .htaccess nécessaires pour définir correctement les types MIME pour CSS et JavaScript.</p>
                <button type="submit" name="fix_css_mime" class="btn">Appliquer la Correction</button>
            </form>
        </div>
        
        <div class="section">
            <h2>Solutions Alternatives</h2>
            <p>Si la correction via .htaccess ne fonctionne pas, voici d'autres approches à essayer :</p>
            <ol>
                <li>Contactez votre hébergeur (Infomaniak) pour qu'ils vérifient la configuration du serveur et s'assurent que mod_mime et mod_headers sont activés.</li>
                <li>Modifiez vos références CSS dans index.html pour ajouter explicitement <code>type="text/css"</code> aux balises link.</li>
                <li>Renommez vos fichiers CSS avec une extension différente (par exemple .styles au lieu de .css) et mettez à jour vos références.</li>
                <li>Intégrez directement le CSS dans votre HTML via des balises &lt;style&gt; pour les styles critiques.</li>
            </ol>
        </div>
    </div>
</body>
</html>
