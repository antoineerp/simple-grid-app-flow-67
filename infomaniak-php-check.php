
<?php
// Script de diagnostic basique pour serveurs Infomaniak
// Désactiver la mise en cache
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Réponse en texte simple pour commencer
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic PHP pour Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; max-width: 1000px; margin: 0 auto; }
        h1, h2 { color: #444; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; border-radius: 4px; }
        .card { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 4px; }
        button { background: #4285f4; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        button:hover { background: #3b78e7; }
    </style>
</head>
<body>
    <h1>Diagnostic PHP pour Infomaniak</h1>
    <p>Ce script analyse votre installation PHP sur Infomaniak et identifie les problèmes potentiels.</p>

    <div class="card">
        <h2>1. Configuration PHP</h2>
        <ul>
            <li>PHP Version: <strong><?php echo phpversion(); ?></strong></li>
            <li>Mode d'exécution PHP: <strong><?php echo php_sapi_name(); ?></strong></li>
            <li>Extensions chargées: <strong><?php echo count(get_loaded_extensions()); ?></strong></li>
            <li>display_errors: <strong><?php echo ini_get('display_errors') ? 'ON' : 'OFF'; ?></strong></li>
            <li>error_reporting: <strong><?php echo ini_get('error_reporting'); ?></strong></li>
        </ul>
    </div>

    <div class="card">
        <h2>2. Environnement serveur</h2>
        <ul>
            <li>Serveur: <strong><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Non défini'; ?></strong></li>
            <li>Document Root: <strong><?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Non défini'; ?></strong></li>
            <li>Script: <strong><?php echo $_SERVER['SCRIPT_FILENAME'] ?? 'Non défini'; ?></strong></li>
            <li>URI: <strong><?php echo $_SERVER['REQUEST_URI'] ?? 'Non défini'; ?></strong></li>
        </ul>
    </div>

    <div class="card">
        <h2>3. Fichiers de configuration</h2>
        <?php
        $files = [
            '.htaccess' => 'Configuration Apache racine',
            'api/.htaccess' => 'Configuration API',
            'api/.user.ini' => 'Configuration PHP utilisateur',
            'api/php.ini' => 'Configuration PHP locale'
        ];
        
        foreach ($files as $file => $description) {
            echo "<p>$description ($file): ";
            if (file_exists($file)) {
                echo "<span class='success'>PRÉSENT</span> (" . filesize($file) . " octets)";
            } else {
                echo "<span class='error'>ABSENT</span>";
            }
            echo "</p>";
        }
        ?>
    </div>

    <div class="card">
        <h2>4. Structure des dossiers</h2>
        <?php
        $dirs = [
            '.' => 'Racine',
            './api' => 'API',
            './api/controllers' => 'Contrôleurs API',
            './assets' => 'Assets',
            './public' => 'Public'
        ];
        
        foreach ($dirs as $dir => $description) {
            echo "<p>$description ($dir): ";
            if (is_dir($dir)) {
                $files = scandir($dir);
                $fileCount = count($files) - 2; // Moins . et ..
                echo "<span class='success'>OK</span> ($fileCount fichiers)";
            } else {
                echo "<span class='error'>MANQUANT</span>";
            }
            echo "</p>";
        }
        ?>
    </div>

    <div class="card">
        <h2>5. Test de création fichier</h2>
        <?php
        $testFile = 'api/test_' . time() . '.php';
        $testContent = '<?php header("Content-Type: application/json"); echo json_encode(["test" => "ok", "time" => time()]); ?>';
        $writeSuccess = @file_put_contents($testFile, $testContent);
        
        if ($writeSuccess !== false) {
            echo "<p><span class='success'>✓ Écriture réussie</span> - Fichier de test créé: $testFile</p>";
            echo "<p>Test ce fichier: <a href='/$testFile' target='_blank'>/$testFile</a></p>";
        } else {
            echo "<p><span class='error'>✗ Échec d'écriture</span> - Impossible de créer le fichier de test</p>";
            echo "<p>Raison possible: permissions insuffisantes</p>";
        }
        ?>
    </div>

    <div class="card">
        <h2>6. Test des scripts API existants</h2>
        <?php
        $apiScripts = [
            'api/index.php' => 'API Index',
            'api/test.php' => 'Test PHP simple',
            'api/php-simple-test.php' => 'Test PHP simple',
            'api/login-test.php' => 'Test de login'
        ];
        
        foreach ($apiScripts as $script => $description) {
            echo "<p>$description ($script): ";
            if (file_exists($script)) {
                echo "<span class='success'>EXISTE</span>";
                echo " - <a href='/$script' target='_blank'>Tester</a>";
            } else {
                echo "<span class='error'>ABSENT</span>";
            }
            echo "</p>";
        }
        ?>
    </div>

    <div class="card">
        <h2>7. Analyse des règles de redirection</h2>
        <?php
        if (function_exists('apache_get_modules')) {
            $modules = apache_get_modules();
            echo "<p>Modules Apache: ";
            if (in_array('mod_rewrite', $modules)) {
                echo "<span class='success'>mod_rewrite activé</span>";
            } else {
                echo "<span class='error'>mod_rewrite non disponible</span>";
            }
            echo "</p>";
        } else {
            echo "<p><span class='warning'>Impossible de vérifier les modules Apache</span></p>";
        }
        
        // Vérifier le contenu du .htaccess
        if (file_exists('.htaccess')) {
            $htaccess = file_get_contents('.htaccess');
            echo "<p>Règles de redirection dans .htaccess:</p>";
            echo "<pre>" . htmlspecialchars($htaccess) . "</pre>";
        }
        ?>
    </div>

    <div class="card">
        <h2>8. Recommandations</h2>
        <ul>
            <li>Vérifiez que le module PHP est bien activé sur votre serveur Infomaniak</li>
            <li>Assurez-vous que les fichiers .htaccess sont autorisés (option AllowOverride)</li>
            <li>Vérifiez les permissions des dossiers (/api/ devrait être en 755)</li>
            <li>En cas de problème persistant, contactez le support Infomaniak avec ces informations</li>
        </ul>
    </div>

    <p><em>Script généré le <?php echo date('Y-m-d H:i:s'); ?></em></p>
</body>
</html>
