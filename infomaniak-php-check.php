
<?php
// Script de diagnostic simple pour serveurs Infomaniak
header("Content-Type: text/html; charset=UTF-8");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic PHP Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; max-width: 1000px; margin: 0 auto; }
        h1, h2 { color: #444; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; border-radius: 4px; }
        .card { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; }
        table, th, td { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #f5f5f5; text-align: left; }
    </style>
</head>
<body>
    <h1>Diagnostic PHP pour Infomaniak</h1>
    <p>Cet outil vérifie votre installation PHP sur Infomaniak et identifie les problèmes potentiels.</p>

    <div class="card">
        <h2>1. Informations PHP</h2>
        <table>
            <tr><th>Paramètre</th><th>Valeur</th></tr>
            <tr><td>Version PHP</td><td><?php echo phpversion(); ?></td></tr>
            <tr><td>Interface SAPI</td><td><?php echo php_sapi_name(); ?></td></tr>
            <tr><td>Système d'exploitation</td><td><?php echo PHP_OS; ?></td></tr>
            <tr><td>Extensions chargées</td><td><?php echo count(get_loaded_extensions()); ?></td></tr>
            <tr><td>display_errors</td><td><?php echo ini_get('display_errors') ? 'ON' : 'OFF'; ?></td></tr>
        </table>
    </div>

    <div class="card">
        <h2>2. Environnement serveur</h2>
        <table>
            <tr><th>Variable</th><th>Valeur</th></tr>
            <tr><td>SERVER_SOFTWARE</td><td><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Non défini'; ?></td></tr>
            <tr><td>DOCUMENT_ROOT</td><td><?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Non défini'; ?></td></tr>
            <tr><td>HTTP_HOST</td><td><?php echo $_SERVER['HTTP_HOST'] ?? 'Non défini'; ?></td></tr>
            <tr><td>SCRIPT_FILENAME</td><td><?php echo $_SERVER['SCRIPT_FILENAME'] ?? 'Non défini'; ?></td></tr>
            <tr><td>REQUEST_URI</td><td><?php echo $_SERVER['REQUEST_URI'] ?? 'Non défini'; ?></td></tr>
        </table>
    </div>

    <div class="card">
        <h2>3. Test des fichiers de configuration</h2>
        <?php
        $files = [
            '.htaccess' => 'Configuration Apache racine',
            'api/.htaccess' => 'Configuration API',
            'api/.user.ini' => 'Configuration PHP utilisateur',
            'api/php.ini' => 'Configuration PHP locale'
        ];
        
        echo "<table>";
        echo "<tr><th>Fichier</th><th>Description</th><th>Statut</th><th>Taille</th></tr>";
        
        foreach ($files as $file => $description) {
            echo "<tr>";
            echo "<td>$file</td>";
            echo "<td>$description</td>";
            
            if (file_exists($file)) {
                $size = filesize($file) . " octets";
                echo "<td><span class='success'>PRÉSENT</span></td>";
                echo "<td>$size</td>";
            } else {
                echo "<td><span class='error'>ABSENT</span></td>";
                echo "<td>-</td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>

    <div class="card">
        <h2>4. Structure des dossiers</h2>
        <?php
        $dirs = [
            '.' => 'Racine',
            './api' => 'API',
            './assets' => 'Assets',
            './public' => 'Public'
        ];
        
        echo "<table>";
        echo "<tr><th>Dossier</th><th>Description</th><th>Statut</th><th>Fichiers</th></tr>";
        
        foreach ($dirs as $dir => $description) {
            echo "<tr>";
            echo "<td>$dir</td>";
            echo "<td>$description</td>";
            
            if (is_dir($dir)) {
                $files = scandir($dir);
                $fileCount = count($files) - 2; // Moins . et ..
                echo "<td><span class='success'>OK</span></td>";
                echo "<td>$fileCount fichiers</td>";
            } else {
                echo "<td><span class='error'>MANQUANT</span></td>";
                echo "<td>-</td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>

    <div class="card">
        <h2>5. Test d'exécution PHP</h2>
        <?php
        $testFile = 'api/test-' . time() . '.php';
        $testContent = '<?php
header("Content-Type: application/json");
echo json_encode([
    "success" => true,
    "message" => "Test PHP OK",
    "time" => time(),
    "php_version" => phpversion()
]);
?>';
        
        echo "<p>Test de création de fichier: ";
        $writeResult = @file_put_contents($testFile, $testContent);
        
        if ($writeResult !== false) {
            echo "<span class='success'>Réussi</span>";
            echo " - <a href='/$testFile' target='_blank'>Tester</a>";
        } else {
            echo "<span class='error'>Échec</span>";
            echo " - Vérifiez les permissions du dossier api/";
        }
        echo "</p>";
        ?>
    </div>

    <div class="card">
        <h2>6. Test des scripts PHP existants</h2>
        <?php
        $scripts = [
            'api/test.php' => 'Test simple',
            'api/php-simple-test.php' => 'Test PHP simple',
            'api/login-test.php' => 'Test de login',
            'api/infomaniak-check.php' => 'Check Infomaniak'
        ];
        
        echo "<table>";
        echo "<tr><th>Script</th><th>Description</th><th>Statut</th><th>Action</th></tr>";
        
        foreach ($scripts as $script => $description) {
            echo "<tr>";
            echo "<td>$script</td>";
            echo "<td>$description</td>";
            
            if (file_exists($script)) {
                echo "<td><span class='success'>EXISTE</span></td>";
                echo "<td><a href='/$script' target='_blank'>Tester</a></td>";
            } else {
                echo "<td><span class='error'>ABSENT</span></td>";
                echo "<td>-</td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>

    <div class="card">
        <h2>7. Analyse de la configuration Apache</h2>
        <?php
        // Affichage des modules Apache si disponibles
        if (function_exists('apache_get_modules')) {
            $modules = apache_get_modules();
            echo "<p>mod_rewrite: ";
            if (in_array('mod_rewrite', $modules)) {
                echo "<span class='success'>Activé</span>";
            } else {
                echo "<span class='error'>Non activé</span>";
            }
            echo "</p>";
            
            echo "<p>Total modules Apache: " . count($modules) . "</p>";
        } else {
            echo "<p><span class='warning'>Impossible de vérifier les modules Apache</span> - La fonction apache_get_modules() n'est pas disponible.</p>";
        }
        
        // Vérifier le contenu du .htaccess principal
        if (file_exists('.htaccess')) {
            echo "<h3>Contenu du fichier .htaccess principal :</h3>";
            echo "<pre>" . htmlspecialchars(file_get_contents('.htaccess')) . "</pre>";
        }
        ?>
    </div>

    <div class="card">
        <h2>8. Recommandations</h2>
        <ul>
            <li>Vérifiez que PHP est bien activé dans votre hébergement Infomaniak (Manager > Hébergement > Configuration > PHP/CGI)</li>
            <li>Assurez-vous que les fichiers .htaccess sont autorisés (AllowOverride All)</li>
            <li>Vérifiez que le module mod_rewrite est activé</li>
            <li>Vérifiez les permissions des répertoires (755) et fichiers (644)</li>
            <li>Si nécessaire, contactez le support Infomaniak avec les informations de diagnostic ci-dessus</li>
        </ul>
    </div>

    <p><em>Diagnostic généré le <?php echo date('Y-m-d H:i:s'); ?></em></p>
</body>
</html>
