
<?php
// Script de test pour vérifier le bon chemin Infomaniak
header('Content-Type: text/html; charset=UTF-8');

// Chemin spécifique pour le client Infomaniak
$client_path = '/home/clients/df8dceff557ccc0605d45e1581aa661b';
$site_path = $client_path . '/sites/qualiopi.ch';

// Fonction pour tester et afficher un résultat
function test_path($path, $description) {
    echo "<p>Test: <strong>$description</strong> ($path): ";
    if (file_exists($path)) {
        echo "<span style='color: green'>EXISTE</span>";
        if (is_dir($path)) {
            echo " (dossier)";
            // Liste du contenu du dossier
            $files = scandir($path);
            echo "<ul>";
            foreach ($files as $file) {
                if ($file != '.' && $file != '..') {
                    echo "<li>$file</li>";
                }
            }
            echo "</ul>";
        } else {
            echo " (fichier)";
        }
    } else {
        echo "<span style='color: red'>N'EXISTE PAS</span>";
    }
    echo "</p>";
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>Test des Chemins Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .box { border: 1px solid #ddd; padding: 10px; margin-bottom: 15px; }
    </style>
</head>
<body>
    <h1>Test des Chemins Infomaniak</h1>
    
    <div class="box">
        <h2>Informations serveur</h2>
        <p>PHP Version: <?php echo phpversion(); ?></p>
        <p>Document Root: <?php echo $_SERVER['DOCUMENT_ROOT']; ?></p>
        <p>Script: <?php echo $_SERVER['SCRIPT_FILENAME']; ?></p>
    </div>
    
    <div class="box">
        <h2>Tests de chemins</h2>
        <?php
        // Test des différents chemins
        test_path($client_path, 'Dossier client Infomaniak');
        test_path($site_path, 'Dossier du site');
        test_path($site_path . '/index.html', 'Fichier index.html');
        test_path($site_path . '/.htaccess', 'Fichier .htaccess');
        test_path($site_path . '/assets', 'Dossier assets');
        test_path($site_path . '/api', 'Dossier API');
        ?>
    </div>
    
    <div class="box">
        <h2>Test d'écriture</h2>
        <?php
        // Créer un fichier de test dans le dossier client
        $test_file = $site_path . '/test_chemin_' . time() . '.txt';
        $success = false;
        
        try {
            $content = "Test d'écriture généré le " . date('Y-m-d H:i:s');
            if (file_put_contents($test_file, $content)) {
                echo "<p class='success'>Fichier test créé avec succès: $test_file</p>";
                $success = true;
            } else {
                echo "<p class='error'>Impossible de créer le fichier test: $test_file</p>";
            }
        } catch (Exception $e) {
            echo "<p class='error'>Exception: " . $e->getMessage() . "</p>";
        }
        
        // Tenter de créer un .htaccess dans le dossier du site
        if ($success) {
            $htaccess_file = $site_path . '/.htaccess-test';
            $htaccess_content = "AddHandler application/x-httpd-php .php\n<FilesMatch \"\\.php$\">\n    SetHandler application/x-httpd-php\n</FilesMatch>";
            
            if (file_put_contents($htaccess_file, $htaccess_content)) {
                echo "<p class='success'>Fichier .htaccess-test créé avec succès: $htaccess_file</p>";
                echo "<p>Contenu:</p>";
                echo "<pre>" . htmlspecialchars($htaccess_content) . "</pre>";
            } else {
                echo "<p class='error'>Impossible de créer le fichier .htaccess-test</p>";
            }
        }
        ?>
    </div>
    
    <div class="box">
        <h2>Recommandations</h2>
        <p>Utilisez cette structure de chemin dans vos scripts et commandes SSH:</p>
        <pre>/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch/</pre>
        
        <p>Pour modifier le fichier .htaccess via SSH, utilisez:</p>
        <pre>cat > /home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch/.htaccess << 'EOF'
AddHandler application/x-httpd-php .php
&lt;FilesMatch "\.php$"&gt;
    SetHandler application/x-httpd-php
&lt;/FilesMatch&gt;
EOF</pre>
    </div>
</body>
</html>
