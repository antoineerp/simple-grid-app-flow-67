
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des dossiers</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f9; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Vérification de la structure des dossiers</h1>
    
    <h2>État des répertoires</h2>
    <ul>
    <?php
    $directories = [
        'api' => 'API principal',
        'api/config' => 'Configuration API',
        'api/controllers' => 'Contrôleurs API',
        'api/models' => 'Modèles API',
        'assets' => 'Assets statiques',
        'public' => 'Fichiers publics',
        'public/lovable-uploads' => 'Uploads d\'images'
    ];
    
    foreach ($directories as $dir => $desc) {
        echo "<li>$desc ($dir): ";
        if (is_dir($dir)) {
            echo "<span class='success'>Existe</span>";
            echo " (Permissions: " . substr(sprintf('%o', fileperms($dir)), -4) . ")";
        } else {
            echo "<span class='error'>N'existe pas</span>";
        }
        echo "</li>";
    }
    ?>
    </ul>
    
    <h2>Comment exécuter le script</h2>
    <p>Pour exécuter le script de création des dossiers via SSH:</p>
    <pre>chmod +x mkdir_script.sh
bash mkdir_script.sh</pre>

    <p>Si vous préférez exécuter le script maintenant directement:</p>
    <?php
    if (isset($_GET['run'])) {
        echo "<h3>Exécution du script...</h3>";
        $output = shell_exec('bash mkdir_script.sh 2>&1');
        echo "<pre>$output</pre>";
        echo "<p><a href='check-mkdir.php'>Rafraîchir pour vérifier les résultats</a></p>";
    } else {
        echo "<p><a href='check-mkdir.php?run=1' style='display: inline-block; background: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;'>Exécuter mkdir_script.sh maintenant</a></p>";
    }
    ?>
</body>
</html>
