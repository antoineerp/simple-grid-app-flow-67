
<?php
header('Content-Type: text/html; charset=utf-8');

// Configuration
$owner = 'antoineerp'; // Propriétaire du dépôt
$repo = 'qualiopi-ch'; // Nom du dépôt
$branch = 'main'; // Branche à synchroniser
$github_token = ''; // À remplir avec votre token GitHub
$log_file = 'manual-sync.log';

// Fonction pour logger les événements
function writeLog($message) {
    global $log_file;
    $date = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[$date] $message" . PHP_EOL, FILE_APPEND);
}

$success_message = '';
$error_message = '';

// Traiter la demande de synchronisation
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['sync'])) {
    $token = isset($_POST['github_token']) ? trim($_POST['github_token']) : '';
    $owner = isset($_POST['owner']) ? trim($_POST['owner']) : $owner;
    $repo = isset($_POST['repo']) ? trim($_POST['repo']) : $repo;
    $branch = isset($_POST['branch']) ? trim($_POST['branch']) : $branch;
    
    if (empty($token)) {
        $error_message = 'Le token GitHub est requis pour la synchronisation.';
    } else {
        writeLog("Début de la synchronisation manuelle pour $owner/$repo:$branch");
        
        // Création d'un répertoire temporaire
        $temp_dir = sys_get_temp_dir() . '/github_' . time();
        if (!mkdir($temp_dir, 0755, true)) {
            $error_message = "Impossible de créer le répertoire temporaire: $temp_dir";
            writeLog($error_message);
        } else {
            // Téléchargement de l'archive ZIP du dépôt
            $zip_url = "https://api.github.com/repos/$owner/$repo/zipball/$branch";
            $zip_file = "$temp_dir/repo.zip";
            
            writeLog("Téléchargement du dépôt depuis: $zip_url");
            
            $ch = curl_init($zip_url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'User-Agent: PHP',
                "Authorization: token $token"
            ]);
            
            $zip_content = curl_exec($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curl_error = curl_error($ch);
            curl_close($ch);
            
            if ($http_code !== 200 || empty($zip_content)) {
                $error_message = "Échec du téléchargement de l'archive ($http_code): $curl_error";
                writeLog($error_message);
            } else {
                writeLog("Archive téléchargée avec succès (" . strlen($zip_content) . " octets)");
                
                // Sauvegarde de l'archive
                file_put_contents($zip_file, $zip_content);
                
                // Extraction de l'archive
                $zip = new ZipArchive;
                if ($zip->open($zip_file) !== true) {
                    $error_message = "Impossible d'ouvrir l'archive ZIP";
                    writeLog($error_message);
                } else {
                    // Extraction dans le répertoire temporaire
                    writeLog("Extraction de l'archive...");
                    $zip->extractTo($temp_dir);
                    $zip->close();
                    
                    // Trouver le répertoire extrait
                    $extracted_dir = '';
                    $dh = opendir($temp_dir);
                    while (($file = readdir($dh)) !== false) {
                        if ($file !== '.' && $file !== '..' && is_dir("$temp_dir/$file")) {
                            $extracted_dir = "$temp_dir/$file";
                            break;
                        }
                    }
                    
                    if (empty($extracted_dir)) {
                        $error_message = "Impossible de trouver le répertoire extrait";
                        writeLog($error_message);
                    } else {
                        writeLog("Extraction réussie dans: $extracted_dir");
                        
                        // Fonction récursive pour copier les fichiers
                        function recursiveCopy($src, $dst) {
                            $count = 0;
                            $dir = opendir($src);
                            @mkdir($dst);
                            while (($file = readdir($dir)) !== false) {
                                if ($file === '.' || $file === '..') continue;
                                
                                if (is_dir("$src/$file")) {
                                    $sub_count = recursiveCopy("$src/$file", "$dst/$file");
                                    $count += $sub_count;
                                } else {
                                    copy("$src/$file", "$dst/$file");
                                    $count++;
                                }
                            }
                            closedir($dir);
                            return $count;
                        }
                        
                        // Copie des fichiers vers le répertoire de l'application
                        try {
                            $copy_count = recursiveCopy($extracted_dir, __DIR__);
                            $success_message = "Synchronisation réussie: $copy_count fichiers copiés depuis GitHub";
                            writeLog($success_message);
                        } catch (Exception $e) {
                            $error_message = "Erreur lors de la copie des fichiers: " . $e->getMessage();
                            writeLog($error_message);
                        }
                    }
                }
                
                // Nettoyage
                function removeDirectory($dir) {
                    if (!is_dir($dir)) return;
                    
                    $files = array_diff(scandir($dir), ['.', '..']);
                    foreach ($files as $file) {
                        $path = "$dir/$file";
                        is_dir($path) ? removeDirectory($path) : unlink($path);
                    }
                    return rmdir($dir);
                }
                
                writeLog("Nettoyage du répertoire temporaire: $temp_dir");
                removeDirectory($temp_dir);
            }
        }
    }
}

// Récupérer les dernières entrées du journal
function getLastLogs($count = 20) {
    global $log_file;
    if (!file_exists($log_file)) {
        return ['Aucun journal de synchronisation trouvé.'];
    }
    
    $logs = file($log_file, FILE_IGNORE_NEW_LINES);
    return array_slice($logs, max(0, count($logs) - $count));
}

$lastLogs = getLastLogs();
?>
<!DOCTYPE html>
<html>
<head>
    <title>Synchronisation Manuelle GitHub - FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="text"], input[type="password"] { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
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
        .success { color: green; padding: 10px; background-color: #f0fff0; border-left: 4px solid green; }
        .error { color: red; padding: 10px; background-color: #fff0f0; border-left: 4px solid red; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Synchronisation Manuelle GitHub - FormaCert</h1>
        
        <div class="card">
            <h2>Synchroniser maintenant</h2>
            
            <?php if ($success_message): ?>
            <div class="success"><?php echo $success_message; ?></div>
            <?php endif; ?>
            
            <?php if ($error_message): ?>
            <div class="error"><?php echo $error_message; ?></div>
            <?php endif; ?>
            
            <form method="post">
                <div class="form-group">
                    <label for="github_token">Token GitHub (avec permissions repo):</label>
                    <input type="password" id="github_token" name="github_token" required placeholder="ghp_votre_token_personnel">
                </div>
                
                <div class="form-group">
                    <label for="owner">Propriétaire du dépôt:</label>
                    <input type="text" id="owner" name="owner" value="<?php echo htmlspecialchars($owner); ?>">
                </div>
                
                <div class="form-group">
                    <label for="repo">Nom du dépôt:</label>
                    <input type="text" id="repo" name="repo" value="<?php echo htmlspecialchars($repo); ?>">
                </div>
                
                <div class="form-group">
                    <label for="branch">Branche:</label>
                    <input type="text" id="branch" name="branch" value="<?php echo htmlspecialchars($branch); ?>">
                </div>
                
                <div class="form-group">
                    <button type="submit" name="sync" class="button">Synchroniser maintenant</button>
                </div>
            </form>
        </div>
        
        <div class="card">
            <h2>Journal des synchronisations manuelles</h2>
            
            <?php if (empty($lastLogs) || (count($lastLogs) === 1 && $lastLogs[0] === 'Aucun journal de synchronisation trouvé.')): ?>
                <p>Aucune synchronisation manuelle n'a été effectuée.</p>
            <?php else: ?>
                <pre><?php echo htmlspecialchars(implode("\n", $lastLogs)); ?></pre>
            <?php endif; ?>
        </div>
        
        <div class="card">
            <h2>Comment obtenir un token GitHub</h2>
            <ol>
                <li>Allez sur <a href="https://github.com/settings/tokens" target="_blank">https://github.com/settings/tokens</a></li>
                <li>Cliquez sur "Generate new token" puis "Generate new token (classic)"</li>
                <li>Donnez un nom à votre token (ex: "FormaCert Sync")</li>
                <li>Sélectionnez le scope <code>repo</code> pour accéder à votre dépôt</li>
                <li>Cliquez sur "Generate token" en bas de la page</li>
                <li>Copiez le token généré (vous ne pourrez plus le voir après avoir quitté cette page)</li>
            </ol>
            <p><strong>Note:</strong> Gardez ce token privé. Il donne accès à votre dépôt GitHub.</p>
        </div>
    </div>
</body>
</html>
