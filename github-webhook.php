
<?php
header('Content-Type: text/html; charset=utf-8');

// Configuration
$secret = ''; // À remplir avec un secret que vous définirez dans GitHub
$repo_dir = __DIR__; // Répertoire racine de l'application
$branch = 'main'; // Branche à surveiller
$log_file = 'webhook.log';
$github_token = ''; // Votre token GitHub pour les appels à l'API

// Fonction pour logger les événements
function writeLog($message) {
    global $log_file;
    $date = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[$date] $message" . PHP_EOL, FILE_APPEND);
}

// Vérification que la requête est un POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('HTTP/1.1 405 Method Not Allowed');
    writeLog("Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
    exit('Méthode non autorisée');
}

// Récupération des données
$content = file_get_contents('php://input');
$signature = isset($_SERVER['HTTP_X_HUB_SIGNATURE_256']) ? $_SERVER['HTTP_X_HUB_SIGNATURE_256'] : '';

// Vérification de la signature si un secret est défini
if (!empty($secret)) {
    $expected = 'sha256=' . hash_hmac('sha256', $content, $secret);
    if (!hash_equals($expected, $signature)) {
        header('HTTP/1.1 403 Forbidden');
        writeLog("Signature invalide: $signature");
        exit('Signature invalide');
    }
}

// Décodage des données JSON
$payload = json_decode($content, true);

// Vérification que c'est bien un événement push
if (!isset($payload['ref'])) {
    header('HTTP/1.1 400 Bad Request');
    writeLog("Événement non pris en charge (ref manquante)");
    exit('Événement non pris en charge');
}

// Vérification que c'est la bonne branche
if ($payload['ref'] !== "refs/heads/$branch") {
    writeLog("Branche ignorée: " . $payload['ref']);
    exit('Branche ignorée');
}

// Téléchargement des fichiers depuis GitHub
$owner = isset($payload['repository']['owner']['name']) ? $payload['repository']['owner']['name'] : 'antoineerp';
$repo = isset($payload['repository']['name']) ? $payload['repository']['name'] : 'qualiopi-ch';

// Création d'un répertoire temporaire
$temp_dir = sys_get_temp_dir() . '/github_' . time();
if (!mkdir($temp_dir, 0755, true)) {
    writeLog("Impossible de créer le répertoire temporaire: $temp_dir");
    exit('Erreur lors de la création du répertoire temporaire');
}

// Téléchargement de l'archive ZIP du dépôt
$zip_url = "https://api.github.com/repos/$owner/$repo/zipball/$branch";
$zip_file = "$temp_dir/repo.zip";

$ch = curl_init($zip_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'User-Agent: PHP',
    'Authorization: token ' . $github_token
]);

$zip_content = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 200 || empty($zip_content)) {
    writeLog("Échec du téléchargement de l'archive ($http_code)");
    exit("Échec du téléchargement de l'archive ($http_code)");
}

// Sauvegarde de l'archive
file_put_contents($zip_file, $zip_content);

// Extraction de l'archive
$zip = new ZipArchive;
if ($zip->open($zip_file) !== true) {
    writeLog("Impossible d'ouvrir l'archive ZIP");
    exit("Impossible d'ouvrir l'archive ZIP");
}

// Extraction dans le répertoire temporaire
$zip->extractTo($temp_dir);
$zip->close();

// Trouver le répertoire extrait (le premier dossier dans le répertoire d'extraction)
$extracted_dir = '';
$dh = opendir($temp_dir);
while (($file = readdir($dh)) !== false) {
    if ($file !== '.' && $file !== '..' && is_dir("$temp_dir/$file")) {
        $extracted_dir = "$temp_dir/$file";
        break;
    }
}

if (empty($extracted_dir)) {
    writeLog("Impossible de trouver le répertoire extrait");
    exit("Impossible de trouver le répertoire extrait");
}

// Fonction récursive pour copier les fichiers
function recursiveCopy($src, $dst) {
    $dir = opendir($src);
    @mkdir($dst);
    while (($file = readdir($dir)) !== false) {
        if ($file === '.' || $file === '..') continue;
        
        if (is_dir("$src/$file")) {
            recursiveCopy("$src/$file", "$dst/$file");
        } else {
            copy("$src/$file", "$dst/$file");
        }
    }
    closedir($dir);
}

// Copie des fichiers vers le répertoire de l'application
try {
    recursiveCopy($extracted_dir, $repo_dir);
    writeLog("Synchronisation réussie depuis GitHub");
    echo "Synchronisation réussie depuis GitHub";
} catch (Exception $e) {
    writeLog("Erreur lors de la copie des fichiers: " . $e->getMessage());
    exit("Erreur lors de la copie des fichiers: " . $e->getMessage());
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

removeDirectory($temp_dir);
writeLog("Nettoyage terminé");
?>
<!DOCTYPE html>
<html>
<head>
    <title>GitHub Webhook - FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; padding: 10px; background-color: #f0fff0; border-left: 4px solid green; }
        .error { color: red; padding: 10px; background-color: #fff0f0; border-left: 4px solid red; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>GitHub Webhook - FormaCert</h1>
        
        <div class="card">
            <h2>Status</h2>
            <div class="success">
                <p>Le webhook GitHub est correctement configuré et prêt à recevoir des événements.</p>
            </div>
            
            <h3>Journal des derniers événements</h3>
            <pre><?php
                if (file_exists($log_file)) {
                    $logs = file_get_contents($log_file);
                    $logs = explode("\n", $logs);
                    $logs = array_slice($logs, max(0, count($logs) - 20)); // 20 dernières lignes
                    echo htmlspecialchars(implode("\n", $logs));
                } else {
                    echo "Aucun événement enregistré pour le moment.";
                }
            ?></pre>
        </div>
        
        <div class="card">
            <h2>Configuration du webhook sur GitHub</h2>
            <ol>
                <li>Allez dans les paramètres de votre dépôt GitHub</li>
                <li>Cliquez sur "Webhooks" puis "Add webhook"</li>
                <li>Dans "Payload URL", entrez: <code><?php echo "https://" . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF']; ?></code></li>
                <li>Dans "Content type", sélectionnez "application/json"</li>
                <li>Optionnel: Dans "Secret", entrez un secret de votre choix (puis mettez à jour ce fichier)</li>
                <li>Pour "Which events would you like to trigger this webhook?", sélectionnez "Just the push event"</li>
                <li>Assurez-vous que "Active" est coché</li>
                <li>Cliquez sur "Add webhook"</li>
            </ol>
            <p>Une fois configuré, chaque push sur la branche <code><?php echo $branch; ?></code> déclenchera automatiquement une synchronisation.</p>
        </div>
    </div>
</body>
</html>
