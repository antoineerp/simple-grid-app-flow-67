
<?php
// Éviter l'erreur "headers already sent"
// Assurez-vous qu'il n'y a aucun espace ou sortie avant cette ligne
ob_start();
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification du Workflow GitHub</title>
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
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .steps { background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Vérification du Workflow GitHub</h1>
        
        <div class="card">
            <h2>Validation du fichier de workflow</h2>
            
            <?php
            $workflow_file = './.github/workflows/deploy.yml';
            
            if (file_exists($workflow_file)) {
                echo "<p>Fichier de workflow trouvé: <span class='success'>" . basename($workflow_file) . "</span></p>";
                
                // Afficher le contenu du fichier
                $workflow_content = file_get_contents($workflow_file);
                echo "<h3>Contenu du fichier workflow:</h3>";
                echo "<pre>" . htmlspecialchars($workflow_content) . "</pre>";
                
                // Vérifier la syntaxe YAML
                if (function_exists('yaml_parse')) {
                    try {
                        $parsed_yaml = yaml_parse($workflow_content);
                        if ($parsed_yaml !== false) {
                            echo "<p>Syntaxe YAML: <span class='success'>Valide</span></p>";
                        } else {
                            echo "<p>Syntaxe YAML: <span class='error'>Invalide</span></p>";
                        }
                    } catch (Exception $e) {
                        echo "<p>Erreur lors de l'analyse YAML: <span class='error'>" . $e->getMessage() . "</span></p>";
                    }
                } else {
                    echo "<p>Note: L'extension YAML n'est pas disponible pour valider la syntaxe.</p>";
                    
                    // Vérification spécifique des blocs heredoc (EOL)
                    $lines = explode("\n", $workflow_content);
                    $has_heredoc = false;
                    $heredoc_errors = [];
                    
                    for ($i = 0; $i < count($lines); $i++) {
                        $line = $lines[$i];
                        if (strpos($line, "<<") !== false && strpos($line, "EOL") !== false) {
                            $has_heredoc = true;
                            $lineNum = $i + 1;
                            
                            // Vérifier s'il y a un saut de ligne après le délimiteur EOL
                            if ($i + 1 < count($lines)) {
                                $nextLine = $lines[$i + 1];
                                if (strpos($nextLine, "<?php") === 0 || strpos($nextLine, "{") === 0 || strpos($nextLine, ";") === 0) {
                                    echo "<p><span class='warning'>Attention à la ligne $lineNum: Le délimiteur EOL devrait être suivi d'un saut de ligne.</span></p>";
                                    $heredoc_errors[] = $lineNum;
                                }
                            }
                        }
                    }
                    
                    if ($has_heredoc && empty($heredoc_errors)) {
                        echo "<p><span class='success'>Les blocs heredoc (EOL) semblent correctement formatés.</span></p>";
                    }
                }
            } else {
                echo "<p>Fichier de workflow: <span class='error'>Non trouvé</span></p>";
                echo "<p>Chemin vérifié: " . realpath('./') . "/.github/workflows/deploy.yml</p>";
                
                // Vérifier si le dossier .github existe
                if (!is_dir('./.github')) {
                    echo "<p>Dossier .github: <span class='error'>Non trouvé</span></p>";
                    
                    // Créer la structure des dossiers
                    if (!mkdir('./.github/workflows', 0755, true)) {
                        echo "<p><span class='error'>Impossible de créer les dossiers .github/workflows</span></p>";
                    } else {
                        echo "<p><span class='success'>Dossiers .github/workflows créés avec succès</span></p>";
                        
                        // Créer un exemple de fichier workflow
                        $example_workflow = "name: Deploy to Infomaniak\n\non:\n  push:\n    branches: [ main ]\n  workflow_dispatch:\n\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - name: Test\n        run: echo \"Exemple de workflow\"";
                        
                        if (file_put_contents($workflow_file, $example_workflow)) {
                            echo "<p><span class='success'>Fichier exemple de workflow créé</span></p>";
                            echo "<p>Veuillez rafraîchir cette page pour voir les détails.</p>";
                        } else {
                            echo "<p><span class='error'>Impossible de créer le fichier exemple de workflow</span></p>";
                        }
                    }
                } elseif (!is_dir('./.github/workflows')) {
                    echo "<p>Dossier .github trouvé mais sous-dossier workflows: <span class='error'>Non trouvé</span></p>";
                    
                    // Créer le sous-dossier workflows
                    if (!mkdir('./.github/workflows', 0755, true)) {
                        echo "<p><span class='error'>Impossible de créer le dossier .github/workflows</span></p>";
                    } else {
                        echo "<p><span class='success'>Dossier .github/workflows créé avec succès</span></p>";
                    }
                } else {
                    echo "<p>Structure des dossiers correcte, mais fichier deploy.yml: <span class='error'>Non trouvé</span></p>";
                    $files = scandir('./.github/workflows');
                    if (count($files) > 2) {  // Plus que "." et ".."
                        echo "<p>Fichiers trouvés dans ./.github/workflows:</p><ul>";
                        foreach ($files as $file) {
                            if ($file != "." && $file != "..") {
                                echo "<li>$file</li>";
                            }
                        }
                        echo "</ul>";
                    } else {
                        echo "<p>Le dossier .github/workflows est vide</p>";
                    }
                }
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Actions recommandées</h2>
            
            <div class="steps">
                <h3>1. Vérifier les secrets GitHub</h3>
                <p>Les secrets suivants doivent être configurés dans votre dépôt GitHub :</p>
                <ul>
                    <li>FTP_SERVER - Le serveur FTP d'Infomaniak</li>
                    <li>FTP_USERNAME - Votre nom d'utilisateur FTP</li>
                    <li>FTP_PASSWORD - Votre mot de passe FTP</li>
                </ul>
            </div>
            
            <div class="steps">
                <h3>2. Solutions pour déclencher le workflow</h3>
                <p>Si le bouton "Run workflow" n'apparaît pas dans l'interface GitHub, essayez :</p>
                <ul>
                    <li><strong>Corriger la syntaxe YAML</strong> - Vérifiez que le fichier deploy.yml ne contient pas d'erreurs</li>
                    <li><strong>Créer un commit vide</strong> - Exécutez ces commandes pour forcer un déploiement :
                    <pre>git commit --allow-empty -m "Force deployment"
git push origin main</pre></li>
                    <li><strong>Utiliser l'API GitHub</strong> - Si vous avez un token d'accès personnel GitHub :
                    <pre>curl -X POST \
-H "Accept: application/vnd.github.v3+json" \
-H "Authorization: token VOTRE_TOKEN" \
https://api.github.com/repos/VOTRE_NOM/VOTRE_REPO/actions/workflows/deploy.yml/dispatches \
-d '{"ref":"main"}'</pre></li>
                </ul>
            </div>
            
            <p><a href="deploy-on-infomaniak.php" class="button">Retour à la page de déploiement</a></p>
        </div>
    </div>
</body>
</html>
<?php ob_end_flush(); ?>
