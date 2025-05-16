
<?php
header('Content-Type: text/html; charset=utf-8');

// Configuration
$log_file = 'webhook.log';
$branch = 'main';

// Récupérer les dernières entrées du journal
function getLastLogs($count = 20) {
    global $log_file;
    if (!file_exists($log_file)) {
        return ['Aucun journal de synchronisation trouvé.'];
    }
    
    $logs = file($log_file, FILE_IGNORE_NEW_LINES);
    return array_slice($logs, max(0, count($logs) - $count));
}

// Détecter la dernière synchronisation réussie
function getLastSuccessfulSync() {
    $logs = getLastLogs(50);
    foreach ($logs as $log) {
        if (strpos($log, 'Synchronisation réussie') !== false) {
            return $log;
        }
    }
    return null;
}

$lastLogs = getLastLogs();
$lastSuccessfulSync = getLastSuccessfulSync();

// Vérifier l'existence du webhook
$webhookExists = file_exists('github-webhook.php');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Statut de Synchronisation GitHub - FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; padding: 10px; background-color: #f0fff0; border-left: 4px solid green; }
        .error { color: red; padding: 10px; background-color: #fff0f0; border-left: 4px solid red; }
        .warning { color: orange; padding: 10px; background-color: #fffaf0; border-left: 4px solid orange; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
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
        .button:hover { background-color: #45a049; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Statut de Synchronisation GitHub - FormaCert</h1>
        
        <div class="card">
            <h2>État actuel</h2>
            
            <?php if ($webhookExists): ?>
                <div class="success">
                    <p>✅ Le webhook GitHub est correctement installé.</p>
                </div>
            <?php else: ?>
                <div class="error">
                    <p>❌ Le fichier github-webhook.php n'a pas été trouvé.</p>
                    <p>Assurez-vous que le fichier existe et est accessible.</p>
                </div>
            <?php endif; ?>
            
            <?php if ($lastSuccessfulSync): ?>
                <div class="success">
                    <p>✅ Dernière synchronisation réussie:</p>
                    <pre><?php echo htmlspecialchars($lastSuccessfulSync); ?></pre>
                </div>
            <?php else: ?>
                <div class="warning">
                    <p>⚠️ Aucune synchronisation réussie n'a été trouvée dans le journal.</p>
                    <p>Le webhook n'a peut-être pas encore été déclenché.</p>
                </div>
            <?php endif; ?>
        </div>
        
        <div class="card">
            <h2>Journal des synchronisations</h2>
            
            <?php if (empty($lastLogs) || (count($lastLogs) === 1 && $lastLogs[0] === 'Aucun journal de synchronisation trouvé.')): ?>
                <div class="warning">
                    <p>Aucune entrée de journal n'a été trouvée.</p>
                </div>
            <?php else: ?>
                <pre><?php echo htmlspecialchars(implode("\n", $lastLogs)); ?></pre>
            <?php endif; ?>
            
            <p><a href="github-manual-sync.php" class="button">Synchronisation Manuelle</a></p>
        </div>
        
        <div class="card">
            <h2>Configuration GitHub</h2>
            <p>Pour configurer GitHub afin qu'il envoie automatiquement les modifications à votre site :</p>
            <ol>
                <li>Accédez à votre dépôt GitHub</li>
                <li>Allez dans "Settings" > "Webhooks" > "Add webhook"</li>
                <li>Entrez l'URL du webhook : <code><?php echo "https://" . $_SERVER['HTTP_HOST'] . "/github-webhook.php"; ?></code></li>
                <li>Sélectionnez "application/json" comme Content type</li>
                <li>Choisissez "Just the push event"</li>
                <li>Cliquez sur "Add webhook"</li>
            </ol>
            <p>Une fois configuré, chaque push vers la branche <strong><?php echo htmlspecialchars($branch); ?></strong> déclenchera une synchronisation automatique.</p>
        </div>
    </div>
</body>
</html>
