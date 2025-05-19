<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Création du dossier api-tools</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 3px solid green; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 3px solid red; }
        .box { border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Création des dossiers manquants</h1>
    
    <?php
    // Liste des dossiers à vérifier/créer
    $directories = [
        'api-tools',
        'api/config',
        'api/utils',
        'assets',
        'public/lovable-uploads'
    ];
    
    $created = [];
    $already_exists = [];
    $errors = [];
    
    foreach ($directories as $dir) {
        if (!file_exists($dir)) {
            // Tenter de créer le dossier
            if (mkdir($dir, 0755, true)) {
                $created[] = $dir;
                
                // Si c'est api-tools, créer les fichiers nécessaires
                if ($dir === 'api-tools') {
                    // Créer .gitkeep
                    file_put_contents('api-tools/.gitkeep', '');
                    
                    // Créer index.php
                    $index_content = <<<EOT
<?php
// Redirection vers la vérification des routes
header('Location: check-routes.php');
exit;
?>
EOT;
                    file_put_contents('api-tools/index.php', $index_content);
                    
                    // Créer check-routes.php
                    $check_content = <<<EOT
<?php
header('Content-Type: text/html; charset=utf-8');
echo "<h1>Vérification des Routes</h1>";
echo "<p>Cet outil permet de vérifier les routes définies dans l'application.</p>";
?>
EOT;
                    file_put_contents('api-tools/check-routes.php', $check_content);
                }
            } else {
                $errors[] = $dir;
            }
        } else {
            $already_exists[] = $dir;
        }
    }
    ?>
    
    <div class="box">
        <h2>Résultat de l'opération</h2>
        
        <?php if (!empty($created)): ?>
            <div class="success">
                <h3>Dossiers créés avec succès:</h3>
                <ul>
                    <?php foreach ($created as $dir): ?>
                        <li><?php echo htmlspecialchars($dir); ?></li>
                    <?php endforeach; ?>
                </ul>
                
                <?php if (in_array('api-tools', $created)): ?>
                    <p>Les fichiers suivants ont également été créés dans le dossier api-tools:</p>
                    <ul>
                        <li>api-tools/.gitkeep</li>
                        <li>api-tools/index.php</li>
                        <li>api-tools/check-routes.php</li>
                    </ul>
                <?php endif; ?>
            </div>
        <?php endif; ?>
        
        <?php if (!empty($already_exists)): ?>
            <h3>Dossiers déjà existants:</h3>
            <ul>
                <?php foreach ($already_exists as $dir): ?>
                    <li><?php echo htmlspecialchars($dir); ?></li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
        
        <?php if (!empty($errors)): ?>
            <div class="error">
                <h3>Erreurs lors de la création des dossiers:</h3>
                <ul>
                    <?php foreach ($errors as $dir): ?>
                        <li><?php echo htmlspecialchars($dir); ?></li>
                    <?php endforeach; ?>
                </ul>
                <p>Vérifiez les permissions d'écriture sur le serveur. Contactez votre hébergeur si nécessaire.</p>
            </div>
        <?php endif; ?>
    </div>
    
    <div class="box">
        <h2>Structure actuelle des dossiers</h2>
        <pre><?php echo htmlspecialchars(shell_exec('find . -type d -maxdepth 3 | sort')); ?></pre>
    </div>
    
    <div class="box">
        <h2>Prochaines étapes</h2>
        <p>Maintenant que les dossiers ont été vérifiés/créés:</p>
        <ol>
            <li>Lancez le workflow GitHub Action pour le déploiement</li>
            <li>Si vous avez encore des erreurs, exécutez <a href="check-mkdir.php">check-mkdir.php</a> pour une vérification détaillée</li>
        </ol>
    </div>
</body>
</html>
