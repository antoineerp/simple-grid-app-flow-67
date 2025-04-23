
<?php
// Script de diagnostic pour tester les problèmes de routage PHP
header("Content-Type: text/html; charset=UTF-8");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic de Routage PHP</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2 { color: #334155; }
        .card { margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background-color: #f8fafc; }
        .success { color: #16a34a; font-weight: bold; }
        .error { color: #dc2626; font-weight: bold; }
        .warning { color: #d97706; font-weight: bold; }
        pre { background-color: #f1f5f9; padding: 10px; border-radius: 4px; overflow: auto; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
        th { background-color: #f1f5f9; }
        .btn { display: inline-block; padding: 8px 16px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Diagnostic de Routage PHP</h1>
    <p>Cet outil vérifie les problèmes spécifiques de routage des fichiers PHP sur votre serveur.</p>

    <div class="card">
        <h2>1. Informations sur la Requête Actuelle</h2>
        <?php
        echo "<strong>Script exécuté:</strong> " . $_SERVER['SCRIPT_FILENAME'] . "<br>";
        echo "<strong>URI demandé:</strong> " . $_SERVER['REQUEST_URI'] . "<br>";
        echo "<strong>Méthode:</strong> " . $_SERVER['REQUEST_METHOD'] . "<br>";
        echo "<strong>Heure:</strong> " . date('Y-m-d H:i:s') . "<br>";
        echo "<strong>IP client:</strong> " . $_SERVER['REMOTE_ADDR'] . "<br>";
        ?>
    </div>

    <div class="card">
        <h2>2. Test de Création et Accès Fichier PHP</h2>
        <?php
        // Créer un fichier PHP de test dans le même répertoire
        $testFilename = 'routing-test-' . time() . '.php';
        $testContent = '<?php
header("Content-Type: text/plain");
echo "Test de routage créé le ' . date('Y-m-d H:i:s') . '";
echo "\nCe fichier est accessible, donc le routage PHP fonctionne.";
?>';

        $result = @file_put_contents($testFilename, $testContent);
        
        if ($result !== false) {
            echo "<p><span class='success'>Fichier de test créé avec succès</span>: $testFilename</p>";
            
            // Déterminer l'URL pour accéder au fichier
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
            $host = $_SERVER['HTTP_HOST'];
            $baseUrl = $protocol . $host;
            $currentPath = dirname($_SERVER['REQUEST_URI']);
            
            if ($currentPath === '/' || $currentPath === '\\') {
                $currentPath = '';
            }
            
            $testUrl = $baseUrl . $currentPath . '/' . $testFilename;
            
            echo "<p>Vous pouvez tester l'accès à ce fichier ici: <a href='$testUrl' target='_blank' class='btn'>Tester l'accès</a></p>";
            
            echo "<p>URLs à tester:</p>";
            echo "<ul>";
            echo "<li><a href='$testUrl' target='_blank'>$testUrl</a> (chemin direct)</li>";
            
            // Générer d'autres variantes d'URL à tester
            $urlVariants = [
                $baseUrl . '/api/' . $testFilename,
                $baseUrl . '/' . $testFilename,
                str_replace('/api/', '/', $testUrl)
            ];
            
            foreach ($urlVariants as $variant) {
                if ($variant !== $testUrl) {
                    echo "<li><a href='$variant' target='_blank'>$variant</a></li>";
                }
            }
            
            echo "</ul>";
        } else {
            echo "<p><span class='error'>Impossible de créer le fichier de test</span>. Vérifiez les permissions du répertoire.</p>";
        }
        ?>
    </div>

    <div class="card">
        <h2>3. Vérification des Règles de Routage</h2>
        <?php
        // Vérifier si un fichier .htaccess existe dans ce répertoire
        $htaccessPath = '.htaccess';
        if (file_exists($htaccessPath)) {
            echo "<p><span class='success'>Fichier .htaccess trouvé</span> dans ce répertoire (" . filesize($htaccessPath) . " octets)</p>";
            
            $htaccessContent = file_get_contents($htaccessPath);
            $hasRewriteEngine = strpos($htaccessContent, 'RewriteEngine On') !== false;
            $hasPhpHandler = strpos($htaccessContent, 'application/x-httpd-php') !== false;
            
            echo "<ul>";
            echo "<li>RewriteEngine activé: " . ($hasRewriteEngine ? "<span class='success'>Oui</span>" : "<span class='error'>Non</span>") . "</li>";
            echo "<li>Handler PHP configuré: " . ($hasPhpHandler ? "<span class='success'>Oui</span>" : "<span class='error'>Non</span>") . "</li>";
            echo "</ul>";
        } else {
            echo "<p><span class='warning'>Pas de fichier .htaccess</span> dans ce répertoire.</p>";
        }
        
        // Vérifier le fichier .htaccess parent (si on est dans /api/)
        $parentHtaccess = '../.htaccess';
        if (file_exists($parentHtaccess)) {
            echo "<p><span class='success'>Fichier .htaccess parent trouvé</span> (" . filesize($parentHtaccess) . " octets)</p>";
        }
        ?>
    </div>

    <div class="card">
        <h2>4. Test des Chemins d'Accès Courants</h2>
        <?php
        // Liste des fichiers PHP diagnostiques à tester
        $phpFiles = [
            'check-php-assets.php' => 'Diagnostic des assets',
            'minimal-test.php' => 'Test minimal',
            'simple-json-test.php' => 'Test JSON simple',
            'test-php-routing.php' => 'Test de routage',
            'assets-check.php' => 'Vérification des assets'
        ];
        
        echo "<table>";
        echo "<tr><th>Fichier</th><th>Description</th><th>Existe</th><th>Actions</th></tr>";
        
        foreach ($phpFiles as $file => $desc) {
            echo "<tr>";
            echo "<td>$file</td>";
            echo "<td>$desc</td>";
            
            if (file_exists($file)) {
                echo "<td><span class='success'>Oui</span></td>";
                
                // Générer les URLs pour accéder au fichier
                $fileUrl = $baseUrl . $currentPath . '/' . $file;
                $rootUrl = $baseUrl . '/' . $file;
                $apiUrl = $baseUrl . '/api/' . $file;
                
                echo "<td>";
                echo "<a href='$fileUrl' target='_blank' class='btn' style='font-size:12px;margin-right:5px;'>Test Local</a>";
                echo "<a href='$rootUrl' target='_blank' class='btn' style='font-size:12px;margin-right:5px;background:#64748b;'>Test Racine</a>";
                
                if (strpos($currentPath, '/api') === false) {
                    echo "<a href='$apiUrl' target='_blank' class='btn' style='font-size:12px;background:#059669;'>Test API</a>";
                }
                
                echo "</td>";
            } else {
                echo "<td><span class='error'>Non</span></td>";
                echo "<td>-</td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>

    <div class="card">
        <h2>5. Test des Méthodes de Routage Alternatives</h2>
        <?php
        // Créer un simple test PHP qui effectue une redirection
        $redirectTestFile = 'redirect-test-' . time() . '.php';
        $redirectContent = '<?php
header("Location: minimal-test.php");
exit();
?>';

        if (@file_put_contents($redirectTestFile, $redirectContent) !== false) {
            echo "<p><span class='success'>Fichier de redirection créé</span>: $redirectTestFile</p>";
            echo "<p>Test de redirection: <a href='$redirectTestFile' target='_blank' class='btn'>Tester la redirection</a></p>";
        } else {
            echo "<p><span class='error'>Impossible de créer le fichier de test de redirection</span></p>";
        }
        ?>
    </div>

    <div class="card">
        <h2>6. Recommandations</h2>
        <ul>
            <li>Si les tests directs fonctionnent mais que les URLs globales échouent, vérifiez le routage dans le fichier .htaccess principal.</li>
            <li>Vérifiez les permissions des fichiers PHP (644) et répertoires (755).</li>
            <li>Assurez-vous que le module mod_rewrite est activé sur votre serveur.</li>
            <li>Utilisez le fichier .htaccess pour spécifier les règles de routage explicites pour chaque fichier PHP diagnostique.</li>
            <li>Sur Infomaniak, vérifiez dans le Manager que PHP est bien activé pour votre hébergement.</li>
        </ul>
    </div>

    <p><em>Diagnostic généré le <?php echo date('Y-m-d H:i:s'); ?></em></p>
</body>
</html>
