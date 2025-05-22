
<?php
header('Content-Type: text/html; charset=utf-8');

function check_directories() {
    $dirs = [
        'dist' => 'Dossier de build',
        'dist/assets' => 'Assets compilés',
        'deploy' => 'Dossier de déploiement',
        'deploy/assets' => 'Assets de déploiement',
        'assets' => 'Assets à la racine'
    ];
    
    $results = [];
    foreach ($dirs as $dir => $desc) {
        $exists = is_dir($dir);
        $count = $exists ? count(glob("$dir/*")) : 0;
        $results[$dir] = [
            'exists' => $exists,
            'count' => $count,
            'description' => $desc
        ];
    }
    
    return $results;
}

function check_deploy_script() {
    $script_path = './deploy.sh';
    if (!file_exists($script_path)) {
        return ['exists' => false, 'content' => ''];
    }
    
    $content = file_get_contents($script_path);
    $has_assets_copy = strpos($content, 'cp -r dist/assets/* deploy/assets/') !== false;
    
    return [
        'exists' => true,
        'content' => $content,
        'has_assets_copy' => $has_assets_copy
    ];
}

function check_github_workflow() {
    $workflow_path = './.github/workflows/deploy.yml';
    if (!file_exists($workflow_path)) {
        return ['exists' => false, 'content' => ''];
    }
    
    $content = file_get_contents($workflow_path);
    $has_assets_copy = strpos($content, 'cp -r dist/assets/* deploy/assets/') !== false;
    
    return [
        'exists' => true,
        'content' => $content,
        'has_assets_copy' => $has_assets_copy
    ];
}

function fix_deploy_script() {
    $script_path = './deploy.sh';
    if (!file_exists($script_path)) {
        return ['success' => false, 'message' => 'Le script deploy.sh n\'existe pas'];
    }
    
    // Backup
    copy($script_path, $script_path . '.bak');
    
    $content = file_get_contents($script_path);
    
    // Vérifier si la copie des assets est correctement configurée
    if (strpos($content, 'cp -r dist/assets/* deploy/assets/') === false) {
        // Ajouter la copie d'assets si elle n'existe pas
        $content = preg_replace(
            '/(mkdir -p deploy\/assets)/i',
            "$1\n\n# Copier les fichiers compilés\necho \"Copie des fichiers compilés...\"\ncp -r dist/ deploy/dist/\ncp -r dist/assets/* deploy/assets/",
            $content
        );
        
        file_put_contents($script_path, $content);
        return ['success' => true, 'message' => 'Le script deploy.sh a été mis à jour'];
    }
    
    return ['success' => true, 'message' => 'Le script deploy.sh est déjà correctement configuré'];
}

function fix_github_workflow() {
    $workflow_path = './.github/workflows/deploy.yml';
    if (!file_exists($workflow_path)) {
        return ['success' => false, 'message' => 'Le workflow GitHub n\'existe pas'];
    }
    
    // Backup
    copy($workflow_path, $workflow_path . '.bak');
    
    $content = file_get_contents($workflow_path);
    
    // Vérifier si la copie des assets est correctement configurée
    if (strpos($content, 'cp -r dist/assets/* deploy/assets/') === false) {
        // Rechercher la section de préparation de déploiement
        if (preg_match('/name: Prepare deployment directory.*?find deploy/s', $content)) {
            // Ajouter la copie d'assets
            $content = preg_replace(
                '/(mkdir -p deploy\/assets.*?)(\s+# Copie des|cp)/s',
                "$1\n\n        # Copie des assets compilés vers le dossier deploy/assets\n        echo \"Copie des assets compilés...\"\n        cp -r dist/assets/* deploy/assets/\n$2",
                $content
            );
            
            file_put_contents($workflow_path, $content);
            return ['success' => true, 'message' => 'Le workflow GitHub a été mis à jour'];
        }
    }
    
    return ['success' => true, 'message' => 'Le workflow GitHub est déjà correctement configuré'];
}

function synchronize_assets() {
    if (!is_dir('dist/assets')) {
        return ['success' => false, 'message' => 'Le dossier dist/assets n\'existe pas'];
    }
    
    if (!is_dir('deploy/assets')) {
        if (!mkdir('deploy/assets', 0755, true)) {
            return ['success' => false, 'message' => 'Impossible de créer le dossier deploy/assets'];
        }
    }
    
    // Copier les assets
    $files = glob('dist/assets/*');
    $copied = 0;
    
    foreach ($files as $file) {
        $basename = basename($file);
        $dest = 'deploy/assets/' . $basename;
        
        if (copy($file, $dest)) {
            $copied++;
        }
    }
    
    return [
        'success' => true, 
        'message' => "$copied fichiers copiés de dist/assets vers deploy/assets",
        'files_copied' => $copied
    ];
}

// Exécution si demandé
$dirs_check = check_directories();
$deploy_script_check = check_deploy_script();
$workflow_check = check_github_workflow();

$fix_deploy_result = null;
$fix_workflow_result = null;
$sync_result = null;

if (isset($_POST['fix_deploy'])) {
    $fix_deploy_result = fix_deploy_script();
    $deploy_script_check = check_deploy_script();
}

if (isset($_POST['fix_workflow'])) {
    $fix_workflow_result = fix_github_workflow();
    $workflow_check = check_github_workflow();
}

if (isset($_POST['sync_assets'])) {
    $sync_result = synchronize_assets();
    $dirs_check = check_directories();
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification du Déploiement des Assets</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 0.9em; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        .fix-button:hover { background: #45a049; }
    </style>
</head>
<body>
    <h1>Vérification du Déploiement des Assets</h1>
    
    <?php if ($fix_deploy_result): ?>
    <div class="section">
        <h3>Résultat de la correction du script deploy.sh</h3>
        <p class="<?php echo $fix_deploy_result['success'] ? 'success' : 'error'; ?>">
            <?php echo $fix_deploy_result['message']; ?>
        </p>
    </div>
    <?php endif; ?>
    
    <?php if ($fix_workflow_result): ?>
    <div class="section">
        <h3>Résultat de la correction du workflow GitHub</h3>
        <p class="<?php echo $fix_workflow_result['success'] ? 'success' : 'error'; ?>">
            <?php echo $fix_workflow_result['message']; ?>
        </p>
    </div>
    <?php endif; ?>
    
    <?php if ($sync_result): ?>
    <div class="section">
        <h3>Résultat de la synchronisation des assets</h3>
        <p class="<?php echo $sync_result['success'] ? 'success' : 'error'; ?>">
            <?php echo $sync_result['message']; ?>
        </p>
    </div>
    <?php endif; ?>
    
    <div class="section">
        <h2>1. Vérification des répertoires</h2>
        <table border="1" style="border-collapse: collapse; width: 100%;">
            <tr>
                <th style="padding: 8px; text-align: left;">Répertoire</th>
                <th style="padding: 8px; text-align: left;">Description</th>
                <th style="padding: 8px; text-align: left;">Statut</th>
                <th style="padding: 8px; text-align: left;">Fichiers</th>
            </tr>
            <?php foreach ($dirs_check as $dir => $info): ?>
            <tr>
                <td style="padding: 8px;"><?php echo $dir; ?></td>
                <td style="padding: 8px;"><?php echo $info['description']; ?></td>
                <td style="padding: 8px;">
                    <?php if ($info['exists']): ?>
                    <span class="success">EXISTE</span>
                    <?php else: ?>
                    <span class="error">N'EXISTE PAS</span>
                    <?php endif; ?>
                </td>
                <td style="padding: 8px;"><?php echo $info['count']; ?> fichiers</td>
            </tr>
            <?php endforeach; ?>
        </table>
        
        <?php if (!$dirs_check['deploy/assets']['exists'] || $dirs_check['deploy/assets']['count'] < 1): ?>
        <div style="margin-top: 15px;">
            <p class="warning">Le dossier deploy/assets n'existe pas ou est vide.</p>
            <form method="post">
                <input type="submit" name="sync_assets" class="fix-button" value="Synchroniser les assets maintenant">
            </form>
        </div>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>2. Vérification du script deploy.sh</h2>
        <?php if ($deploy_script_check['exists']): ?>
            <p>Statut: <span class="success">Le script existe</span></p>
            <p>Copie des assets configurée: 
                <?php if ($deploy_script_check['has_assets_copy']): ?>
                <span class="success">OUI</span>
                <?php else: ?>
                <span class="error">NON</span>
                <form method="post" style="margin-top: 10px;">
                    <input type="submit" name="fix_deploy" class="fix-button" value="Corriger le script deploy.sh">
                </form>
                <?php endif; ?>
            </p>
            <h4>Contenu du script:</h4>
            <pre><?php echo htmlspecialchars($deploy_script_check['content']); ?></pre>
        <?php else: ?>
            <p>Statut: <span class="error">Le script deploy.sh n'existe pas</span></p>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>3. Vérification du workflow GitHub Actions</h2>
        <?php if ($workflow_check['exists']): ?>
            <p>Statut: <span class="success">Le workflow existe</span></p>
            <p>Copie des assets configurée: 
                <?php if ($workflow_check['has_assets_copy']): ?>
                <span class="success">OUI</span>
                <?php else: ?>
                <span class="error">NON</span>
                <form method="post" style="margin-top: 10px;">
                    <input type="submit" name="fix_workflow" class="fix-button" value="Corriger le workflow GitHub">
                </form>
                <?php endif; ?>
            </p>
            <h4>Extrait du workflow:</h4>
            <pre><?php echo htmlspecialchars(substr($workflow_check['content'], 0, 1000) . (strlen($workflow_check['content']) > 1000 ? '...' : '')); ?></pre>
        <?php else: ?>
            <p>Statut: <span class="warning">Le workflow GitHub n'existe pas ou est situé ailleurs</span></p>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>4. Solution manuelle</h2>
        <p>Si vous souhaitez synchroniser manuellement les assets:</p>
        <form method="post">
            <input type="submit" name="sync_assets" class="fix-button" value="Synchroniser les assets maintenant">
        </form>
        
        <h3>Commandes shell pour synchroniser les assets:</h3>
        <pre>
# Assurez-vous d'être à la racine du projet
mkdir -p deploy/assets
cp -r dist/assets/* deploy/assets/
        </pre>
    </div>
    
    <div class="section">
        <h2>5. Problèmes courants et solutions</h2>
        <ul>
            <li><strong>Les assets ne sont pas générés:</strong> Exécutez d'abord <code>npm run build</code> pour générer le dossier dist</li>
            <li><strong>Les assets ne sont pas copiés:</strong> Vérifiez que les scripts de déploiement incluent la copie des assets</li>
            <li><strong>Les assets sont absents sur le serveur:</strong> Vérifiez les logs de déploiement et les permissions sur le serveur</li>
            <li><strong>Les assets sont copiés mais pas utilisés:</strong> Vérifiez que les références dans index.html pointent vers le bon chemin</li>
        </ul>
    </div>
</body>
</html>
