
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
            <h2>Workflows disponibles</h2>
            <?php
            // Liste des chemins possibles pour les fichiers de workflow
            $workflow_paths = [
                './.github/workflows/deploy-unified.yml',  // Chemin standard
                './.github/workflows/deploy.yml',          // Workflow standard
                './deploy-unified.yml',                    // À la racine (rapporté par l'utilisateur)
                './.deploy-unified.yml',                   // Caché à la racine
                './deploy.yml',                            // Alternative à la racine
            ];
            
            $found_workflows = [];
            
            foreach ($workflow_paths as $path) {
                if (file_exists($path)) {
                    $found_workflows[$path] = [
                        'path' => $path,
                        'last_modified' => date("Y-m-d H:i:s", filemtime($path)),
                        'size' => filesize($path),
                    ];
                }
            }
            
            if (!empty($found_workflows)) {
                echo "<div class='success'>Fichiers de workflow trouvés: " . count($found_workflows) . "</div>";
                echo "<ul>";
                foreach ($found_workflows as $path => $info) {
                    echo "<li><strong>" . htmlspecialchars($path) . "</strong>";
                    echo " - Dernière modification: " . $info['last_modified'];
                    echo " - Taille: " . $info['size'] . " octets";
                    echo "</li>";
                }
                echo "</ul>";
            } else {
                echo "<div class='error'>Aucun fichier de workflow trouvé!</div>";
                echo "<p>Les chemins suivants ont été vérifiés:</p><ul>";
                foreach ($workflow_paths as $path) {
                    echo "<li>" . htmlspecialchars($path) . "</li>";
                }
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
                    <select id="workflow_id" name="workflow_id" class="input-field" required>
                        <?php
                        // Remplir le sélecteur avec les workflows trouvés
                        if (!empty($found_workflows)) {
                            foreach ($found_workflows as $path => $info) {
                                $filename = basename($path);
                                $selected = ($filename === 'deploy.yml') ? 'selected' : '';
                                echo "<option value='{$filename}' {$selected}>{$filename} (OK)</option>";
                            }
                        } else {
                            echo "<option value='deploy.yml'>deploy.yml (standard)</option>";
                            echo "<option value='deploy-unified.yml'>deploy-unified.yml (unifié)</option>";
                        }
                        ?>
                    </select>
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
