
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Désactivation des anciens workflows GitHub</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 3px solid green; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 3px solid red; }
        .warning { color: orange; background-color: #fffbf0; padding: 10px; border-left: 3px solid orange; }
        button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Désactivation des anciens workflows GitHub</h1>
        
        <div class="card">
            <h2>Workflows GitHub Actions</h2>
            <?php
            $workflow_dir = './.github/workflows';
            $unified_workflow = './.github/workflows/deploy-unified.yml';
            $files = [];
            $success_message = '';
            $error_message = '';
            
            if (is_dir($workflow_dir)) {
                $files = scandir($workflow_dir);
                $files = array_filter($files, function($file) use ($unified_workflow) {
                    return pathinfo($file, PATHINFO_EXTENSION) === 'yml' && 
                           "$workflow_dir/$file" !== $unified_workflow && 
                           !str_ends_with($file, '.disabled.yml');
                });
            }
            
            if (isset($_POST['disable_all'])) {
                $success_count = 0;
                $error_count = 0;
                
                foreach ($files as $file) {
                    $file_path = "$workflow_dir/$file";
                    $new_path = "$file_path.disabled";
                    
                    if (rename($file_path, $new_path)) {
                        $success_count++;
                    } else {
                        $error_count++;
                    }
                }
                
                if ($success_count > 0) {
                    $success_message = "$success_count workflow(s) ont été désactivés avec succès.";
                }
                
                if ($error_count > 0) {
                    $error_message = "Impossible de désactiver $error_count workflow(s).";
                }
                
                // Recharger la liste des fichiers
                $files = scandir($workflow_dir);
                $files = array_filter($files, function($file) use ($unified_workflow) {
                    return pathinfo($file, PATHINFO_EXTENSION) === 'yml' && 
                           "$workflow_dir/$file" !== $unified_workflow && 
                           !str_ends_with($file, '.disabled.yml');
                });
            }
            
            if (isset($_POST['enable_unified'])) {
                if (file_exists("$unified_workflow.disabled")) {
                    if (rename("$unified_workflow.disabled", $unified_workflow)) {
                        $success_message = "Le workflow unifié a été activé avec succès.";
                    } else {
                        $error_message = "Impossible d'activer le workflow unifié.";
                    }
                } elseif (!file_exists($unified_workflow)) {
                    $error_message = "Le workflow unifié n'existe pas. Veuillez d'abord le créer.";
                }
            }
            
            if (!empty($success_message)) {
                echo "<div class='success'>$success_message</div>";
            }
            
            if (!empty($error_message)) {
                echo "<div class='error'>$error_message</div>";
            }
            
            // Vérifier si le workflow unifié existe
            $unified_exists = file_exists($unified_workflow);
            $unified_disabled = file_exists("$unified_workflow.disabled");
            
            if ($unified_exists) {
                echo "<div class='success'>Le workflow unifié est actif.</div>";
            } elseif ($unified_disabled) {
                echo "<div class='warning'>Le workflow unifié est désactivé.</div>";
                echo "<form method='post'>";
                echo "<button type='submit' name='enable_unified'>Activer le workflow unifié</button>";
                echo "</form>";
            } else {
                echo "<div class='error'>Le workflow unifié n'existe pas.</div>";
                echo "<p>Utilisez le script <a href='verify-ssh-path.php'>verify-ssh-path.php</a> pour créer le workflow unifié.</p>";
            }
            
            // Afficher les workflows actifs
            if (!empty($files)) {
                echo "<h3>Workflows actifs (hors workflow unifié):</h3>";
                echo "<ul>";
                foreach ($files as $file) {
                    echo "<li><code>$file</code></li>";
                }
                echo "</ul>";
                
                echo "<form method='post'>";
                echo "<button type='submit' name='disable_all'>Désactiver tous les anciens workflows</button>";
                echo "</form>";
                
                echo "<p><strong>Note:</strong> La désactivation renomme les fichiers en ajoutant l'extension '.disabled' et ne les supprime pas.</p>";
            } else {
                echo "<div class='success'>Il n'y a pas d'autres workflows actifs que le workflow unifié.</div>";
            }
            ?>
        </div>
    </div>
</body>
</html>
