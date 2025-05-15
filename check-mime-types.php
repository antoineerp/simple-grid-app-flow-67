
<?php
header('Content-Type: text/html; charset=utf-8');

// Fonction pour vérifier les types MIME des fichiers
function checkMimeTypes($file_path, $expected_type) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime_type = finfo_file($finfo, $file_path);
    finfo_close($finfo);
    
    return [
        'path' => $file_path,
        'expected' => $expected_type,
        'actual' => $mime_type,
        'match' => ($mime_type === $expected_type)
    ];
}

// Tester un fichier CSS
$css_test = checkMimeTypes('assets/index.css', 'text/css');

// Tester un fichier JS
$js_test = [];
if (file_exists('assets/index.js')) {
    $js_test = checkMimeTypes('assets/index.js', 'application/javascript');
}

// Vérifier si les en-têtes HTTP sont correctement envoyés
function checkHttpHeaders($url) {
    $full_url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]/$url";
    $headers = get_headers($full_url, 1);
    return [
        'url' => $full_url,
        'status' => $headers[0] ?? 'N/A',
        'content_type' => $headers['Content-Type'] ?? 'N/A'
    ];
}

$css_headers = checkHttpHeaders('assets/index.css');

// Appliquer correctifs automatiques
$messages = [];
$success = false;

// Création du fichier .htaccess dans assets/
$assets_htaccess_content = <<<EOT
# Configuration des types MIME pour CSS et JavaScript
AddType text/css .css
AddType application/javascript .js

# Force le type MIME pour CSS avec le charset UTF-8
<FilesMatch "\.css$">
    ForceType text/css
    Header set Content-Type "text/css; charset=utf-8"
    Header set X-Content-Type-Options "nosniff"
</FilesMatch>

# Force le type MIME pour JavaScript avec le charset UTF-8
<FilesMatch "\.js$">
    ForceType application/javascript
    Header set Content-Type "application/javascript; charset=utf-8"
    Header set X-Content-Type-Options "nosniff"
</FilesMatch>

# Activer la mise en cache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 week"
  ExpiresByType application/javascript "access plus 1 week"
</IfModule>
EOT;

// Créer le répertoire assets/ s'il n'existe pas déjà
if (!is_dir('assets')) {
    mkdir('assets', 0755);
    $messages[] = "Dossier assets/ créé";
}

if (file_put_contents('assets/.htaccess', $assets_htaccess_content)) {
    $messages[] = "Fichier assets/.htaccess créé ou modifié avec succès";
    $success = true;
} else {
    $messages[] = "Impossible de créer ou modifier le fichier assets/.htaccess";
}

// Mise à jour du .htaccess principal
$root_htaccess = file_exists('.htaccess') ? file_get_contents('.htaccess') : '';
$mime_section = <<<EOT
# Configuration des types MIME
AddType text/css .css
AddType application/javascript .js
AddType application/javascript .mjs
AddType image/svg+xml .svg

# Force le type MIME pour CSS avec le charset UTF-8
<FilesMatch "\.css$">
    ForceType text/css
    Header set Content-Type "text/css; charset=utf-8"
</FilesMatch>

# Force le type MIME pour JavaScript avec le charset UTF-8
<FilesMatch "\.js$">
    ForceType application/javascript
    Header set Content-Type "application/javascript; charset=utf-8"
</FilesMatch>
EOT;

if (strpos($root_htaccess, 'ForceType text/css') === false) {
    // On ajoute la configuration MIME si elle n'existe pas déjà
    if (strpos($root_htaccess, 'AddType text/css .css') !== false) {
        // Remplacer la ligne existante
        $root_htaccess = preg_replace('/AddType text\/css \.css/', $mime_section, $root_htaccess);
    } else {
        // Ajouter après RewriteEngine On
        if (strpos($root_htaccess, 'RewriteEngine On') !== false) {
            $root_htaccess = str_replace('RewriteEngine On', "RewriteEngine On\n\n$mime_section", $root_htaccess);
        } else {
            // Ajouter au début du fichier
            $root_htaccess = "$mime_section\n\n$root_htaccess";
        }
    }
    
    if (file_put_contents('.htaccess', $root_htaccess)) {
        $messages[] = "Fichier .htaccess principal mis à jour avec succès";
        $success = true;
    } else {
        $messages[] = "Impossible de modifier le fichier .htaccess principal";
    }
} else {
    $messages[] = "Le fichier .htaccess principal contient déjà la configuration MIME nécessaire";
}

// Créer un fichier CSS de test
$test_css_content = <<<EOT
/* CSS de test pour vérifier le chargement des styles */
.test-css {
  color: blue;
  background-color: #e0f7fa;
  padding: 15px;
  border: 2px solid #4fc3f7;
  border-radius: 5px;
  margin-top: 10px;
}
EOT;

if (file_put_contents('assets/test-style.css', $test_css_content)) {
    $messages[] = "Fichier CSS de test créé";
} else {
    $messages[] = "Impossible de créer le fichier CSS de test";
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic des Types MIME</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .btn { display: inline-block; padding: 10px 15px; background-color: #4CAF50; color: white;
               text-decoration: none; border-radius: 4px; border: none; cursor: pointer; }
        .alert { padding: 15px; margin-bottom: 20px; border-radius: 4px; }
        .alert-success { background-color: #dff0d8; border: 1px solid #d6e9c6; color: #3c763d; }
        .alert-danger { background-color: #f2dede; border: 1px solid #ebccd1; color: #a94442; }
        .test-element { border: 1px solid #ddd; padding: 15px; margin-top: 20px; border-radius: 4px; }
    </style>
    <link rel="stylesheet" href="/assets/test-style.css">
</head>
<body>
    <div class="container">
        <h1>Diagnostic et Correction des Types MIME</h1>
        
        <?php if ($success): ?>
        <div class="alert alert-success">
            <strong>Corrections appliquées!</strong> Les fichiers de configuration ont été mis à jour pour résoudre le problème de type MIME.
        </div>
        <?php endif; ?>
        
        <div class="section">
            <h2>Résultats du diagnostic</h2>
            
            <h3>Test des types MIME locaux</h3>
            <table>
                <tr>
                    <th>Fichier</th>
                    <th>Type MIME attendu</th>
                    <th>Type MIME actuel</th>
                    <th>Statut</th>
                </tr>
                <tr>
                    <td><?php echo $css_test['path']; ?></td>
                    <td><?php echo $css_test['expected']; ?></td>
                    <td><?php echo $css_test['actual']; ?></td>
                    <td class="<?php echo $css_test['match'] ? 'success' : 'error'; ?>">
                        <?php echo $css_test['match'] ? 'OK' : 'ERREUR'; ?>
                    </td>
                </tr>
                <?php if (!empty($js_test)): ?>
                <tr>
                    <td><?php echo $js_test['path']; ?></td>
                    <td><?php echo $js_test['expected']; ?></td>
                    <td><?php echo $js_test['actual']; ?></td>
                    <td class="<?php echo $js_test['match'] ? 'success' : 'error'; ?>">
                        <?php echo $js_test['match'] ? 'OK' : 'ERREUR'; ?>
                    </td>
                </tr>
                <?php endif; ?>
            </table>
            
            <h3>Test des en-têtes HTTP</h3>
            <table>
                <tr>
                    <th>URL</th>
                    <th>Statut</th>
                    <th>Content-Type</th>
                </tr>
                <tr>
                    <td><?php echo $css_headers['url']; ?></td>
                    <td><?php echo $css_headers['status']; ?></td>
                    <td class="<?php echo strpos($css_headers['content_type'], 'text/css') !== false ? 'success' : 'error'; ?>">
                        <?php echo $css_headers['content_type']; ?>
                    </td>
                </tr>
            </table>
        </div>
        
        <div class="section">
            <h2>Actions effectuées</h2>
            <ul>
                <?php foreach ($messages as $message): ?>
                <li><?php echo $message; ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
        
        <div class="section">
            <h2>Test de chargement CSS</h2>
            <p>L'élément ci-dessous devrait avoir un style bleu si le CSS est correctement chargé:</p>
            <div class="test-css">
                Ce texte devrait avoir un style spécial si le CSS est correctement chargé.
            </div>
            
            <h3>Test avec JavaScript</h3>
            <div id="js-test">Test de chargement JavaScript en cours...</div>
            
            <script>
                document.getElementById('js-test').textContent = "JavaScript fonctionne correctement!";
                document.getElementById('js-test').style.color = "green";
            </script>
        </div>
        
        <div class="section">
            <h2>Que faire maintenant?</h2>
            <p>Les correctifs ont été appliqués. Pour vérifier si le problème est résolu:</p>
            <ol>
                <li>Videz le cache de votre navigateur (Ctrl+F5 ou Cmd+Shift+R)</li>
                <li>Rechargez la page principale de votre application</li>
                <li>Vérifiez si les styles CSS sont correctement appliqués</li>
                <li>Si le problème persiste, essayez les actions suivantes:</li>
            </ol>
            
            <p><a href="/" class="btn">Retourner à la page principale</a></p>
            <p><a href="/fix-mime-types-css.php" class="btn">Utiliser l'outil de correction avancé</a></p>
        </div>
    </div>
</body>
</html>
