
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des workflows GitHub</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .active { background-color: #d4edda; border-color: #c3e6cb; }
        .disabled { background-color: #f8f9fa; border-color: #ddd; color: #6c757d; }
        .warning { background-color: #fff3cd; border-color: #ffeeba; }
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
            margin: 5px;
        }
        .button.blue { background-color: #2196F3; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Vérification des workflows GitHub</h1>
        
        <div class="card">
            <h2>Statut des workflows de déploiement</h2>
            
            <?php
            $workflows = [
                '.github/workflows/deploy.yml' => 'Workflow original',
                '.github/workflows/deploy-simple.yml' => 'Workflow simplifié',
                '.github/workflows/deploy-optimized.yml' => 'Workflow optimisé',
                '.github/workflows/deploy-unified.yml' => 'Workflow unifié (recommandé)'
            ];
            
            $activeWorkflows = [];
            $disabledWorkflows = [];
            
            foreach ($workflows as $path => $description) {
                if (file_exists($path)) {
                    $activeWorkflows[$path] = $description;
                } elseif (file_exists($path . '.disabled')) {
                    $disabledWorkflows[$path . '.disabled'] = $description;
                }
            }
            
            // Afficher les workflows actifs
            if (!empty($activeWorkflows)) {
                echo "<h3>Workflows actifs:</h3>";
                echo "<ul>";
                foreach ($activeWorkflows as $path => $description) {
                    $class = ($path === '.github/workflows/deploy-unified.yml') ? 'active' : 'warning';
                    echo "<li class='$class'><strong>$path</strong>: $description";
                    if ($path !== '.github/workflows/deploy-unified.yml') {
                        echo " <em>(Il est recommandé de désactiver ce workflow)</em>";
                    }
                    echo "</li>";
                }
                echo "</ul>";
            } else {
                echo "<p>Aucun workflow actif trouvé.</p>";
            }
            
            // Afficher les workflows désactivés
            if (!empty($disabledWorkflows)) {
                echo "<h3>Workflows désactivés:</h3>";
                echo "<ul class='disabled'>";
                foreach ($disabledWorkflows as $path => $description) {
                    echo "<li><strong>$path</strong>: $description (désactivé)</li>";
                }
                echo "</ul>";
            }
            
            // Afficher des recommandations
            if (count($activeWorkflows) > 1) {
                echo "<div class='card warning'>";
                echo "<h3>⚠️ Attention: Plusieurs workflows actifs</h3>";
                echo "<p>Vous avez actuellement plusieurs workflows de déploiement actifs, ce qui peut causer des conflits.</p>";
                echo "<p>Il est recommandé de n'utiliser que le workflow unifié et de désactiver les autres.</p>";
                echo "<p>Utilisez le script <code>disable-old-workflows.sh</code> pour désactiver automatiquement les anciens workflows.</p>";
                echo "</div>";
            } elseif (isset($activeWorkflows['.github/workflows/deploy-unified.yml']) && count($activeWorkflows) === 1) {
                echo "<div class='card active'>";
                echo "<h3>✅ Configuration optimale</h3>";
                echo "<p>Vous utilisez uniquement le workflow unifié, ce qui est la configuration recommandée.</p>";
                echo "</div>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Vérification du contenu du workflow unifié</h2>
            <?php
            $unifiedWorkflowPath = '.github/workflows/deploy-unified.yml';
            if (file_exists($unifiedWorkflowPath)) {
                $content = file_get_contents($unifiedWorkflowPath);
                
                // Vérifier les éléments essentiels
                $checks = [
                    'api/documentation' => strpos($content, 'mkdir -p deploy/api/documentation') !== false,
                    'Copie des fichiers PHP' => strpos($content, 'find api -name "*.php"') !== false,
                    'Configuration env.php' => strpos($content, 'echo "<?php" > deploy/api/config/env.php') !== false,
                    'Vérification des fichiers critiques' => strpos($content, '=== Vérification des fichiers critiques ===') !== false
                ];
                
                echo "<h3>Éléments essentiels:</h3>";
                echo "<ul>";
                foreach ($checks as $element => $isPresent) {
                    $status = $isPresent ? '✅' : '❌';
                    $class = $isPresent ? 'active' : 'warning';
                    echo "<li class='$class'>$status $element</li>";
                }
                echo "</ul>";
                
                // Afficher les premières lignes du fichier
                echo "<h3>Aperçu du contenu:</h3>";
                $lines = explode("\n", $content);
                $previewLines = array_slice($lines, 0, 15); // Afficher les 15 premières lignes
                echo "<pre>" . htmlspecialchars(implode("\n", $previewLines)) . "\n...[suite du contenu]</pre>";
            } else {
                echo "<p>Le workflow unifié n'a pas été trouvé à l'emplacement attendu: <code>$unifiedWorkflowPath</code></p>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Actions</h2>
            <p><a href="deploy-on-infomaniak.php" class="button">Retour à la page de déploiement</a></p>
            <p><a href="disable-old-workflows.php" class="button blue">Désactiver les anciens workflows</a></p>
        </div>
    </div>
</body>
</html>
