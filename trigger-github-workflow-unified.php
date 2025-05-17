
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
            // Priorité: d'abord les chemins standard GitHub, puis les emplacements alternatifs
            $workflow_paths = [
                '.github/workflows/deploy-unified.yml',  // Chemin standard GitHub
                '.github/workflows/deploy.yml',          // Workflow standard
                './deploy-unified.yml',                  // À la racine
                './deploy.yml',                          // Alternative à la racine
            ];
            
            $found_workflows = [];
            $github_workflows = [];  // Workflows disponibles sur GitHub (même s'ils n'existent pas localement)
            $github_workflows_ids = [
                'deploy-unified.yml',
                'deploy.yml'
            ];
            
            foreach ($workflow_paths as $path) {
                if (file_exists($path)) {
                    $size = filesize($path);
                    // Ignorer les fichiers vides
                    if ($size > 0) {
                        $found_workflows[$path] = [
                            'path' => $path,
                            'last_modified' => date("Y-m-d H:i:s", filemtime($path)),
                            'size' => $size,
                            'id' => basename($path), // L'ID à utiliser pour l'API GitHub
                        ];
                    } else {
                        // Ajouter un avertissement pour les fichiers vides
                        echo "<div class='warning'>Fichier vide trouvé: " . htmlspecialchars($path) . "</div>";
                    }
                }
            }
            
            // Même si les fichiers n'existent pas localement, ils pourraient exister sur GitHub
            foreach ($github_workflows_ids as $workflow_id) {
                $github_workflows[$workflow_id] = $workflow_id;
            }
            
            if (!empty($found_workflows)) {
                echo "<div class='success'>Fichiers de workflow trouvés localement: " . count($found_workflows) . "</div>";
                echo "<ul>";
                foreach ($found_workflows as $path => $info) {
                    echo "<li><strong>" . htmlspecialchars($path) . "</strong>";
                    echo " - Dernière modification: " . $info['last_modified'];
                    echo " - Taille: " . $info['size'] . " octets";
                    echo " - ID pour API GitHub: " . $info['id'];
                    echo "</li>";
                }
                echo "</ul>";
            } else {
                echo "<div class='warning'>Aucun fichier de workflow valide trouvé localement!</div>";
                echo "<p>Les chemins suivants ont été vérifiés:</p><ul>";
                foreach ($workflow_paths as $path) {
                    echo "<li>" . htmlspecialchars($path) . "</li>";
                }
                echo "</ul>";
                echo "<p><strong>Note:</strong> Même si les fichiers ne sont pas trouvés localement, ils pourraient exister sur GitHub.</p>";
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
                    // Vérifier d'abord les workflows disponibles sur GitHub
                    $workflows_url = "https://api.github.com/repos/{$repo_owner}/{$repo_name}/actions/workflows";
                    
                    $ch_workflows = curl_init($workflows_url);
                    curl_setopt($ch_workflows, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch_workflows, CURLOPT_HTTPHEADER, [
                        'Authorization: token ' . $token,
                        'User-Agent: PHP-Trigger-Workflow',
                        'Accept: application/vnd.github.v3+json'
                    ]);
                    
                    $workflows_result = curl_exec($ch_workflows);
                    $workflows_status = curl_getinfo($ch_workflows, CURLINFO_HTTP_CODE);
                    curl_close($ch_workflows);
                    
                    // Affichage de la liste des workflows disponibles
                    echo "<div class='debug-info'>";
                    echo "<h3>Vérification des workflows disponibles sur GitHub:</h3>";
                    
                    if ($workflows_status == 200) {
                        $workflows_data = json_decode($workflows_result, true);
                        
                        if (isset($workflows_data['workflows']) && !empty($workflows_data['workflows'])) {
                            $available_workflows = [];
                            $workflow_found = false;
                            $valid_workflow_id = null;
                            
                            echo "<p>Workflows disponibles sur GitHub:</p>";
                            echo "<ul>";
                            
                            foreach ($workflows_data['workflows'] as $workflow) {
                                echo "<li>";
                                echo "<strong>" . htmlspecialchars($workflow['name']) . "</strong> - ";
                                echo "ID: " . $workflow['id'] . ", ";
                                echo "Path: " . htmlspecialchars($workflow['path']) . ", ";
                                echo "State: " . $workflow['state'];
                                echo "</li>";
                                
                                $available_workflows[] = [
                                    'id' => $workflow['id'],
                                    'name' => $workflow['name'],
                                    'path' => $workflow['path'],
                                    'state' => $workflow['state'],
                                    'filename' => basename($workflow['path'])
                                ];
                                
                                // Vérifier si c'est le workflow demandé par l'ID de fichier
                                if (basename($workflow['path']) === $workflow_id) {
                                    $workflow_found = true;
                                    $valid_workflow_id = $workflow['id']; // Utiliser l'ID numérique
                                }
                            }
                            
                            echo "</ul>";
                            
                            if ($workflow_found) {
                                // Décider quel ID utiliser pour déclencher le workflow
                                // Option 1: Utiliser le chemin du fichier (comme avant)
                                $trigger_id = $workflow_id;
                                
                                // Option 2: Utiliser l'ID numérique (peut être plus fiable dans certains cas)
                                // $trigger_id = $valid_workflow_id;
                                
                                echo "<div class='success'>Workflow trouvé! Tentative de déclenchement...</div>";
                            } else {
                                echo "<div class='warning'>Workflow '{$workflow_id}' non trouvé dans la liste. Essayez un des workflows listés ci-dessus.</div>";
                                
                                // Suggestion d'un workflow à utiliser
                                if (!empty($available_workflows)) {
                                    $suggested_workflow = null;
                                    
                                    // D'abord, chercher 'deploy' dans le nom
                                    foreach ($available_workflows as $wf) {
                                        if (stripos($wf['name'], 'deploy') !== false || stripos($wf['path'], 'deploy') !== false) {
                                            $suggested_workflow = $wf;
                                            break;
                                        }
                                    }
                                    
                                    // Si rien trouvé, prendre le premier
                                    if (!$suggested_workflow) {
                                        $suggested_workflow = $available_workflows[0];
                                    }
                                    
                                    echo "<p>Suggestion: Essayez d'utiliser le workflow <strong>" . htmlspecialchars($suggested_workflow['name']) . "</strong> (ID de fichier: " . htmlspecialchars($suggested_workflow['filename']) . ")</p>";
                                }
                            }
                        } else {
                            echo "<p>Aucun workflow trouvé dans le dépôt.</p>";
                        }
                    } else {
                        echo "<p>Erreur lors de la récupération des workflows (Code: {$workflows_status})</p>";
                        echo "<pre>" . htmlspecialchars($workflows_result) . "</pre>";
                    }
                    
                    echo "</div>";
                    
                    // Continuer avec la tentative de déclenchement si on a trouvé un workflow ou si l'utilisateur insiste
                    if ($workflows_status != 200 || 
                        (isset($workflow_found) && $workflow_found) || 
                        isset($_POST['force_trigger'])) {
                        
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
                            
                            // Suggestions de dépannage
                            echo "<h3>Suggestions de dépannage:</h3>";
                            echo "<ul>";
                            if ($status_code == 404) {
                                echo "<li>Vérifiez si le nom de fichier du workflow est correct. Essayez d'utiliser un des workflows listés ci-dessus.</li>";
                                echo "<li>Vérifiez que les workflows sont correctement configurés dans le dépôt GitHub.</li>";
                                echo "<li>Assurez-vous que le token GitHub a les permissions nécessaires (workflow, repo).</li>";
                                echo "<li>Si vous avez récemment modifié le workflow, attendez quelques minutes pour que GitHub le reconnaisse.</li>";
                                
                                echo "<form method='post'>";
                                echo "<input type='hidden' name='repo_owner' value='" . htmlspecialchars($repo_owner) . "'>";
                                echo "<input type='hidden' name='repo_name' value='" . htmlspecialchars($repo_name) . "'>";
                                echo "<input type='hidden' name='workflow_id' value='" . htmlspecialchars($workflow_id) . "'>";
                                echo "<input type='hidden' name='branch' value='" . htmlspecialchars($branch) . "'>";
                                echo "<input type='hidden' name='github_token' value='" . htmlspecialchars($token) . "'>";
                                echo "<input type='hidden' name='force_trigger' value='1'>";
                                echo "<button type='submit' name='trigger_workflow' class='button'>Forcer le déclenchement quand même</button>";
                                echo "</form>";
                            } elseif ($status_code == 401) {
                                echo "<li>Votre token GitHub est invalide ou a expiré. Générez un nouveau token.</li>";
                            } elseif ($status_code == 403) {
                                echo "<li>Votre token n'a pas les permissions nécessaires. Assurez-vous qu'il a les scopes 'workflow' et 'repo'.</li>";
                            } elseif ($status_code == 422) {
                                echo "<li>Problème avec la référence (branche). Vérifiez que la branche '{$branch}' existe.</li>";
                            }
                            echo "</ul>";
                            echo "</div>";
                        }
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
                        // Liste des IDs de workflow couramment utilisés
                        $common_workflows = [
                            'deploy.yml' => 'deploy.yml (workflow standard)',
                            'deploy-unified.yml' => 'deploy-unified.yml (workflow unifié)',
                            'main.yml' => 'main.yml (workflow principal)'
                        ];
                        
                        // Ajouter les workflows trouvés localement
                        foreach ($found_workflows as $path => $info) {
                            $filename = basename($path);
                            $selected = ($filename === 'deploy.yml') ? 'selected' : '';
                            echo "<option value='{$filename}' {$selected}>{$filename} (trouvé localement)</option>";
                        }
                        
                        // Ajouter les workflows communs qui ne sont pas déjà listés
                        foreach ($common_workflows as $id => $label) {
                            $already_listed = false;
                            foreach ($found_workflows as $path => $info) {
                                if (basename($path) === $id) {
                                    $already_listed = true;
                                    break;
                                }
                            }
                            
                            if (!$already_listed) {
                                echo "<option value='{$id}'>{$label}</option>";
                            }
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
            <p><a href="check-workflow-paths.php" class="button">Vérifier les chemins des workflows</a></p>
        </div>
    </div>
</body>
</html>
