
<?php
header('Content-Type: text/html; charset=utf-8');

$token = '';  // À remplir avec votre token GitHub
$owner = 'antoineerp';
$repo = 'qualiopi-ch';
$workflow_file = 'deploy.yml';
$ref = 'main';

$success_message = '';
$error_message = '';

// Traiter la demande de déclenchement
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['trigger_workflow'])) {
    $token = isset($_POST['github_token']) ? trim($_POST['github_token']) : '';
    
    if (empty($token)) {
        $error_message = 'Le token GitHub est requis.';
    } else {
        // Appeler l'API GitHub
        $url = "https://api.github.com/repos/{$owner}/{$repo}/actions/workflows/{$workflow_file}/dispatches";
        $data = json_encode(['ref' => $ref]);
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/vnd.github.v3+json',
            'Authorization: token ' . $token,
            'Content-Type: application/json',
            'User-Agent: PHP Curl'
        ]);
        
        $result = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_error = curl_error($ch);
        curl_close($ch);
        
        if ($http_code == 204) {
            $success_message = 'Workflow déclenché avec succès! Le déploiement devrait commencer sous peu.';
        } else {
            $error_message = 'Erreur lors du déclenchement du workflow: ' . 
                            ($curl_error ? $curl_error : "Réponse HTTP {$http_code}") . 
                            '<br>Réponse: ' . htmlspecialchars($result);
        }
    }
}

// Vérifier le statut du dernier workflow
function getLastWorkflowStatus($token, $owner, $repo, $workflow_file) {
    $url = "https://api.github.com/repos/{$owner}/{$repo}/actions/workflows/{$workflow_file}/runs";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/vnd.github.v3+json',
        'Authorization: token ' . $token,
        'User-Agent: PHP Curl'
    ]);
    
    $result = curl_exec($ch);
    curl_close($ch);
    
    $data = json_decode($result, true);
    
    if (isset($data['workflow_runs']) && count($data['workflow_runs']) > 0) {
        $latest_run = $data['workflow_runs'][0];
        return [
            'status' => $latest_run['status'],
            'conclusion' => $latest_run['conclusion'] ?? 'en cours',
            'created_at' => $latest_run['created_at'],
            'html_url' => $latest_run['html_url']
        ];
    }
    
    return null;
}

$workflow_status = null;
if (!empty($token)) {
    $workflow_status = getLastWorkflowStatus($token, $owner, $repo, $workflow_file);
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Déclenchement Manuel du Workflow GitHub</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="text"], textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .button { 
            background-color: #4CAF50; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 16px;
        }
        .button:hover { background-color: #45a049; }
        .success { color: green; padding: 10px; border-left: 4px solid green; background-color: #f0fff0; }
        .error { color: red; padding: 10px; border-left: 4px solid red; background-color: #fff0f0; }
        .info { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #17a2b8; margin: 10px 0; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .status { margin-top: 20px; padding: 15px; border-radius: 5px; }
        .status.running { background-color: #fff8e1; border-left: 4px solid #ffc107; }
        .status.success { background-color: #f0fff0; border-left: 4px solid #4caf50; }
        .status.failure { background-color: #fff0f0; border-left: 4px solid #f44336; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Déclenchement Manuel du Workflow GitHub</h1>
        
        <div class="card">
            <h2>Déclencher le workflow de déploiement</h2>
            
            <?php if ($success_message): ?>
            <div class="success"><?php echo $success_message; ?></div>
            <?php endif; ?>
            
            <?php if ($error_message): ?>
            <div class="error"><?php echo $error_message; ?></div>
            <?php endif; ?>
            
            <form method="post">
                <div class="form-group">
                    <label for="github_token">Token GitHub (avec permissions workflow):</label>
                    <input type="text" id="github_token" name="github_token" required 
                           placeholder="ghp_votre_token_personnel" value="<?php echo htmlspecialchars($token); ?>">
                    <p><small>Ce token ne sera pas sauvegardé sur le serveur.</small></p>
                </div>
                
                <div class="form-group">
                    <button type="submit" name="trigger_workflow" class="button">Déclencher le Workflow</button>
                </div>
            </form>
            
            <?php if ($workflow_status): ?>
            <div class="status <?php echo $workflow_status['conclusion'] === 'success' ? 'success' : ($workflow_status['status'] === 'completed' && $workflow_status['conclusion'] !== 'success' ? 'failure' : 'running'); ?>">
                <h3>Dernier workflow exécuté</h3>
                <p>Statut: <strong><?php echo $workflow_status['status']; ?></strong></p>
                <p>Résultat: <strong><?php echo $workflow_status['conclusion']; ?></strong></p>
                <p>Créé le: <?php echo date('d/m/Y H:i:s', strtotime($workflow_status['created_at'])); ?></p>
                <p><a href="<?php echo $workflow_status['html_url']; ?>" target="_blank">Voir les détails sur GitHub</a></p>
            </div>
            <?php endif; ?>
        </div>
        
        <div class="card">
            <h2>Comment obtenir un token GitHub</h2>
            <ol>
                <li>Allez sur <a href="https://github.com/settings/tokens" target="_blank">https://github.com/settings/tokens</a></li>
                <li>Cliquez sur "Generate new token" puis "Generate new token (classic)"</li>
                <li>Donnez un nom à votre token (ex: "Déploiement Qualiopi CH")</li>
                <li>Sélectionnez les scopes: <code>repo</code> (tous) et <code>workflow</code></li>
                <li>Cliquez sur "Generate token" en bas de la page</li>
                <li>Copiez le token généré et utilisez-le dans le formulaire ci-dessus</li>
            </ol>
            <div class="info">
                <p><strong>Note de sécurité:</strong> Ce token vous donne accès à votre compte GitHub. 
                Ne le partagez pas et ne l'incluez pas dans des fichiers qui seront versionnés.</p>
            </div>
        </div>
        
        <div class="card">
            <h2>Autres méthodes pour déclencher le workflow</h2>
            
            <h3>Via Curl</h3>
            <pre>curl -X POST \
-H "Accept: application/vnd.github.v3+json" \
-H "Authorization: token VOTRE_TOKEN_GITHUB" \
https://api.github.com/repos/antoineerp/qualiopi-ch/actions/workflows/deploy.yml/dispatches \
-d '{"ref":"main"}'</pre>
            
            <h3>Via un commit vide</h3>
            <pre>git commit --allow-empty -m "Force deployment"
git push origin main</pre>
        </div>
    </div>
</body>
</html>
