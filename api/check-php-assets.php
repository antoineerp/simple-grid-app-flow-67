
<?php
// Script simplifié de diagnostic pour les assets et l'exécution PHP
header("Content-Type: text/html; charset=UTF-8");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic PHP et Assets</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; max-width: 1000px; margin: 0 auto; }
        h1, h2 { color: #444; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; border-radius: 4px; }
        .card { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Diagnostic PHP et Assets pour Infomaniak</h1>
    
    <div class="card">
        <h2>1. Test d'exécution PHP</h2>
        <?php
        echo "<p>PHP est correctement exécuté si vous pouvez voir ce message.</p>";
        echo "<p>Version PHP: <span class='success'>" . phpversion() . "</span></p>";
        echo "<p>Interface SAPI: <span class='success'>" . php_sapi_name() . "</span></p>";
        ?>
        
        <!-- Test d'écriture JSON -->
        <?php
        $json_test = json_encode([
            'success' => true,
            'message' => 'Test JSON PHP OK',
            'timestamp' => time()
        ]);
        echo "<p>Test JSON: <span class='success'>OK</span></p>";
        echo "<pre>" . htmlspecialchars($json_test) . "</pre>";
        ?>
    </div>
    
    <div class="card">
        <h2>2. Création d'un fichier de test JSON</h2>
        <?php
        $test_file = 'api/php-test-' . time() . '.php';
        $test_content = '<?php
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");
echo json_encode([
    "success" => true,
    "message" => "PHP JSON Test OK",
    "time" => time(),
    "php_version" => phpversion()
]);
?>';

        $write_result = @file_put_contents($test_file, $test_content);
        
        if ($write_result !== false) {
            echo "<p>Fichier de test JSON créé: <span class='success'>RÉUSSI</span></p>";
            echo "<p>Vous pouvez tester ce fichier ici: <a href='/$test_file' target='_blank'>/$test_file</a></p>";
        } else {
            echo "<p>Création du fichier de test: <span class='error'>ÉCHEC</span></p>";
            echo "<p>Vérifiez les permissions du dossier api/</p>";
        }
        ?>
    </div>
    
    <div class="card">
        <h2>3. Structure des assets</h2>
        <?php
        // Vérifier le dossier assets
        if (is_dir('./assets')) {
            echo "<p>Dossier assets: <span class='success'>EXISTE</span></p>";
            
            // Liste des fichiers JS
            echo "<p>Fichiers JavaScript:</p><ul>";
            $js_files = glob('./assets/*.js');
            if (!empty($js_files)) {
                foreach ($js_files as $js_file) {
                    echo "<li>" . basename($js_file) . " (" . filesize($js_file) . " octets)</li>";
                }
            } else {
                echo "<li><span class='error'>Aucun fichier JS trouvé</span></li>";
            }
            echo "</ul>";
            
            // Liste des fichiers CSS
            echo "<p>Fichiers CSS:</p><ul>";
            $css_files = glob('./assets/*.css');
            if (!empty($css_files)) {
                foreach ($css_files as $css_file) {
                    echo "<li>" . basename($css_file) . " (" . filesize($css_file) . " octets)</li>";
                }
            } else {
                echo "<li><span class='error'>Aucun fichier CSS trouvé</span></li>";
            }
            echo "</ul>";
        } else {
            echo "<p>Dossier assets: <span class='error'>MANQUANT</span></p>";
        }
        ?>
    </div>
    
    <div class="card">
        <h2>4. Vérification des références dans index.html</h2>
        <?php
        if (file_exists('./index.html')) {
            echo "<p>Fichier index.html: <span class='success'>EXISTE</span></p>";
            $index_content = file_get_contents('./index.html');
            
            // Vérifier les références aux assets
            $has_js_asset = preg_match('/src=["\']\/?assets\//', $index_content);
            $has_css_asset = preg_match('/href=["\']\/?assets\//', $index_content);
            $has_src_reference = preg_match('/src=["\']\.?\/?src\//', $index_content);
            
            echo "<p>Référence à un fichier JavaScript dans /assets/: " . 
                ($has_js_asset ? "<span class='success'>OUI</span>" : "<span class='error'>NON</span>") . "</p>";
            echo "<p>Référence à un fichier CSS dans /assets/: " . 
                ($has_css_asset ? "<span class='success'>OUI</span>" : "<span class='error'>NON</span>") . "</p>";
            echo "<p>Référence à un fichier dans /src/: " . 
                ($has_src_reference ? "<span class='warning'>OUI</span> (doit être remplacée)" : "<span class='success'>NON</span>") . "</p>";
        } else {
            echo "<p>Fichier index.html: <span class='error'>MANQUANT</span></p>";
        }
        ?>
    </div>
    
    <div class="card">
        <h2>5. Création d'un script PHP simple dans le dossier API</h2>
        <?php
        $api_test_file = 'api/simple-json-test.php';
        $api_test_content = '<?php
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");

echo json_encode([
    "success" => true,
    "message" => "API test successful",
    "server" => $_SERVER["SERVER_SOFTWARE"],
    "php_version" => phpversion(),
    "timestamp" => date("Y-m-d H:i:s")
]);
?>';

        $api_write_result = @file_put_contents($api_test_file, $api_test_content);
        
        if ($api_write_result !== false) {
            echo "<p>Fichier de test API créé: <span class='success'>RÉUSSI</span></p>";
            echo "<p>Vous pouvez tester l'API ici: <a href='/$api_test_file' target='_blank'>/$api_test_file</a></p>";
        } else {
            echo "<p>Création du fichier API: <span class='error'>ÉCHEC</span></p>";
            echo "<p>Vérifiez les permissions du dossier api/</p>";
        }
        ?>
    </div>

    <div class="card">
        <h2>6. Test de correction des références dans index.html</h2>
        <?php
        if (file_exists('./index.html') && is_dir('./assets')) {
            $js_files = glob('./assets/*.js');
            $css_files = glob('./assets/*.css');
            
            // Sélectionner le premier fichier JS et CSS trouvé
            $main_js = !empty($js_files) ? '/assets/' . basename($js_files[0]) : '';
            $main_css = !empty($css_files) ? '/assets/' . basename($css_files[0]) : '';
            
            if (!empty($main_js) && !empty($main_css)) {
                echo "<p>Fichiers assets détectés:</p>";
                echo "<ul>";
                echo "<li>JS: $main_js</li>";
                echo "<li>CSS: $main_css</li>";
                echo "</ul>";
                
                echo "<form method='post'>";
                echo "<input type='hidden' name='fix_index' value='1'>";
                echo "<input type='hidden' name='js_file' value='$main_js'>";
                echo "<input type='hidden' name='css_file' value='$main_css'>";
                echo "<button type='submit' style='background:#4CAF50;color:white;border:none;padding:10px;border-radius:4px;cursor:pointer;'>Corriger index.html</button>";
                echo "</form>";
                
                // Traitement si le formulaire est soumis
                if (isset($_POST['fix_index'])) {
                    $js_file = $_POST['js_file'];
                    $css_file = $_POST['css_file'];
                    
                    // Sauvegarde
                    copy('./index.html', './index.html.bak');
                    
                    // Lire le contenu
                    $content = file_get_contents('./index.html');
                    
                    // Remplacer les références src/
                    $content = preg_replace('/<link[^>]*href=["\']\.\/?src\/index\.css["\'][^>]*>/', 
                                          '<link rel="stylesheet" href="' . $css_file . '">', 
                                          $content);
                    
                    $content = preg_replace('/<script[^>]*src=["\']\.\/?src\/main\.[tj]sx?["\'][^>]*>/', 
                                          '<script type="module" src="' . $js_file . '"></script>', 
                                          $content);
                    
                    // Écrire le nouveau contenu
                    if (file_put_contents('./index.html', $content)) {
                        echo "<p><span class='success'>index.html a été mis à jour!</span></p>";
                        echo "<p>Une sauvegarde a été créée: index.html.bak</p>";
                    } else {
                        echo "<p><span class='error'>Impossible de mettre à jour index.html</span></p>";
                    }
                }
            } else {
                echo "<p><span class='warning'>Il manque des fichiers JS ou CSS dans le dossier assets/</span></p>";
            }
        }
        ?>
    </div>
    
    <div class="card">
        <h2>7. Recommandations</h2>
        <ul>
            <li>Assurez-vous que PHP est bien activé dans votre hébergement Infomaniak</li>
            <li>Vérifiez que les fichiers .htaccess autorisent l'exécution de PHP</li>
            <li>Vérifiez que le module mod_rewrite est activé</li>
            <li>Si vous avez des erreurs 404 pour les fichiers PHP, vérifiez votre configuration Apache</li>
            <li>Si vous avez des problèmes de chargement des assets, utilisez l'outil ci-dessus pour corriger index.html</li>
        </ul>
    </div>

    <p><em>Diagnostic généré le <?php echo date('Y-m-d H:i:s'); ?></em></p>
</body>
</html>
