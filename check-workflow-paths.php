
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des chemins de workflow GitHub</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 4px solid green; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 4px solid red; }
        .warning { color: orange; background-color: #fffaf0; padding: 10px; border-left: 4px solid orange; }
        .button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-right: 10px;
            text-decoration: none;
            display: inline-block;
        }
        .button.secondary { background-color: #2196F3; }
        .button:hover { opacity: 0.9; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Vérification des chemins de workflow GitHub</h1>
        
        <div class="card">
            <h2>État des fichiers de workflow</h2>
            
            <?php
            // Liste des chemins possibles pour les fichiers de workflow
            $workflow_paths = [
                './.github/workflows/deploy-unified.yml',  // Chemin standard
                './deploy-unified.yml',                    // À la racine
                './.github/workflows/deploy.yml',          // Workflow standard
                './deploy.yml',                            // À la racine
                './.github/workflows/deploy-simple.yml',   // Workflow simplifié
                './.github/workflows/deploy-optimized.yml', // Workflow optimisé
                './.github/workflows/deploy-selective.yml', // Workflow sélectif
            ];
            
            $found_workflows = [];
            $misplaced_workflows = [];
            
            foreach ($workflow_paths as $path) {
                if (file_exists($path)) {
                    $found_workflows[$path] = [
                        'path' => $path,
                        'last_modified' => date("Y-m-d H:i:s", filemtime($path)),
                        'size' => filesize($path),
                    ];
                    
                    // Détecter les workflows mal placés (à la racine)
                    if (substr($path, 0, 2) != './' || substr($path, 0, 10) != './.github/') {
                        $misplaced_workflows[] = $path;
                    }
                }
            }
            
            if (!empty($found_workflows)) {
                echo "<div class='success'>" . count($found_workflows) . " fichier(s) de workflow trouvé(s)</div>";
                
                echo "<h3>Fichiers de workflow disponibles:</h3>";
                echo "<ul>";
                foreach ($found_workflows as $path => $info) {
                    echo "<li>";
                    echo "<strong>" . htmlspecialchars($path) . "</strong>";
                    echo " - Dernière modification: " . $info['last_modified'];
                    echo " - Taille: " . $info['size'] . " octets";
                    echo "</li>";
                }
                echo "</ul>";
                
                if (!empty($misplaced_workflows)) {
                    echo "<div class='warning'><strong>Attention:</strong> Certains fichiers de workflow ne sont pas dans le dossier standard <code>.github/workflows/</code>:</div>";
                    echo "<ul>";
                    foreach ($misplaced_workflows as $path) {
                        echo "<li>" . htmlspecialchars($path) . "</li>";
                    }
                    echo "</ul>";
                    echo "<p>GitHub Actions recherche les fichiers de workflow dans le dossier <code>.github/workflows/</code>. Les fichiers à la racine ne seront pas reconnus comme des workflows.</p>";
                    
                    // Afficher le bouton pour corriger les chemins
                    if (isset($_POST['fix_paths'])) {
                        $fixed = 0;
                        foreach ($misplaced_workflows as $path) {
                            $filename = basename($path);
                            $new_path = "./.github/workflows/{$filename}";
                            
                            // Créer le répertoire s'il n'existe pas
                            if (!is_dir('./.github/workflows')) {
                                if (!is_dir('./.github')) {
                                    mkdir('./.github');
                                }
                                mkdir('./.github/workflows', 0755, true);
                            }
                            
                            // Copier le fichier
                            if (copy($path, $new_path)) {
                                echo "<div class='success'>Fichier <code>{$path}</code> copié vers <code>{$new_path}</code></div>";
                                $fixed++;
                            } else {
                                echo "<div class='error'>Impossible de copier <code>{$path}</code> vers <code>{$new_path}</code></div>";
                            }
                        }
                        
                        if ($fixed > 0) {
                            echo "<div class='success'>{$fixed} fichier(s) corrigé(s). Rafraîchissez la page pour voir les changements.</div>";
                        }
                    } else {
                        echo "<form method='post'>";
                        echo "<button type='submit' name='fix_paths' class='button'>Déplacer les fichiers vers .github/workflows/</button>";
                        echo "</form>";
                    }
                }
                
                // Validation de la syntaxe YAML
                echo "<h3>Validation de la syntaxe YAML:</h3>";
                
                foreach ($found_workflows as $path => $info) {
                    echo "<h4>" . htmlspecialchars($path) . ":</h4>";
                    
                    $content = file_get_contents($path);
                    $lines = explode("\n", $content);
                    $lineCount = count($lines);
                    
                    $potentialIssues = [];
                    
                    // Chercher des problèmes de syntaxe YAML courants
                    for ($i = 0; $i < $lineCount; $i++) {
                        $lineNum = $i + 1;
                        $line = $lines[$i];
                        
                        // Vérifier les cas de création de fichier via shell script
                        $nextLine = ($i < $lineCount - 1) ? $lines[$i + 1] : '';
                        
                        // Problèmes avec les blocs de création de fichier
                        if (preg_match('/cat\s*>\s*.*\s*<<\s*[\'"]*EOL[\'"]*\s*$/', $line)) {
                            // Rechercher si la ligne suivante commence correctement
                            if (!empty($nextLine) && $nextLine[0] !== '#' && $nextLine[0] !== ' ' && $nextLine[0] !== '\t') {
                                $potentialIssues[] = "Ligne {$lineNum}: Le bloc de création de fichier avec EOL doit être suivi d'une ligne vide ou commencer par un commentaire";
                            }
                        }
                        
                        // Vérifier les échos dans le script shell qui contiennent des guillemets non échappés
                        if (strpos($line, 'echo "') !== false && substr_count($line, '"') % 2 !== 0) {
                            $potentialIssues[] = "Ligne {$lineNum}: Guillemets non fermés dans une commande echo";
                        }
                        
                        // Vérifier si la ligne commence par un caractère spécial sans être une clé YAML
                        if (!empty($line) && !preg_match('/^\s*#/', $line) && !preg_match('/^\s*-/', $line) && !preg_match('/^\s*\w+\s*:/', $line) && !preg_match('/^\s*".*"\s*:/', $line) && !preg_match('/^\s+/', $line)) {
                            $potentialIssues[] = "Ligne {$lineNum}: La ligne ne suit pas le format YAML standard (devrait commencer par une clé, un tiret, un espace ou un commentaire)";
                        }
                    }
                    
                    if (!empty($potentialIssues)) {
                        echo "<div class='error'><strong>Problèmes potentiels détectés:</strong></div>";
                        echo "<ul>";
                        foreach ($potentialIssues as $issue) {
                            echo "<li>{$issue}</li>";
                        }
                        echo "</ul>";
                        
                        // Si c'est un problème de YAML, proposer de corriger
                        if (isset($_POST['fix_yaml_' . md5($path)])) {
                            $fixed_content = $content;
                            
                            // Pour les problèmes de blocs EOL sans espace, ajouter une ligne
                            $fixed_content = preg_replace('/cat\s*>\s*.*\s*<<\s*[\'"]*EOL[\'"]*\s*$/m', "$0\n", $fixed_content);
                            
                            if (file_put_contents($path, $fixed_content)) {
                                echo "<div class='success'>Fichier corrigé! Rafraîchissez la page pour voir les changements.</div>";
                            } else {
                                echo "<div class='error'>Impossible de corriger le fichier.</div>";
                            }
                        } else {
                            echo "<form method='post'>";
                            echo "<button type='submit' name='fix_yaml_" . md5($path) . "' class='button'>Essayer de corriger automatiquement</button>";
                            echo "</form>";
                        }
                    } else {
                        echo "<div class='success'>Aucun problème évident détecté dans ce fichier.</div>";
                    }
                }
            } else {
                echo "<div class='error'>Aucun fichier de workflow trouvé!</div>";
                
                // Proposer de créer un workflow de base
                if (isset($_POST['create_workflow'])) {
                    if (!is_dir('./.github/workflows')) {
                        if (!is_dir('./.github')) {
                            mkdir('./.github');
                        }
                        mkdir('./.github/workflows', 0755, true);
                    }
                    
                    $basic_workflow = <<<EOL
name: Basic Deploy to Infomaniak

on:
  push:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      reason:
        description: 'Raison du déploiement manuel'
        required: false
        default: 'Déploiement manuel'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install Dependencies
      run: npm install --legacy-peer-deps
      
    - name: Build React App
      run: npm run build
      
    - name: Prepare for deployment
      run: |
        mkdir -p deploy
        cp -r dist/* deploy/
        
    - name: Deploy to Infomaniak
      uses: SamKirkland/FTP-Deploy-Action@v4.3.4
      with:
        server: \${{ secrets.FTP_SERVER }}
        username: \${{ secrets.FTP_USERNAME }}
        password: \${{ secrets.FTP_PASSWORD }}
        local-dir: ./deploy/
        server-dir: /sites/qualiopi.ch/
EOL;
                    
                    if (file_put_contents('./.github/workflows/deploy-basic.yml', $basic_workflow)) {
                        echo "<div class='success'>Workflow de base créé avec succès! Rafraîchissez la page pour voir les changements.</div>";
                    } else {
                        echo "<div class='error'>Impossible de créer le workflow.</div>";
                    }
                } else {
                    echo "<form method='post'>";
                    echo "<button type='submit' name='create_workflow' class='button'>Créer un workflow de base</button>";
                    echo "</form>";
                }
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Liens utiles</h2>
            <p>
                <a href="trigger-github-workflow-unified.php" class="button">Déclencheur de workflow</a>
                <a href="check-github-deployment.php" class="button secondary">Vérifier le déploiement</a>
                <a href="deploy-on-infomaniak.php" class="button secondary">Déploiement manuel</a>
            </p>
        </div>
    </div>
</body>
</html>
