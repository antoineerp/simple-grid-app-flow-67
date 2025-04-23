
<?php
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Diagnostic PHP Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .test-block { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
        .success { color: #2ecc71; font-weight: bold; }
        .error { color: #e74c3c; font-weight: bold; }
        .alert { background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin: 10px 0; }
        code { background: #f5f5f5; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
        button { background: #3498db; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
        button:hover { background: #2980b9; }
    </style>
</head>
<body>
    <h1>Diagnostic PHP Infomaniak</h1>
    
    <div class="test-block">
        <h2>1. Informations PHP</h2>
        <ul>
            <li>Version PHP: <strong><?= phpversion() ?></strong></li>
            <li>Interface SAPI: <strong><?= php_sapi_name() ?></strong></li>
            <li>Extensions chargées: <strong><?= count(get_loaded_extensions()) ?></strong></li>
            <li>Date et heure: <strong><?= date('Y-m-d H:i:s') ?></strong></li>
        </ul>
    </div>
    
    <div class="test-block">
        <h2>2. Configuration serveur</h2>
        <ul>
            <li>Serveur: <strong><?= $_SERVER['SERVER_SOFTWARE'] ?? 'Non défini' ?></strong></li>
            <li>Domaine: <strong><?= $_SERVER['HTTP_HOST'] ?? 'Non défini' ?></strong></li>
            <li>Document Root: <strong><?= $_SERVER['DOCUMENT_ROOT'] ?? 'Non défini' ?></strong></li>
            <li>Script actuel: <strong><?= $_SERVER['SCRIPT_FILENAME'] ?? 'Non défini' ?></strong></li>
        </ul>
    </div>
    
    <div class="test-block">
        <h2>3. Test de création de fichier PHP</h2>
        <?php
        $test_file = 'api/php-test-' . time() . '.php';
        $test_content = '<?php
header("Content-Type: application/json; charset=UTF-8");
echo json_encode([
    "success" => true,
    "message" => "PHP Test OK",
    "time" => time(),
    "php_version" => phpversion()
]);
?>';

        $write_result = @file_put_contents($test_file, $test_content);
        
        if ($write_result !== false) {
            echo "<p><span class='success'>✓ Fichier de test créé avec succès</span></p>";
            echo "<p>Vous pouvez tester ce fichier: <a href='/$test_file' target='_blank'>/$test_file</a></p>";
        } else {
            echo "<p><span class='error'>✗ Échec de création du fichier de test</span></p>";
            echo "<p>Vérifiez les permissions du dossier /api/</p>";
        }
        ?>
    </div>
    
    <div class="test-block">
        <h2>4. Test de fichiers PHP existants</h2>
        <?php
        $test_files = [
            '/api/test.php' => 'Test PHP simple',
            '/api/index.php' => 'Index API',
            '/api/php-simple-test.php' => 'Test simple',
            '/api/login-test.php' => 'Test de login'
        ];
        
        foreach ($test_files as $file => $description) {
            $full_path = $_SERVER['DOCUMENT_ROOT'] . $file;
            echo "<div>";
            echo "<strong>$description</strong> ($file): ";
            
            if (file_exists($full_path)) {
                echo "<span class='success'>Existe</span> ";
                echo "<a href='$file' target='_blank'>Tester</a>";
            } else {
                echo "<span class='error'>N'existe pas</span>";
            }
            echo "</div>";
        }
        ?>
    </div>
    
    <div class="test-block">
        <h2>5. Test des .htaccess</h2>
        <?php
        $htaccess_files = [
            '.htaccess' => 'Racine',
            'api/.htaccess' => 'API'
        ];
        
        foreach ($htaccess_files as $file => $location) {
            echo "<p><strong>.htaccess $location</strong>: ";
            if (file_exists($file)) {
                echo "<span class='success'>Existe</span> (" . filesize($file) . " octets)";
                echo "<pre>" . htmlspecialchars(file_get_contents($file)) . "</pre>";
            } else {
                echo "<span class='error'>N'existe pas</span>";
            }
            echo "</p>";
        }
        ?>
    </div>
    
    <div class="test-block">
        <h2>6. Instructions spécifiques pour Infomaniak</h2>
        
        <p>Si PHP ne s'exécute pas correctement, vérifiez que:</p>
        <ul>
            <li>PHP est activé pour votre hébergement (vérifiez dans le Manager Infomaniak)</li>
            <li>Le module mod_rewrite est activé</li>
            <li>Les .htaccess sont autorisés (AllowOverride All)</li>
            <li>Les permissions des dossiers et fichiers sont correctes (755 pour les dossiers, 644 pour les fichiers)</li>
        </ul>
        
        <p>Pour Infomaniak spécifiquement:</p>
        <ol>
            <li>Accédez au Manager Infomaniak</li>
            <li>Allez dans votre hébergement > Configuration</li>
            <li>Vérifiez que PHP est activé et configuré correctement</li>
            <li>Vérifiez que mod_rewrite est activé dans les modules Apache</li>
        </ol>
    </div>
    
    <p><em>Test exécuté le <?= date('Y-m-d H:i:s') ?></em></p>
</body>
</html>
