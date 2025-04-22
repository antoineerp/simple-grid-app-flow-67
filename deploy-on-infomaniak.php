
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Déploiement Manuel sur Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
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
        }
        .button:hover { background-color: #45a049; }
        .info { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #17a2b8; margin: 10px 0; }
        .success { color: green; }
        .error { color: red; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Déploiement Manuel sur Infomaniak</h1>
        
        <div class="card">
            <h2>Instructions</h2>
            <p>Cette page vous permet de déclencher manuellement un déploiement GitHub Actions vers Infomaniak.</p>
            <div class="info">
                <p><strong>Note:</strong> Pour que ce déploiement fonctionne, les secrets GitHub doivent être correctement configurés :</p>
                <ul>
                    <li>FTP_SERVER - Serveur FTP d'Infomaniak</li>
                    <li>FTP_USERNAME - Nom d'utilisateur FTP</li>
                    <li>FTP_PASSWORD - Mot de passe FTP</li>
                </ul>
            </div>
        </div>

        <div class="card">
            <h2>Déclencher un déploiement</h2>
            <p>Cliquez sur le bouton ci-dessous pour déclencher manuellement le workflow GitHub Actions :</p>
            
            <?php
            // URL de l'API GitHub pour déclencher le workflow
            $owner = 'antoineerp';  // Remplacez par le propriétaire du dépôt
            $repo = 'simple-grid-app-flow-67';  // Remplacez par le nom du dépôt
            $workflow_id = 'deploy.yml';  // ID du workflow à déclencher
            
            $trigger_url = "https://github.com/$owner/$repo/actions/workflows/$workflow_id/dispatches";
            
            echo "<p>Pour déclencher le déploiement, visitez : <a href='$trigger_url' target='_blank' class='button'>Déclencher le déploiement GitHub</a></p>";
            ?>
            
            <p>Après avoir cliqué sur le bouton, vous serez redirigé vers GitHub où vous pourrez :</p>
            <ol>
                <li>Vous connecter à votre compte GitHub si nécessaire</li>
                <li>Cliquer sur "Run workflow" et sélectionner la branche "main"</li>
                <li>Cliquer à nouveau sur "Run workflow" pour démarrer le déploiement</li>
            </ol>
        </div>
        
        <div class="card">
            <h2>Vérifier le status du déploiement</h2>
            <?php
            $actions_url = "https://github.com/$owner/$repo/actions";
            echo "<p>Vous pouvez suivre l'état du déploiement sur la <a href='$actions_url' target='_blank'>page Actions de GitHub</a>.</p>";
            ?>
            
            <p>Une fois le déploiement terminé, vous pouvez vérifier votre site à l'adresse suivante :</p>
            <p><a href="https://qualiopi.ch/" target="_blank">https://qualiopi.ch/</a></p>
            
            <h3>Diagnostic</h3>
            <p>Pour vérifier que votre déploiement a réussi, vous pouvez accéder au script de diagnostic :</p>
            <p><a href="deploy-check.php" target="_blank" class="button">Vérifier le déploiement</a></p>
        </div>
    </div>
</body>
</html>
