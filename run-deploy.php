
<?php
header('Content-Type: text/html; charset=utf-8');

// Fonction pour exécuter le script de déploiement
function runDeployment() {
    // Rendre le script exécutable si besoin
    @chmod('./deploy.sh', 0755);
    
    // Capturer la sortie du script
    $output = shell_exec('./deploy.sh 2>&1');
    
    return $output;
}

// Exécuter le déploiement
$result = runDeployment();
?>

<!DOCTYPE html>
<html>
<head>
    <title>Déploiement de l'Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .output { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; overflow-x: auto; white-space: pre-wrap; }
        .success { color: green; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .actions { margin-top: 20px; padding: 10px; background: #eef2f7; border-radius: 5px; }
        .button { display: inline-block; padding: 8px 15px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin-right: 10px; }
    </style>
</head>
<body>
    <h1>Déploiement de l'Application</h1>
    
    <div>
        <h2>Résultat du déploiement</h2>
        <div class="output"><?php echo htmlspecialchars($result); ?></div>
    </div>
    
    <div class="actions">
        <h3>Actions supplémentaires</h3>
        <p>Après le déploiement, vous pouvez vérifier et corriger les références d'assets:</p>
        
        <a href="check-css-build.php" class="button">Vérifier les fichiers CSS</a>
        <a href="fix-index-html.php" class="button">Corriger les références dans index.html</a>
        
        <?php if (file_exists('./deploy/index.html')): ?>
            <a href="deploy/" class="button">Voir l'application déployée</a>
        <?php endif; ?>
    </div>
</body>
</html>
