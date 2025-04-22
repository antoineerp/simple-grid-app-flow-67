
<?php
header('Content-Type: text/html; charset=utf-8');
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Fonction pour afficher joliment les tableaux et objets
function prettyPrint($var) {
    echo '<pre>';
    print_r($var);
    echo '</pre>';
}

// Fonction pour vérifier l'existence d'un fichier avec plus de détails
function checkFileWithDetails($path) {
    $result = [
        'path' => $path,
        'exists' => file_exists($path),
        'size' => file_exists($path) ? filesize($path) : 0,
        'modified' => file_exists($path) ? date('Y-m-d H:i:s', filemtime($path)) : 'N/A',
        'permissions' => file_exists($path) ? substr(sprintf('%o', fileperms($path)), -4) : 'N/A',
    ];
    
    if (file_exists($path)) {
        if (is_dir($path)) {
            $result['type'] = 'Directory';
            $result['contents'] = scandir($path);
        } else {
            $result['type'] = 'File';
            $result['mime'] = mime_content_type($path);
        }
    } else {
        $result['type'] = 'N/A';
    }
    
    return $result;
}

// Vérifier les répertoires clés
$documentRoot = $_SERVER['DOCUMENT_ROOT'];
$scriptDir = dirname($_SERVER['SCRIPT_FILENAME']);
$distPath = $scriptDir . '/dist';
$assetsPath = $distPath . '/assets';

// Analyser les logs
$logFile = "/tmp/formacert-assets.log";
$logContent = '';
if (file_exists($logFile) && is_readable($logFile)) {
    $logContent = file_get_contents($logFile);
    $logLines = explode("\n", $logContent);
    $logLines = array_slice($logLines, max(0, count($logLines) - 100)); // Dernières 100 lignes
    $logContent = implode("\n", $logLines);
}

// Vérifier les assets CSS et JS
$allFiles = is_dir($assetsPath) ? scandir($assetsPath) : [];
$cssFiles = array_filter($allFiles, function($file) {
    return preg_match('/\.css$/', $file);
});
$jsFiles = array_filter($allFiles, function($file) {
    return preg_match('/\.js$/', $file) && strpos($file, '.es-') === false;
});

?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnostic Avancé des Assets - FormaCert</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; color: #333; }
        h1, h2, h3 { color: #2563eb; }
        .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .subsection { background: #fff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 15px; margin: 10px 0; }
        .success { color: #16a34a; font-weight: bold; }
        .error { color: #dc2626; font-weight: bold; }
        .warning { color: #d97706; font-weight: bold; }
        pre { background: #f1f5f9; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
        th { background: #f1f5f9; }
        .actions { margin: 20px 0; display: flex; gap: 10px; }
        .actions button { padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .log { max-height: 400px; overflow-y: auto; }
    </style>
</head>
<body>
    <h1>Diagnostic Avancé des Assets - FormaCert</h1>
    <p>Ce diagnostic détaillé permet d'analyser en temps réel les problèmes de chargement des assets.</p>
    
    <div class="section">
        <h2>Informations sur le Serveur</h2>
        <table>
            <tr><th>Élément</th><th>Valeur</th></tr>
            <tr><td>Date et heure</td><td><?= date('Y-m-d H:i:s') ?></td></tr>
            <tr><td>Serveur Web</td><td><?= $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible' ?></td></tr>
            <tr><td>PHP Version</td><td><?= phpversion() ?></td></tr>
            <tr><td>Document Root</td><td><?= $documentRoot ?></td></tr>
            <tr><td>Script Directory</td><td><?= $scriptDir ?></td></tr>
            <tr><td>URI Demandée</td><td><?= $_SERVER['REQUEST_URI'] ?></td></tr>
            <tr><td>User Agent</td><td><?= $_SERVER['HTTP_USER_AGENT'] ?></td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Structure des Répertoires</h2>
        
        <div class="subsection">
            <h3>Répertoire dist/</h3>
            <?php $distInfo = checkFileWithDetails($distPath); ?>
            <p>Chemin: <?= $distPath ?></p>
            <p>Existe: <span class="<?= $distInfo['exists'] ? 'success' : 'error' ?>"><?= $distInfo['exists'] ? 'OUI' : 'NON' ?></span></p>
            
            <?php if ($distInfo['exists'] && $distInfo['type'] === 'Directory'): ?>
                <p>Contenu du répertoire:</p>
                <ul>
                    <?php foreach ($distInfo['contents'] as $item): ?>
                        <?php if ($item !== '.' && $item !== '..'): ?>
                            <li><?= $item ?></li>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        </div>
        
        <div class="subsection">
            <h3>Répertoire dist/assets/</h3>
            <?php $assetsInfo = checkFileWithDetails($assetsPath); ?>
            <p>Chemin: <?= $assetsPath ?></p>
            <p>Existe: <span class="<?= $assetsInfo['exists'] ? 'success' : 'error' ?>"><?= $assetsInfo['exists'] ? 'OUI' : 'NON' ?></span></p>
            
            <?php if ($assetsInfo['exists'] && $assetsInfo['type'] === 'Directory'): ?>
                <p>Contenu du répertoire assets:</p>
                <table>
                    <tr><th>Fichier</th><th>Taille</th><th>Date de modification</th><th>Permissions</th></tr>
                    <?php foreach ($assetsInfo['contents'] as $item): ?>
                        <?php if ($item !== '.' && $item !== '..'): ?>
                            <?php $itemInfo = checkFileWithDetails($assetsPath . '/' . $item); ?>
                            <tr>
                                <td><?= $item ?></td>
                                <td><?= number_format($itemInfo['size'] / 1024, 2) ?> KB</td>
                                <td><?= $itemInfo['modified'] ?></td>
                                <td><?= $itemInfo['permissions'] ?></td>
                            </tr>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </table>
            <?php endif; ?>
        </div>
    </div>
    
    <div class="section">
        <h2>Analyse des Fichiers CSS et JS</h2>
        
        <div class="subsection">
            <h3>Fichiers CSS Trouvés</h3>
            <?php if (!empty($cssFiles)): ?>
                <table>
                    <tr><th>Fichier</th><th>Taille</th><th>Date de modification</th><th>Chemin complet</th></tr>
                    <?php foreach ($cssFiles as $file): ?>
                        <?php $fileInfo = checkFileWithDetails($assetsPath . '/' . $file); ?>
                        <tr>
                            <td><?= $file ?></td>
                            <td><?= number_format($fileInfo['size'] / 1024, 2) ?> KB</td>
                            <td><?= $fileInfo['modified'] ?></td>
                            <td><?= $assetsPath . '/' . $file ?></td>
                        </tr>
                    <?php endforeach; ?>
                </table>
            <?php else: ?>
                <p class="error">Aucun fichier CSS trouvé dans le répertoire assets.</p>
            <?php endif; ?>
        </div>
        
        <div class="subsection">
            <h3>Fichiers JS Trouvés</h3>
            <?php if (!empty($jsFiles)): ?>
                <table>
                    <tr><th>Fichier</th><th>Taille</th><th>Date de modification</th><th>Chemin complet</th></tr>
                    <?php foreach ($jsFiles as $file): ?>
                        <?php $fileInfo = checkFileWithDetails($assetsPath . '/' . $file); ?>
                        <tr>
                            <td><?= $file ?></td>
                            <td><?= number_format($fileInfo['size'] / 1024, 2) ?> KB</td>
                            <td><?= $fileInfo['modified'] ?></td>
                            <td><?= $assetsPath . '/' . $file ?></td>
                        </tr>
                    <?php endforeach; ?>
                </table>
            <?php else: ?>
                <p class="error">Aucun fichier JS principal trouvé dans le répertoire assets.</p>
            <?php endif; ?>
        </div>
    </div>
    
    <div class="section">
        <h2>Logs de Chargement des Assets</h2>
        <div class="log">
            <?php if (!empty($logContent)): ?>
                <pre><?= htmlspecialchars($logContent) ?></pre>
            <?php else: ?>
                <p class="warning">Le fichier de log n'existe pas ou est vide.</p>
            <?php endif; ?>
        </div>
    </div>
    
    <div class="section">
        <h2>Recommandations</h2>
        <ul>
            <?php if (!$distInfo['exists']): ?>
                <li class="error">Le répertoire dist/ n'existe pas. Vous devez exécuter <code>npm run build</code> pour générer les fichiers.</li>
            <?php endif; ?>
            
            <?php if (!$assetsInfo['exists']): ?>
                <li class="error">Le répertoire dist/assets/ n'existe pas. Vous devez exécuter <code>npm run build</code> ou créer manuellement ce répertoire.</li>
            <?php endif; ?>
            
            <?php if (empty($cssFiles)): ?>
                <li class="error">Aucun fichier CSS trouvé. Vérifiez la génération des fichiers CSS.</li>
            <?php endif; ?>
            
            <?php if (empty($jsFiles)): ?>
                <li class="error">Aucun fichier JS principal trouvé. Vérifiez la génération des fichiers JS.</li>
            <?php endif; ?>
            
            <?php if ($distInfo['exists'] && $assetsInfo['exists'] && !empty($cssFiles) && !empty($jsFiles)): ?>
                <li class="success">Tous les fichiers nécessaires semblent être présents.</li>
                <?php
                // Vérifier si les fichiers index.js et index.css existent
                $indexJsExists = in_array('index.js', $jsFiles);
                $indexCssExists = in_array('index.css', $cssFiles);
                
                if (!$indexJsExists): ?>
                    <li class="warning">Le fichier index.js n'existe pas, mais d'autres fichiers JS sont disponibles. Assurez-vous que vite.config.ts est configuré pour générer index.js sans hachage.</li>
                <?php endif; ?>
                
                <?php if (!$indexCssExists): ?>
                    <li class="warning">Le fichier index.css n'existe pas, mais d'autres fichiers CSS sont disponibles. Assurez-vous que vite.config.ts est configuré pour générer index.css sans hachage.</li>
                <?php endif; ?>
            <?php endif; ?>
        </ul>
    </div>
    
    <div class="actions">
        <button onclick="window.location.reload()">Actualiser</button>
        <button onclick="window.location.href='/assets-check.php'">Diagnostic Standard</button>
        <button onclick="window.location.href='/'">Retour à l'Application</button>
    </div>
    
    <script>
    // Script pour surveiller les chargements de ressources en temps réel
    window.addEventListener('load', function() {
        console.log("Page de diagnostic entièrement chargée");
    });
    </script>
</body>
</html>
<?php
// Journaliser cette requête de diagnostic
$logMessage = "[" . date('Y-m-d H:i:s') . "] Exécution du diagnostic avancé\n";
file_put_contents("/tmp/formacert-assets.log", $logMessage, FILE_APPEND);
?>
