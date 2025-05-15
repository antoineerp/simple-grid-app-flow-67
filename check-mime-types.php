
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des types MIME</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Diagnostic des types MIME</h1>
    
    <h2>Configuration du serveur</h2>
    <pre><?php print_r($_SERVER); ?></pre>
    
    <h2>Test des types MIME</h2>
    <table>
        <tr>
            <th>Fichier</th>
            <th>Type MIME</th>
            <th>Status</th>
        </tr>
        <?php
        $files_to_check = [
            'assets/index.css' => 'text/css',
            'assets/index.js' => 'application/javascript',
            'src/main.tsx' => 'application/javascript'
        ];
        
        foreach ($files_to_check as $file => $expected_mime) {
            if (file_exists($file)) {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mime = finfo_file($finfo, $file);
                finfo_close($finfo);
                
                $status = ($mime === $expected_mime) ? '<span class="success">OK</span>' : '<span class="error">INCORRECT (' . $mime . ')</span>';
                
                echo "<tr><td>$file</td><td>$mime</td><td>$status</td></tr>";
            } else {
                echo "<tr><td>$file</td><td colspan='2'><span class='error'>Fichier introuvable</span></td></tr>";
            }
        }
        ?>
    </table>
    
    <h2>Test d'En-têtes HTTP</h2>
    <?php
    $test_url = 'http' . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 's' : '') . 
                '://' . $_SERVER['HTTP_HOST'] . '/assets/index.css';
    $headers = @get_headers($test_url, 1);
    
    if ($headers) {
        echo "<h3>En-têtes pour $test_url</h3>";
        echo "<pre>";
        print_r($headers);
        echo "</pre>";
        
        $content_type = isset($headers['Content-Type']) ? $headers['Content-Type'] : 'Non défini';
        $status = (strpos($content_type, 'text/css') !== false) ? 'success' : 'error';
        echo "<p>Content-Type: <span class='$status'>$content_type</span></p>";
    } else {
        echo "<p><span class='error'>Impossible de récupérer les en-têtes HTTP</span></p>";
    }
    ?>
    
    <h2>Actions correctives</h2>
    <p>Si les types MIME sont incorrects:</p>
    <ol>
        <li>Vérifiez que la directive <code>AddType</code> est active dans votre .htaccess</li>
        <li>Assurez-vous que le serveur Apache a le module <code>mod_mime</code> activé</li>
        <li>Utilisez <code>ForceType</code> dans un bloc <code>&lt;FilesMatch&gt;</code> pour forcer le type MIME</li>
        <li>Ajoutez explicitement l'attribut <code>type="text/css"</code> aux balises link et <code>type="module"</code> aux scripts</li>
    </ol>
</body>
</html>
