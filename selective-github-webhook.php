
<?php
header('Content-Type: text/html; charset=utf-8');

// Configuration
$secret = ''; // À remplir avec un secret que vous définirez dans GitHub
$repo_dir = __DIR__; // Répertoire racine de l'application
$branch = 'main'; // Branche à surveiller
$log_file = 'selective-webhook.log';
$github_token = ''; // Votre token GitHub pour les appels à l'API

// Fonction pour logger les événements
function writeLog($message) {
    global $log_file;
    $date = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[$date] $message" . PHP_EOL, FILE_APPEND);
}

// Vérification que la requête est un POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Afficher l'interface utilisateur
        showUI();
        exit;
    }
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

// Récupération des fichiers modifiés
$owner = isset($payload['repository']['owner']['name']) ? $payload['repository']['owner']['name'] : 'antoineerp';
$repo = isset($payload['repository']['name']) ? $payload['repository']['name'] : 'qualiopi-ch';
$before = $payload['before']; // Commit précédent
$after = $payload['after']; // Commit actuel

writeLog("Comparaison des commits: $before .. $after");

// Obtenir la liste des fichiers modifiés depuis l'API GitHub
$files_url = "https://api.github.com/repos/$owner/$repo/compare/$before...$after";
$headers = ['User-Agent: PHP', 'Accept: application/vnd.github.v3+json'];

if (!empty($github_token)) {
    $headers[] = "Authorization: token $github_token";
}

$ch = curl_init($files_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 200 || empty($response)) {
    writeLog("Erreur lors de la récupération des fichiers modifiés: HTTP $http_code");
    exit("Erreur lors de la récupération des fichiers modifiés: HTTP $http_code");
}

$compare_data = json_decode($response, true);

if (!isset($compare_data['files']) || !is_array($compare_data['files'])) {
    writeLog("Format de réponse invalide de l'API GitHub");
    exit("Format de réponse invalide de l'API GitHub");
}

// Télécharger uniquement les fichiers modifiés
$modified_files = $compare_data['files'];
$temp_dir = sys_get_temp_dir() . '/github_selective_' . time();

if (!mkdir($temp_dir, 0755, true)) {
    writeLog("Impossible de créer le répertoire temporaire: $temp_dir");
    exit("Impossible de créer le répertoire temporaire");
}

writeLog("Répertoire temporaire créé: $temp_dir");
writeLog("Nombre de fichiers modifiés: " . count($modified_files));

$success_count = 0;
$error_count = 0;

foreach ($modified_files as $file) {
    $status = isset($file['status']) ? $file['status'] : '';
    $filename = isset($file['filename']) ? $file['filename'] : '';
    
    if (empty($filename)) {
        writeLog("Fichier sans nom ignoré");
        continue;
    }
    
    // Ignorer les fichiers supprimés
    if ($status === 'removed') {
        writeLog("Fichier supprimé ignoré: $filename");
        continue;
    }
    
    // Télécharger le fichier depuis GitHub
    $file_url = "https://raw.githubusercontent.com/$owner/$repo/$after/$filename";
    
    $ch = curl_init($file_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    
    $file_content = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code !== 200 || empty($file_content)) {
        writeLog("Erreur lors du téléchargement du fichier $filename: HTTP $http_code");
        $error_count++;
        continue;
    }
    
    // Créer le répertoire cible si nécessaire
    $target_dir = dirname("$repo_dir/$filename");
    if (!is_dir($target_dir)) {
        if (!mkdir($target_dir, 0755, true)) {
            writeLog("Impossible de créer le répertoire: $target_dir");
            $error_count++;
            continue;
        }
    }
    
    // Écrire le fichier
    if (file_put_contents("$repo_dir/$filename", $file_content) === false) {
        writeLog("Impossible d'écrire le fichier: $filename");
        $error_count++;
    } else {
        writeLog("Fichier mis à jour avec succès: $filename");
        $success_count++;
    }
}

// Nettoyage
removeDirectory($temp_dir);

writeLog("Synchronisation terminée. $success_count fichiers mis à jour, $error_count erreurs");
echo "Synchronisation terminée. $success_count fichiers mis à jour, $error_count erreurs";

// Fonction récursive pour supprimer un répertoire
function removeDirectory($dir) {
    if (!is_dir($dir)) return;
    
    $files = array_diff(scandir($dir), ['.', '..']);
    foreach ($files as $file) {
        $path = "$dir/$file";
        is_dir($path) ? removeDirectory($path) : unlink($path);
    }
    return rmdir($dir);
}

// Fonction pour afficher l'interface utilisateur
function showUI() {
    global $log_file;
    ?>
<!DOCTYPE html>
<html>
<head>
    <title>Webhook GitHub Sélectif - FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; padding: 10px; background-color: #f0fff0; border-left: 4px solid green; }
        .error { color: red; padding: 10px; background-color: #fff0f0; border-left: 4px solid red; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
        code { background-color: #f5f5f5; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Webhook GitHub Sélectif - FormaCert</h1>
        
        <div class="card">
            <h2>Status</h2>
            <div class="success">
                <p>Le webhook GitHub sélectif est correctement configuré et prêt à recevoir des événements.</p>
                <p>Ce webhook ne déploiera que les fichiers nouveaux et modifiés sur votre serveur.</p>
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
            <p>Une fois configuré, chaque push sur la branche <code>main</code> déclenchera automatiquement une synchronisation sélective.</p>
        </div>
        
        <div class="card">
            <h2>Test manuel</h2>
            <p>Pour tester manuellement le webhook, vous pouvez faire un commit et le pousser sur GitHub, ou simuler une requête POST avec les bons paramètres.</p>
            <p>Pour une vérification rapide, assurez-vous simplement que ce script est accessible via l'URL indiquée ci-dessus.</p>
        </div>
    </div>
</body>
</html>
    <?php
}
?>
