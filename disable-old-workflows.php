
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Désactiver les anciens workflows GitHub</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        .button:hover { background-color: #45a049; }
        .log { background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; overflow-x: auto; margin: 10px 0; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Désactivation des anciens workflows GitHub</h1>
        <div class="card">
            <?php
            $workflowDir = './.github/workflows';
            $keepActive = 'deploy-unified';
            $log = [];
            $success = false;
            
            if (!is_dir($workflowDir)) {
                $log[] = "<span class='error'>Erreur : Le dossier $workflowDir n'existe pas.</span>";
            } else {
                $totalFiles = count(glob("$workflowDir/*.yml"));
                $log[] = "Nombre total de workflows trouvés : $totalFiles";
                
                // Désactiver les anciens workflows
                $files = glob("$workflowDir/*.yml");
                foreach ($files as $workflow) {
                    $filename = basename($workflow, '.yml');
                    
                    if ($filename !== $keepActive) {
                        $disabledFile = "$workflow.disabled";
                        
                        if (!file_exists($disabledFile)) {
                            if (rename($workflow, $disabledFile)) {
                                $log[] = "Désactivation du workflow : <b>$filename.yml</b>";
                            } else {
                                $log[] = "<span class='error'>Erreur lors de la désactivation de $filename.yml</span>";
                            }
                        } else {
                            $log[] = "<span class='warning'>Le workflow $filename.yml est déjà désactivé.</span>";
                        }
                    } else {
                        $log[] = "<span class='success'>Conservation du workflow actif : $filename.yml</span>";
                    }
                }
                
                $activeFiles = count(glob("$workflowDir/*.yml"));
                $disabledFiles = count(glob("$workflowDir/*.yml.disabled"));
                
                $log[] = "<br><b>Résumé :</b>";
                $log[] = "Workflows actifs : $activeFiles";
                $log[] = "Workflows désactivés : $disabledFiles";
                
                if (file_exists("$workflowDir/$keepActive.yml")) {
                    $log[] = "<br><span class='success'>✅ Le workflow unifié $keepActive.yml est prêt à être utilisé.</span>";
                    $success = true;
                } else {
                    $log[] = "<br><span class='error'>❌ ERREUR : Le workflow unifié $keepActive.yml n'a pas été trouvé ou n'est pas actif.</span>";
                    $log[] = "<span class='error'>Vérifiez que le fichier existe dans le dossier $workflowDir</span>";
                }
            }
            ?>
            
            <h2>Résultat de l'opération</h2>
            <div class="log">
                <?php foreach ($log as $line): ?>
                    <?php echo $line; ?><br>
                <?php endforeach; ?>
            </div>
            
            <?php if ($success): ?>
            <div>
                <p><b>Prochaine étape :</b> Maintenant que seul le workflow unifié est actif, vous pouvez le déclencher manuellement depuis GitHub Actions ou avec un nouveau commit.</p>
            </div>
            <?php endif; ?>
            
            <p><a href="deploy-on-infomaniak.php" class="button">Retour à la page de déploiement</a></p>
        </div>
    </div>
</body>
</html>
