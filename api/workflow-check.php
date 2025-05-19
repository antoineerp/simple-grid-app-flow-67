
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
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 3px solid green; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 3px solid red; }
        .warning { color: orange; background-color: #fffbf0; padding: 10px; border-left: 3px solid orange; }
        .button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 10px; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .code-block { background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Vérification des workflows GitHub</h1>
        
        <div class="card">
            <h2>Validation YAML du workflow deploy-unified.yml</h2>
            
            <?php
            $workflow_file = './.github/workflows/deploy-unified.yml';
            
            if (file_exists($workflow_file)) {
                echo "<div class='success'>✅ Le fichier workflow unifié existe.</div>";
                
                // Afficher le contenu du fichier
                $content = file_get_contents($workflow_file);
                echo "<h3>Contenu du fichier workflow:</h3>";
                echo "<pre>" . htmlspecialchars($content) . "</pre>";
                
                // Analyse syntaxique basique du YAML
                $lines = explode("\n", $content);
                $errors = [];
                
                foreach ($lines as $i => $line) {
                    $line_num = $i + 1;
                    
                    // Vérifier les problèmes de syntaxe courants
                    if (strpos($line, "<<") !== false) {
                        $errors[] = "Ligne $line_num: Les blocs heredoc peuvent causer des problèmes en YAML. Envisagez d'utiliser des commandes echo simples.";
                    }
                    
                    // Vérifier les problèmes d'indentation
                    if (preg_match('/^\s+/', $line, $matches)) {
                        $indent = strlen($matches[0]);
                        if ($indent % 2 !== 0) {
                            $errors[] = "Ligne $line_num: L'indentation ($indent espaces) n'est pas un multiple de 2.";
                        }
                    }
                    
                    // Vérifier les problèmes de guillemets
                    if (substr_count($line, '"') % 2 !== 0 && substr_count($line, '\"') === 0) {
                        $errors[] = "Ligne $line_num: Nombre impair de guillemets doubles, potentiellement non fermés.";
                    }
                    
                    if (substr_count($line, "'") % 2 !== 0 && substr_count($line, "\'") === 0) {
                        $errors[] = "Ligne $line_num: Nombre impair de guillemets simples, potentiellement non fermés.";
                    }
                }
                
                if (!empty($errors)) {
                    echo "<div class='error'><strong>Problèmes potentiels détectés:</strong><br>";
                    echo implode("<br>", $errors);
                    echo "</div>";
                } else {
                    echo "<div class='success'>Aucun problème évident de syntaxe YAML détecté.</div>";
                }
                
            } else {
                echo "<div class='error'>❌ Le fichier workflow unifié n'existe pas à l'emplacement attendu.</div>";
                echo "<p>Chemin vérifié: " . realpath('./') . "/.github/workflows/deploy-unified.yml</p>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Comment résoudre les problèmes de workflow</h2>
            
            <h3>1. Corriger les erreurs de syntaxe YAML</h3>
            <p>Si GitHub indique une erreur de syntaxe YAML, voici comment la corriger:</p>
            <ol>
                <li>Localisez la ligne mentionnée dans l'erreur (ex: ligne 59)</li>
                <li>Vérifiez les problèmes courants:
                    <ul>
                        <li>Indentation incorrecte (utilisez toujours des multiples de 2 espaces)</li>
                        <li>Guillemets non fermés</li>
                        <li>Caractères spéciaux non échappés</li>
                        <li>Problèmes avec les blocs heredoc (remplacez par des commandes echo simples)</li>
                    </ul>
                </li>
            </ol>
            
            <h3>2. Déclencher manuellement le workflow</h3>
            <p>Après avoir corrigé les erreurs, vous pouvez déclencher le workflow manuellement:</p>
            <div class="code-block">
                git add .github/workflows/deploy-unified.yml
                git commit -m "Correction de la syntaxe YAML du workflow"
                git push origin main
            </div>
            
            <h3>3. Vérifier les secrets GitHub</h3>
            <p>Assurez-vous que ces secrets sont configurés dans votre dépôt GitHub:</p>
            <ul>
                <li>FTP_SERVER</li>
                <li>FTP_USERNAME</li>
                <li>FTP_PASSWORD</li>
            </ul>
        </div>
        
        <p>
            <a href="verify-workflow-unified.php" class="button">Vérification complète du workflow</a>
        </p>
    </div>
</body>
</html>
