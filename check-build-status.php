
<?php
header("Content-Type: text/html; charset=utf-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>État du déploiement</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; line-height: 1.6; }
        .success { color: green; background-color: #f0fff0; padding: 5px; border-left: 3px solid green; }
        .error { color: red; background-color: #fff0f0; padding: 5px; border-left: 3px solid red; }
        .info { background-color: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 4px; }
        code { background-color: #f0f0f0; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
    </style>
</head>
<body>
    <h1>Vérification de l'état du déploiement</h1>
    
    <div class="info">
        <p>Cette page vérifie que tous les fichiers importants ont été correctement déployés.</p>
    </div>
    
    <?php
    // Liste des fichiers critiques à vérifier
    $critical_files = [
        ".htaccess" => "Configuration du serveur web",
        ".user.ini" => "Configuration PHP",
        "phpinfo.php" => "Diagnostic PHP",
        "test-php-execution.php" => "Test d'exécution PHP",
        "force-php-execution.php" => "Test forcé d'exécution PHP",
        "web-php-test.php" => "Test PHP web",
        "api/.htaccess" => "Configuration API"
    ];
    
    $missing_files = [];
    $existing_files = [];
    
    foreach ($critical_files as $file => $description) {
        if (file_exists($file)) {
            $existing_files[$file] = [
                "description" => $description,
                "size" => filesize($file),
                "modified" => date("Y-m-d H:i:s", filemtime($file))
            ];
        } else {
            $missing_files[$file] = $description;
        }
    }
    ?>
    
    <h2>Résumé</h2>
    <?php if (empty($missing_files)): ?>
        <p class="success">✅ Tous les fichiers critiques ont été correctement déployés.</p>
    <?php else: ?>
        <p class="error">❌ Certains fichiers critiques sont manquants.</p>
    <?php endif; ?>
    
    <h2>Détails des fichiers</h2>
    
    <?php if (!empty($existing_files)): ?>
        <h3>Fichiers existants</h3>
        <table>
            <tr>
                <th>Fichier</th>
                <th>Description</th>
                <th>Taille</th>
                <th>Dernière modification</th>
            </tr>
            <?php foreach ($existing_files as $file => $info): ?>
            <tr>
                <td><code><?php echo htmlspecialchars($file); ?></code></td>
                <td><?php echo htmlspecialchars($info["description"]); ?></td>
                <td><?php echo $info["size"]; ?> octets</td>
                <td><?php echo $info["modified"]; ?></td>
            </tr>
            <?php endforeach; ?>
        </table>
    <?php endif; ?>
    
    <?php if (!empty($missing_files)): ?>
        <h3>Fichiers manquants</h3>
        <table>
            <tr>
                <th>Fichier</th>
                <th>Description</th>
            </tr>
            <?php foreach ($missing_files as $file => $description): ?>
            <tr>
                <td><code><?php echo htmlspecialchars($file); ?></code></td>
                <td><?php echo htmlspecialchars($description); ?></td>
            </tr>
            <?php endforeach; ?>
        </table>
        
        <div class="info">
            <p><strong>Solution:</strong> Relancez le workflow de déploiement GitHub ou créez manuellement les fichiers manquants.</p>
        </div>
    <?php endif; ?>
</body>
</html>
