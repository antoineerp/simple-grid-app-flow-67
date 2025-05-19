
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification du Workflow Unifié</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 3px solid green; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 3px solid red; }
        .warning { color: orange; background-color: #fffbf0; padding: 10px; border-left: 3px solid orange; }
        .button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 10px; }
        .button.secondary { background-color: #2196F3; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Vérification du Workflow Unifié</h1>
        
        <div class="card">
            <h2>Status du workflow deploy-unified.yml</h2>
            
            <?php
            $workflowFile = './.github/workflows/deploy-unified.yml';
            
            if (file_exists($workflowFile)) {
                echo "<div class='success'>✅ Le fichier workflow unifié existe.</div>";
                
                // Vérifier si le contenu est correct
                $content = file_get_contents($workflowFile);
                
                // Vérifier les éléments essentiels
                $checks = [
                    'SamKirkland/FTP-Deploy-Action@v4.3.4' => strpos($content, 'SamKirkland/FTP-Deploy-Action@v4.3.4') !== false,
                    'Copie du dossier dist' => strpos($content, 'cp -r dist deploy/') !== false,
                    'Configuration des dossiers' => strpos($content, 'mkdir -p deploy/api-tools') !== false,
                    'Création API tools' => strpos($content, 'api-tools/index.php') !== false
                ];
                
                $allPassed = true;
                echo "<h3>Vérification des éléments essentiels:</h3><ul>";
                foreach ($checks as $item => $passed) {
                    $status = $passed ? "✅" : "❌";
                    $class = $passed ? "success" : "error";
                    echo "<li><span class='$class'>$status $item</span></li>";
                    if (!$passed) $allPassed = false;
                }
                echo "</ul>";
                
                if ($allPassed) {
                    echo "<div class='success'>✅ Le contenu du workflow semble correct.</div>";
                } else {
                    echo "<div class='error'>❌ Certains éléments nécessaires sont manquants dans le workflow.</div>";
                    
                    // Proposer de remplacer le fichier
                    if (isset($_POST['fix-workflow'])) {
                        // Sauvegarder l'ancien fichier
                        copy($workflowFile, $workflowFile . '.bak');
                        
                        // Écrire le nouveau contenu
                        $fixedContent = file_get_contents('https://raw.githubusercontent.com/votre-compte/votre-repo/main/.github/workflows/deploy-unified.yml');
                        file_put_contents($workflowFile, $fixedContent);
                        
                        echo "<div class='success'>✅ Le workflow a été mis à jour. Veuillez rafraîchir cette page.</div>";
                    } else {
                        echo "<form method='post'>";
                        echo "<button type='submit' name='fix-workflow' class='button'>Réparer le workflow</button>";
                        echo "</form>";
                    }
                }
            } else {
                echo "<div class='error'>❌ Le fichier workflow unifié n'existe pas.</div>";
                
                // Proposer de créer le fichier
                if (isset($_POST['create-workflow'])) {
                    if (!is_dir('./.github/workflows')) {
                        mkdir('./.github/workflows', 0755, true);
                    }
                    
                    // Créer le fichier deploy-unified.yml
                    $workflowContent = file_get_contents('https://raw.githubusercontent.com/votre-compte/votre-repo/main/.github/workflows/deploy-unified.yml');
                    file_put_contents($workflowFile, $workflowContent);
                    
                    echo "<div class='success'>✅ Le workflow unifié a été créé. Veuillez rafraîchir cette page.</div>";
                } else {
                    echo "<form method='post'>";
                    echo "<button type='submit' name='create-workflow' class='button'>Créer le workflow unifié</button>";
                    echo "</form>";
                }
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Vérification de GitHub Actions</h2>
            
            <p>Pour vérifier si le workflow fonctionne sur GitHub :</p>
            <ol>
                <li>Allez sur votre dépôt GitHub dans l'onglet "Actions"</li>
                <li>Vérifiez si le workflow "Déploiement Unifié vers Infomaniak" est présent</li>
                <li>S'il est présent mais n'a jamais été exécuté, cliquez sur "Run workflow"</li>
            </ol>
            
            <p>Si le workflow n'apparaît pas dans GitHub Actions, assurez-vous :</p>
            <ul>
                <li>D'avoir commité et poussé le fichier deploy-unified.yml vers GitHub</li>
                <li>Que le fichier ne contient pas d'erreurs de syntaxe YAML</li>
                <li>Que les workflows n'ont pas été désactivés au niveau du dépôt</li>
            </ul>
            
            <h3>Forcer un déploiement</h3>
            <p>Pour forcer un déploiement, exécutez ces commandes :</p>
            <pre>git add .github/workflows/deploy-unified.yml
git commit -m "Mise à jour du workflow de déploiement"
git push origin main</pre>
            
            <p>Ou créez un commit vide pour déclencher le workflow :</p>
            <pre>git commit --allow-empty -m "Force deployment"
git push origin main</pre>
            
            <h3>Vérifier les secrets GitHub</h3>
            <p>Assurez-vous que ces secrets sont configurés dans votre dépôt GitHub :</p>
            <ul>
                <li>FTP_SERVER - Le serveur FTP d'Infomaniak</li>
                <li>FTP_USERNAME - Votre nom d'utilisateur FTP</li>
                <li>FTP_PASSWORD - Votre mot de passe FTP</li>
            </ul>
        </div>
        
        <p>
            <a href="check-github-workflow.php" class="button">Vérification détaillée du workflow</a>
            <a href="check-deployment-issues.php" class="button secondary">Diagnostiquer les problèmes de déploiement</a>
        </p>
    </div>
</body>
</html>
