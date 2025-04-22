
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification du Déploiement FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Vérification du Déploiement FormaCert</h1>
    
    <div class="section">
        <h2>1. Vérification des Fichiers Essentiels</h2>
        <?php
        $required_files = [
            'index.html' => 'Page principale',
            '.htaccess' => 'Configuration Apache',
            'assets/index.js' => 'JavaScript compilé',
            'api/index.php' => 'Point d\'entrée API',
            'api/.htaccess' => 'Configuration API',
            'api/config/env.php' => 'Configuration environnement'
        ];

        foreach ($required_files as $file => $description) {
            echo "<p>$description ($file): ";
            if (file_exists($file)) {
                echo "<span class='success'>✓ Présent</span>";
            } else {
                echo "<span class='error'>✗ Manquant</span>";
            }
            echo "</p>";
        }
        ?>
    </div>

    <div class="section">
        <h2>2. Configuration Apache</h2>
        <?php
        $apache_modules = [
            'mod_rewrite' => function_exists('apache_get_modules') ? in_array('mod_rewrite', apache_get_modules()) : "Non détectable",
            'mod_headers' => function_exists('apache_get_modules') ? in_array('mod_headers', apache_get_modules()) : "Non détectable"
        ];

        foreach ($apache_modules as $module => $enabled) {
            echo "<p>Module $module: ";
            if ($enabled === true) {
                echo "<span class='success'>Activé</span>";
            } elseif ($enabled === false) {
                echo "<span class='error'>Désactivé</span>";
            } else {
                echo "<span class='warning'>$enabled</span>";
            }
            echo "</p>";
        }
        ?>
    </div>

    <div class="section">
        <h2>3. Configuration PHP</h2>
        <?php
        $php_config = [
            'Version PHP' => phpversion(),
            'memory_limit' => ini_get('memory_limit'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
            'max_execution_time' => ini_get('max_execution_time')
        ];

        foreach ($php_config as $setting => $value) {
            echo "<p>$setting: $value</p>";
        }
        ?>
    </div>

    <div class="section">
        <h2>4. Test de l'API</h2>
        <?php
        $api_endpoints = [
            '/api' => 'Point d\'entrée principal',
            '/api/test.php' => 'Test endpoint'
        ];

        foreach ($api_endpoints as $endpoint => $description) {
            echo "<p>Test $description ($endpoint): ";
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $endpoint);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            $result = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode >= 200 && $httpCode < 300) {
                echo "<span class='success'>✓ OK (Code $httpCode)</span>";
            } else {
                echo "<span class='error'>✗ Erreur (Code $httpCode)</span>";
            }
            echo "</p>";
        }
        ?>
    </div>

    <div class="section">
        <h2>5. Permissions des Dossiers</h2>
        <?php
        $directories = [
            'assets' => 'Dossier assets',
            'api' => 'Dossier API',
            'api/config' => 'Configuration API',
            'public/lovable-uploads' => 'Dossier uploads'
        ];

        foreach ($directories as $dir => $description) {
            echo "<p>$description ($dir): ";
            if (is_dir($dir)) {
                $perms = substr(sprintf('%o', fileperms($dir)), -4);
                echo "Permissions: $perms ";
                if (is_writable($dir)) {
                    echo "<span class='success'>✓ Accessible en écriture</span>";
                } else {
                    echo "<span class='error'>✗ Non accessible en écriture</span>";
                }
            } else {
                echo "<span class='error'>✗ Dossier non trouvé</span>";
            }
            echo "</p>";
        }
        ?>
    </div>

    <div class="section">
        <h2>Paramètres de déploiement</h2>
        <p>Serveur: <?php echo $_SERVER['SERVER_NAME'] ?? 'Non détecté'; ?></p>
        <p>Chemin racine: <?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Non détecté'; ?></p>
        <p>Chemin script: <?php echo __DIR__; ?></p>
        <p>Utilisateur du processus: <?php echo get_current_user(); ?></p>
    </div>

    <div class="section">
        <h2>Instructions de Déploiement</h2>
        <ol>
            <li>Assurez-vous que tous les fichiers sont présents (section 1)</li>
            <li>Vérifiez que les modules Apache nécessaires sont activés (section 2)</li>
            <li>Ajustez les paramètres PHP si nécessaire (section 3)</li>
            <li>Testez l'API et vérifiez qu'elle répond correctement (section 4)</li>
            <li>Vérifiez les permissions des dossiers (section 5)</li>
        </ol>
    </div>
</body>
</html>
