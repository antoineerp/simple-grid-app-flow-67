
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Déclencher le workflow GitHub unifié</title>
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
        }
        .button:hover { background-color: #45a049; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .form-group { margin-bottom: 15px; }
        .input-field { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        .debug-info { margin-top: 20px; padding: 10px; background: #f8f9fa; border-left: 4px solid #17a2b8; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Déclencher le workflow GitHub unifié</h1>
        
        <div class="card">
            <h2>État du fichier de workflow</h2>
            <?php
            $workflow_file = './.github/workflows/deploy-unified.yml';
            $workflow_file_root = './deploy-unified.yml';
            $workflow_file_root_hidden = './.deploy-unified.yml';
            
            if (file_exists($workflow_file)) {
                echo "<div class='success'>Le fichier de workflow a été trouvé dans .github/workflows.</div>";
                echo "<p>Chemin: " . realpath($workflow_file) . "</p>";
                echo "<p>Dernière modification: " . date("Y-m-d H:i:s", filemtime($workflow_file)) . "</p>";
                
                // Vérification basique de la syntaxe YAML
                $content = file_get_contents($workflow_file);
                $lines = explode("\n", $content);
                $lineCount = count($lines);
                
                echo "<p>Le fichier contient {$lineCount} lignes.</p>";
                
                // Rechercher des problèmes de syntaxe communs
                $potentialIssues = array();
                
                for ($i = 0; $i < $lineCount; $i++) {
                    $lineNum = $i + 1;
                    $line = trim($lines[$i]);
                    
                    // Vérifier les indentations incohérentes
                    if (strpos($line, "\t") !== false) {
                        $potentialIssues[] = "Ligne {$lineNum}: Mélange d'espaces et de tabulations";
                    }
                    
                    // Vérifier les guillemets non fermés
                    $singleQuotes = substr_count($line, "'") % 2;
                    $doubleQuotes = substr_count($line, "\"") % 2;
                    if ($singleQuotes !== 0 || $doubleQuotes !== 0) {
                        // Ignorer certains cas spécifiques comme les regex
                        if (strpos($line, "FilesMatch") === false) {
                            $potentialIssues[] = "Ligne {$lineNum}: Possible problème de guillemets non fermés";
                        }
                    }
                    
                    // Problèmes spécifiques connus
                    if ($lineNum == 97 || $lineNum == 96 || $lineNum == 98) {
                        echo "<div class='warning'>Ligne {$lineNum}: <code>" . htmlspecialchars($line) . "</code></div>";
                    }
                }
                
                if (!empty($potentialIssues)) {
                    echo "<div class='warning'><strong>Problèmes potentiels détectés:</strong><ul>";
                    foreach ($potentialIssues as $issue) {
                        echo "<li>{$issue}</li>";
                    }
                    echo "</ul></div>";
                } else {
                    echo "<div class='success'>Aucun problème syntaxique évident n'a été détecté.</div>";
                }
                
                // Afficher les 5 lignes autour de la ligne 97 (problématique)
                echo "<div class='debug-info'>";
                echo "<h3>Contexte de la ligne 97:</h3>";
                echo "<pre>";
                $startLine = max(92, 1);
                $endLine = min(102, $lineCount);
                for ($i = $startLine - 1; $i < $endLine; $i++) {
                    $lineNum = $i + 1;
                    $highlight = ($lineNum >= 96 && $lineNum <= 98) ? "style='background-color:#fff3cd;'" : "";
                    echo "<div {$highlight}><strong>{$lineNum}:</strong> " . htmlspecialchars($lines[$i]) . "</div>";
                }
                echo "</pre></div>";
                
            } elseif (file_exists($workflow_file_root)) {
                echo "<div class='warning'>Le fichier de workflow a été trouvé à la racine, mais pas dans .github/workflows.</div>";
                echo "<p>Il est recommandé de le déplacer dans le dossier .github/workflows/.</p>";
                echo "<p>Dernière modification: " . date("Y-m-d H:i:s", filemtime($workflow_file_root)) . "</p>";
                
                // Créer le dossier .github/workflows si nécessaire
                if (!is_dir('./.github/workflows')) {
                    if (!is_dir('./.github')) {
                        @mkdir('./.github');
                    }
                    @mkdir('./.github/workflows', 0755, true);
                    
                    if (is_dir('./.github/workflows')) {
                        // Copier le fichier
                        if (copy($workflow_file_root, $workflow_file)) {
                            echo "<div class='success'>Le fichier a été automatiquement copié vers .github/workflows/</div>";
                        } else {
                            echo "<div class='error'>Impossible de copier le fichier vers .github/workflows/</div>";
                        }
                    } else {
                        echo "<div class='error'>Impossible de créer le dossier .github/workflows/</div>";
                    }
                }
            } elseif (file_exists($workflow_file_root_hidden)) {
                echo "<div class='warning'>Le fichier de workflow a été trouvé à la racine (caché), mais pas dans .github/workflows.</div>";
                echo "<p>Il est recommandé de le déplacer dans le dossier .github/workflows/.</p>";
            } else {
                echo "<div class='error'>Le fichier de workflow n'existe pas.</div>";
                echo "<p>Assurez-vous que le fichier deploy-unified.yml est présent dans .github/workflows/</p>";
                echo "<p>Chemins vérifiés:</p><ul>";
                echo "<li>" . realpath('./') . "/.github/workflows/deploy-unified.yml</li>";
                echo "<li>" . realpath('./') . "/deploy-unified.yml</li>";
                echo "</ul>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Déclencher le workflow via l'API GitHub</h2>
            
            <?php
            if (isset($_POST['trigger_workflow'])) {
                $repo_owner = isset($_POST['repo_owner']) ? $_POST['repo_owner'] : 'antoineerp';
                $repo_name = isset($_POST['repo_name']) ? $_POST['repo_name'] : 'qualiopi-ch';
                $workflow_id = isset($_POST['workflow_id']) ? $_POST['workflow_id'] : 'deploy-unified.yml';
                $branch = isset($_POST['branch']) ? $_POST['branch'] : 'main';
                $token = isset($_POST['github_token']) ? $_POST['github_token'] : '';
                
                if (empty($token)) {
                    echo "<div class='error'>Veuillez fournir un token GitHub.</div>";
                } else {
                    // URL de l'API GitHub pour déclencher un workflow
                    $url = "https://api.github.com/repos/{$repo_owner}/{$repo_name}/actions/workflows/{$workflow_id}/dispatches";
                    
                    // Données à envoyer
                    $data = json_encode([
                        'ref' => $branch,
                        'inputs' => [
                            'reason' => 'Déclenchement manuel depuis le site'
                        ]
                    ]);
                    
                    // Configuration de cURL
                    $ch = curl_init($url);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
                    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
                    curl_setopt($ch, CURLOPT_HTTPHEADER, [
                        'Authorization: token ' . $token,
                        'User-Agent: PHP-Trigger-Workflow',
                        'Accept: application/vnd.github.v3+json',
                        'Content-Type: application/json',
                        'Content-Length: ' . strlen($data)
                    ]);
                    curl_setopt($ch, CURLOPT_VERBOSE, true);
                    $verbose = fopen('php://temp', 'w+');
                    curl_setopt($ch, CURLOPT_STDERR, $verbose);
                    
                    // Exécution de la requête
                    $result = curl_exec($ch);
                    $status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    
                    rewind($verbose);
                    $verboseLog = stream_get_contents($verbose);
                    
                    curl_close($ch);
                    
                    // Traitement de la réponse
                    if ($status_code == 204) {
                        echo "<div class='success'>Le workflow a été déclenché avec succès!</div>";
                        echo "<p>Le workflow s'exécutera sur GitHub dans les prochaines minutes.</p>";
                        echo "<p>Vous pouvez vérifier son état sur la page Actions de votre dépôt GitHub.</p>";
                        echo "<p><a href='https://github.com/{$repo_owner}/{$repo_name}/actions' target='_blank' class='button'>Voir les Actions GitHub</a></p>";
                    } else {
                        echo "<div class='error'>Erreur lors du déclenchement du workflow (Code: {$status_code})</div>";
                        echo "<pre>" . htmlspecialchars($result) . "</pre>";
                        echo "<div class='debug-info'>";
                        echo "<h3>Détails de la requête:</h3>";
                        echo "<p>URL: {$url}</p>";
                        echo "<p>Données envoyées: " . htmlspecialchars($data) . "</p>";
                        echo "<p>Log cURL:</p>";
                        echo "<pre>" . htmlspecialchars($verboseLog) . "</pre>";
                        echo "</div>";
                        echo "<p>Vérifiez que le token GitHub a les permissions nécessaires (workflow, repo).</p>";
                        echo "<p>Assurez-vous que le workflow existe et est correctement configuré.</p>";
                    }
                }
            }
            ?>
            
            <form method="post">
                <div class="form-group">
                    <label for="repo_owner">Propriétaire du dépôt:</label>
                    <input type="text" id="repo_owner" name="repo_owner" class="input-field" value="antoineerp" required>
                </div>
                
                <div class="form-group">
                    <label for="repo_name">Nom du dépôt:</label>
                    <input type="text" id="repo_name" name="repo_name" class="input-field" value="qualiopi-ch" required>
                </div>
                
                <div class="form-group">
                    <label for="workflow_id">ID du workflow:</label>
                    <input type="text" id="workflow_id" name="workflow_id" class="input-field" value="deploy-unified.yml" required>
                </div>
                
                <div class="form-group">
                    <label for="branch">Branche:</label>
                    <input type="text" id="branch" name="branch" class="input-field" value="main" required>
                </div>
                
                <div class="form-group">
                    <label for="github_token">Token d'accès personnel GitHub:</label>
                    <input type="password" id="github_token" name="github_token" class="input-field" placeholder="ghp_..." required>
                    <small>Ce token doit avoir les permissions "workflow" et "repo".</small>
                </div>
                
                <button type="submit" name="trigger_workflow" class="button">Déclencher le workflow</button>
            </form>
        </div>
        
        <div class="card">
            <h2>Comment obtenir un token GitHub</h2>
            <ol>
                <li>Connectez-vous à votre compte GitHub</li>
                <li>Cliquez sur votre photo de profil en haut à droite, puis sur "Settings"</li>
                <li>Descendez et cliquez sur "Developer settings" dans le menu de gauche</li>
                <li>Cliquez sur "Personal access tokens" puis "Tokens (classic)"</li>
                <li>Cliquez sur "Generate new token" puis "Generate new token (classic)"</li>
                <li>Donnez un nom à votre token (par exemple "Qualiopi Workflow Trigger")</li>
                <li>Sélectionnez les scopes "repo" (tous) et "workflow"</li>
                <li>Cliquez sur "Generate token"</li>
                <li>Copiez le token généré (vous ne pourrez plus le voir après)</li>
            </ol>
            <p><strong>Note de sécurité:</strong> Ce token donne accès à votre dépôt GitHub. Ne le partagez avec personne et ne le stockez pas en texte clair.</p>
        </div>
        
        <div class="card">
            <h2>Alternative: Exécution locale</h2>
            <p>Si vous préférez exécuter le workflow localement sans passer par GitHub:</p>
            <p><a href="execute-workflow.php" class="button">Exécuter le workflow localement</a></p>
        </div>
    </div>
</body>
</html>
