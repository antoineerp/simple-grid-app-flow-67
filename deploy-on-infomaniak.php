
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Déploiement Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { 
            background-color: #4CAF50; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 16px; 
            text-decoration: none;
            display: inline-block;
            margin: 5px;
        }
        .button.blue { background-color: #2196F3; }
        .button.red { background-color: #f44336; }
        .success { color: green; padding: 10px; background-color: #f0fff0; border-left: 4px solid green; }
        .error { color: red; padding: 10px; background-color: #fff0f0; border-left: 4px solid red; }
        pre { background-color: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Déploiement Infomaniak</h1>
        
        <div class="card">
            <h2>1. Vérification des fichiers critiques</h2>
            <?php
            $critical_files = [
                '.htaccess' => 'Configuration Apache principale',
                '.user.ini' => 'Configuration PHP',
                'api/.htaccess' => 'Configuration API',
                'assets/.htaccess' => 'Configuration des assets',
                'index.php' => 'Redirection vers index.html',
                'phpinfo.php' => 'Test PHP Info'
            ];
            
            $all_ok = true;
            echo "<ul>";
            foreach ($critical_files as $file => $description) {
                if (file_exists($file)) {
                    echo "<li><strong>$file</strong>: <span style='color:green'>OK</span> - $description</li>";
                } else {
                    echo "<li><strong>$file</strong>: <span style='color:red'>MANQUANT</span> - $description</li>";
                    $all_ok = false;
                }
            }
            echo "</ul>";
            
            if (!$all_ok) {
                echo "<p><a href='infomaniak-php-fix.php' class='button'>Corriger les fichiers manquants</a></p>";
            } else {
                echo "<p class='success'>Tous les fichiers critiques sont présents!</p>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>2. Options de déploiement</h2>
            <p>Choisissez une méthode de déploiement:</p>
            
            <a href="trigger-github-workflow.php" class="button">Déployer via GitHub Actions</a>
            <a href="check-github-workflow.php" class="button blue">Vérifier le workflow GitHub</a>
            <a href="fix-workflow-yaml.php" class="button">Corriger YAML Workflow</a>
            <a href="php-test-minimal.php" class="button blue">Test PHP minimal</a>
        </div>
        
        <div class="card">
            <h2>3. Diagnostic et corrections</h2>
            <div style="display: flex; flex-wrap: wrap;">
                <a href="fix-infomaniak-assets.php" class="button">Corriger les assets</a>
                <a href="api/diagnose-assets-paths.php" class="button">Diagnostiquer les chemins assets</a>
                <a href="fix-htaccess.php" class="button">Corriger .htaccess</a>
                <a href="deploy-fix-php.php" class="button blue">Corriger déploiement PHP</a>
            </div>
        </div>
    </div>
</body>
</html>
