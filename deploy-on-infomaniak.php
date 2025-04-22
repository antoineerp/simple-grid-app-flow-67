
<?php
header('Content-Type: text/html; charset=utf-8');
// Fonction pour vérifier que les secrets GitHub sont configurés
function checkGitHubSecrets() {
    $owner = 'antoineerp';
    $repo = 'simple-grid-app-flow-67';
    
    $secretsConfigured = false;
    $secretsMessage = "Impossible de vérifier les secrets GitHub";
    
    return [
        'configured' => $secretsConfigured,
        'message' => $secretsMessage
    ];
}

// Obtenir le statut actuel des secrets
$secretsStatus = checkGitHubSecrets();
?>
<!DOCTYPE html>
<html>
<head>
    <title>Déploiement Manuel sur Infomaniak</title>
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
        }
        .button:hover { background-color: #45a049; }
        .button.secondary {
            background-color: #6c757d;
        }
        .button.secondary:hover {
            background-color: #5a6268;
        }
        .info { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #17a2b8; margin: 10px 0; }
        .warning { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 10px 0; }
        .success { color: green; }
        .error { color: red; }
        .steps { background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 15px; }
        .steps ol { margin-left: 20px; padding-left: 0; }
        .steps li { margin-bottom: 10px; }
        img.screenshot { max-width: 100%; border: 1px solid #ddd; margin: 10px 0; border-radius: 4px; }
        .highlight { background-color: #ffffcc; padding: 2px 5px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Déploiement Manuel sur Infomaniak</h1>
        
        <div class="card">
            <h2>Instructions pour Déployer</h2>
            <p>Cette page vous guide pour déclencher manuellement un déploiement via GitHub Actions vers Infomaniak.</p>
            
            <div class="info">
                <p><strong>Note:</strong> Pour que ce déploiement fonctionne, les secrets GitHub suivants doivent être configurés :</p>
                <ul>
                    <li>FTP_SERVER - Serveur FTP d'Infomaniak</li>
                    <li>FTP_USERNAME - Nom d'utilisateur FTP</li>
                    <li>FTP_PASSWORD - Mot de passe FTP</li>
                </ul>
            </div>
        </div>

        <div class="card">
            <h2>Processus de Déploiement en 3 Étapes</h2>
            
            <div class="steps">
                <h3>Étape 1: Aller à la page Actions de GitHub</h3>
                <p>Cliquez sur le bouton ci-dessous pour ouvrir directement la page des Actions GitHub :</p>
                <?php
                // URL de l'API GitHub pour déclencher le workflow
                $owner = 'antoineerp';  // Remplacez par le propriétaire du dépôt
                $repo = 'simple-grid-app-flow-67';  // Remplacez par le nom du dépôt
                $workflow_id = 'deploy.yml';  // ID du workflow à déclencher
                
                $github_actions_url = "https://github.com/$owner/$repo/actions/workflows/$workflow_id";
                
                echo "<p><a href='$github_actions_url' target='_blank' class='button'>Ouvrir GitHub Actions</a></p>";
                ?>
            </div>
            
            <div class="steps">
                <h3>Étape 2: Lancer le workflow</h3>
                <ol>
                    <li>Sur la page GitHub Actions, cliquez sur le bouton <span class="highlight">"Run workflow"</span> à droite <strong>(IMPORTANT!)</strong></li>
                    <li>Assurez-vous que la branche <span class="highlight">"main"</span> est sélectionnée</li>
                    <li>Cliquez sur le bouton <span class="highlight">"Run workflow"</span> vert pour démarrer le déploiement</li>
                </ol>
                <div class="warning">
                    <p><strong>Attention!</strong> Vous devez explicitement cliquer sur le bouton "Run workflow" sur la page GitHub. L'ouverture de la page ne déclenche pas automatiquement le déploiement.</p>
                </div>
            </div>
            
            <div class="steps">
                <h3>Étape 3: Vérifier le déploiement</h3>
                <ol>
                    <li>Attendez que le workflow se termine (généralement 2-5 minutes)</li>
                    <li>Une fois terminé, vérifiez que le statut est <span class="success">vert</span> (succès)</li>
                    <li>Utilisez l'outil de diagnostic ci-dessous pour confirmer que le déploiement est correct</li>
                </ol>
            </div>
        </div>
        
        <div class="card">
            <h2>Suivi et Vérification</h2>
            <?php
            $actions_url = "https://github.com/$owner/$repo/actions";
            echo "<p>Vous pouvez suivre l'état des déploiements sur la <a href='$actions_url' target='_blank'>page Actions de GitHub</a>.</p>";
            ?>
            
            <p>Une fois le déploiement terminé, vérifiez votre site à l'adresse :</p>
            <p><a href="https://qualiopi.ch/" target="_blank" class="button">Visiter le site</a></p>
            
            <h3>Diagnostic du Déploiement</h3>
            <p>Pour vérifier que votre déploiement a réussi, utilisez notre outil de diagnostic :</p>
            <p>
                <a href="deploy-check.php" target="_blank" class="button">Vérifier le déploiement</a>
                <a href="verify-deploy.php" target="_blank" class="button secondary">Vérification alternative</a>
            </p>
            
            <h3>Problèmes de déploiement fréquents</h3>
            <ul>
                <li><strong>Erreur 500</strong> - Vérifiez les logs d'erreur Apache et l'accès aux fichiers</li>
                <li><strong>Redirections infinies</strong> - Problème probable avec les règles .htaccess</li>
                <li><strong>Fichiers manquants</strong> - Vérifiez la structure du build dans GitHub Actions</li>
                <li><strong>Page blanche</strong> - Vérifiez les erreurs JavaScript dans la console du navigateur</li>
            </ul>
        </div>
    </div>
</body>
</html>

