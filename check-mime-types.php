
<?php
header('Content-Type: text/html; charset=utf-8');

function checkMimeType($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HEADER, 1);
    curl_setopt($ch, CURLOPT_NOBODY, 1);
    $headers = curl_exec($ch);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'url' => $url,
        'status_code' => $statusCode,
        'content_type' => $contentType,
        'is_correct' => ($contentType === 'text/css' || strpos($contentType, 'text/css') !== false)
    ];
}

$base_url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
$css_files = glob('assets/*.css');
$results = [];

foreach ($css_files as $file) {
    $url = $base_url . '/' . $file;
    $results[] = checkMimeType($url);
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des types MIME</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .section { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Vérification des types MIME CSS</h1>
    
    <div class="section">
        <h2>Informations serveur</h2>
        <p>Serveur: <?php echo $_SERVER['SERVER_SOFTWARE']; ?></p>
        <p>Document root: <?php echo $_SERVER['DOCUMENT_ROOT']; ?></p>
    </div>
    
    <div class="section">
        <h2>Fichiers CSS trouvés</h2>
        <?php if (empty($css_files)): ?>
            <p><span class="error">Aucun fichier CSS trouvé dans le dossier assets</span></p>
        <?php else: ?>
            <p>Nombre de fichiers CSS: <?php echo count($css_files); ?></p>
            <table>
                <tr>
                    <th>Fichier</th>
                    <th>URL</th>
                    <th>Status</th>
                    <th>Type MIME</th>
                    <th>Résultat</th>
                </tr>
                <?php foreach ($results as $result): ?>
                <tr>
                    <td><?php echo basename($result['url']); ?></td>
                    <td><?php echo $result['url']; ?></td>
                    <td><?php echo $result['status_code']; ?></td>
                    <td><?php echo $result['content_type']; ?></td>
                    <td class="<?php echo $result['is_correct'] ? 'success' : 'error'; ?>">
                        <?php echo $result['is_correct'] ? 'Correct' : 'Incorrect'; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </table>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>Résolution des problèmes</h2>
        <?php if (!empty($results) && !$results[0]['is_correct']): ?>
            <p><span class="error">Problème de type MIME détecté!</span></p>
            <p>Le serveur ne sert pas correctement les fichiers CSS avec le type MIME approprié.</p>
            <ol>
                <li>Vérifiez que le fichier .htaccess dans le dossier assets est bien configuré</li>
                <li>Assurez-vous que les modules Apache mod_mime et mod_headers sont activés</li>
                <li>Contactez votre hébergeur pour vérifier la configuration du serveur si nécessaire</li>
                <li><a href="api/fix-css-mime-type.php">Utilisez l'outil de correction des types MIME</a></li>
            </ol>
        <?php elseif (empty($results)): ?>
            <p>Il faut d'abord exécuter le script fix-assets.php pour copier les fichiers CSS.</p>
        <?php else: ?>
            <p><span class="success">Les types MIME sont correctement configurés!</span></p>
        <?php endif; ?>
    </div>
    
    <p><a href="fix-assets.php">Retour à la correction des assets</a></p>
</body>
</html>
