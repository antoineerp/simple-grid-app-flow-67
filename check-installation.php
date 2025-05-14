
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification Installation FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Vérification de l'Installation FormaCert</h1>
    
    <div class="section">
        <h2>Structure des fichiers</h2>
        <?php
        $expected_directories = [
            'api' => 'API',
            'assets' => 'Assets JS/CSS',
            'public' => 'Public',
            'public/lovable-uploads' => 'Uploads'
        ];
        
        foreach ($expected_directories as $dir => $desc) {
            echo "<p>$desc ($dir): ";
            if (is_dir($dir)) {
                echo "<span class='success'>OK</span>";
                $files = scandir($dir);
                $count = count($files) - 2; // Moins . et ..
                echo " ($count fichiers/dossiers)";
            } else {
                echo "<span class='error'>MANQUANT</span>";
            }
            echo "</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Fichiers essentiels</h2>
        <?php
        $essential_files = [
            '.htaccess' => 'Configuration Apache',
            'index.html' => 'Page principale',
            'api/index.php' => 'Point d\'entrée API',
            'api/config/db_config.json' => 'Configuration Base de données',
            'api/login-test.php' => 'Test d\'authentification'
        ];
        
        foreach ($essential_files as $file => $desc) {
            echo "<p>$desc ($file): ";
            if (file_exists($file)) {
                echo "<span class='success'>OK</span>";
                echo " (" . filesize($file) . " octets)";
            } else {
                echo "<span class='error'>MANQUANT</span>";
            }
            echo "</p>";
        }
        
        // Trouver les fichiers JS et CSS
        $js_files = glob('./assets/*.js');
        if (!empty($js_files)) {
            echo "<p>JavaScript principal: <span class='success'>" . basename($js_files[0]) . "</span> (" . filesize($js_files[0]) . " octets)</p>";
        } else {
            echo "<p>JavaScript principal: <span class='error'>INTROUVABLE</span></p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Recommandations</h2>
        <p>Si des fichiers essentiels sont manquants, les actions recommandées sont:</p>
        <ol>
            <li>Relancer un déploiement complet via GitHub Actions</li>
            <li>Utiliser la page <a href="fix-infomaniak-assets.php">fix-infomaniak-assets.php</a> pour corriger les problèmes d'assets</li>
            <li>Vérifier que le fichier de configuration <code>api/config/db_config.json</code> contient les informations correctes</li>
        </ol>
    </div>
    
    <p>Vous pouvez consulter des diagnostics plus détaillés:</p>
    <p>
        <a href="diagnose-infomaniak.php" style="display:inline-block; background:#4CAF50; color:white; padding:10px 15px; text-decoration:none; border-radius:5px; margin-right:10px;">Diagnostic Infomaniak</a>
        <a href="deploy-check.php" style="display:inline-block; background:#2196F3; color:white; padding:10px 15px; text-decoration:none; border-radius:5px; margin-right:10px;">Vérification Déploiement</a>
        <a href="index.html" style="display:inline-block; background:#607D8B; color:white; padding:10px 15px; text-decoration:none; border-radius:5px;">Page d'accueil</a>
    </p>
</body>
</html>
