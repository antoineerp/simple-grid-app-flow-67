
<?php
// Script de diagnostic serveur pour identifier la source des erreurs 500
header('Content-Type: text/html; charset=utf-8');
ini_set('display_errors', 1);
error_reporting(E_ALL);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnostic Serveur - FormaCert</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 1000px; margin: 0 auto; padding: 20px; color: #333; }
        h1, h2, h3 { color: #2563eb; margin-top: 1.5rem; }
        .panel { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
        .success { color: #16a34a; font-weight: bold; }
        .error { color: #dc2626; font-weight: bold; }
        .warning { color: #d97706; font-weight: bold; }
        pre { background: #f1f5f9; padding: 10px; border-radius: 4px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { text-align: left; padding: 8px; border: 1px solid #e2e8f0; }
        th { background: #f1f5f9; }
        .actions { margin-top: 20px; }
        .btn { display: inline-block; padding: 8px 16px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; margin-right: 8px; }
    </style>
</head>
<body>
    <h1>Diagnostic Serveur - FormaCert</h1>
    <p>Cet outil vous aide à identifier la source des erreurs 500 sur votre serveur.</p>
    
    <div class="panel">
        <h2>Informations Générales</h2>
        <table>
            <tr><td>Date et heure</td><td><?= date('Y-m-d H:i:s') ?></td></tr>
            <tr><td>Version PHP</td><td><?= phpversion() ?></td></tr>
            <tr><td>Serveur Web</td><td><?= $_SERVER['SERVER_SOFTWARE'] ?? 'Non détecté' ?></td></tr>
            <tr><td>Document Root</td><td><?= $_SERVER['DOCUMENT_ROOT'] ?></td></tr>
            <tr><td>Script courant</td><td><?= $_SERVER['SCRIPT_FILENAME'] ?></td></tr>
        </table>
    </div>
    
    <div class="panel">
        <h2>Test des Fichiers PHP</h2>
        <p>Tests des fichiers PHP critiques pour vérifier l'interprétation du serveur.</p>
        
        <?php
        $phpFiles = [
            'test-minimal.php' => 'Test PHP minimal',
            'phpinfo-test.php' => 'Informations PHP',
            'super-simple.php' => 'Script ultra simple',
            'api/test.php' => 'API test',
            'api/php-test.php' => 'API PHP test'
        ];
        
        echo '<table>';
        echo '<tr><th>Fichier</th><th>Statut</th><th>Réponse</th></tr>';
        
        foreach ($phpFiles as $file => $description) {
            echo '<tr>';
            echo '<td><a href="/' . $file . '" target="_blank">' . $file . '</a></td>';
            
            // Vérifier si le fichier existe
            if (file_exists($file)) {
                // Tester l'accès au fichier via HTTP
                $url = 'http' . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 's' : '') . 
                       '://' . $_SERVER['HTTP_HOST'] . '/' . $file;
                
                $ch = curl_init($url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HEADER, true);
                curl_setopt($ch, CURLOPT_NOBODY, false);
                curl_setopt($ch, CURLOPT_TIMEOUT, 5);
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                if ($httpCode >= 200 && $httpCode < 300) {
                    echo '<td class="success">OK (' . $httpCode . ')</td>';
                    echo '<td>' . htmlspecialchars(substr($response, 0, 100)) . '...</td>';
                } elseif ($httpCode >= 500) {
                    echo '<td class="error">Erreur 500</td>';
                    echo '<td>Erreur serveur interne</td>';
                } else {
                    echo '<td class="warning">Erreur (' . $httpCode . ')</td>';
                    echo '<td>' . htmlspecialchars(substr($response, 0, 100)) . '...</td>';
                }
            } else {
                echo '<td class="warning">Fichier absent</td>';
                echo '<td>Le fichier n\'existe pas</td>';
            }
            
            echo '</tr>';
        }
        
        echo '</table>';
        ?>
    </div>
    
    <div class="panel">
        <h2>Vérification des Assets</h2>
        <?php
        $distDir = __DIR__ . '/dist';
        $assetsDir = $distDir . '/assets';
        
        if (is_dir($distDir)) {
            echo '<p class="success">Répertoire dist/ existe</p>';
            
            if (is_dir($assetsDir)) {
                echo '<p class="success">Répertoire dist/assets/ existe</p>';
                
                $assets = scandir($assetsDir);
                $jsFiles = array_filter($assets, function($file) {
                    return preg_match('/\.js$/', $file);
                });
                
                $cssFiles = array_filter($assets, function($file) {
                    return preg_match('/\.css$/', $file);
                });
                
                echo '<h3>Fichiers JavaScript</h3>';
                if (count($jsFiles) > 0) {
                    echo '<ul>';
                    foreach ($jsFiles as $file) {
                        echo '<li>' . $file . ' - ' . number_format(filesize($assetsDir . '/' . $file) / 1024, 2) . ' KB</li>';
                    }
                    echo '</ul>';
                } else {
                    echo '<p class="error">Aucun fichier JavaScript trouvé!</p>';
                }
                
                echo '<h3>Fichiers CSS</h3>';
                if (count($cssFiles) > 0) {
                    echo '<ul>';
                    foreach ($cssFiles as $file) {
                        echo '<li>' . $file . ' - ' . number_format(filesize($assetsDir . '/' . $file) / 1024, 2) . ' KB</li>';
                    }
                    echo '</ul>';
                } else {
                    echo '<p class="error">Aucun fichier CSS trouvé!</p>';
                }
                
            } else {
                echo '<p class="error">Répertoire dist/assets/ manquant!</p>';
            }
        } else {
            echo '<p class="error">Répertoire dist/ manquant! Vous devez exécuter npm run build.</p>';
        }
        ?>
    </div>
    
    <div class="panel">
        <h2>Configuration Apache</h2>
        <?php
        $htaccessExists = file_exists('.htaccess');
        $apiHtaccessExists = file_exists('api/.htaccess');
        
        if ($htaccessExists) {
            echo '<p class="success">Le fichier .htaccess principal existe</p>';
            echo '<pre>' . htmlspecialchars(file_get_contents('.htaccess')) . '</pre>';
        } else {
            echo '<p class="error">Le fichier .htaccess principal est manquant!</p>';
        }
        
        if ($apiHtaccessExists) {
            echo '<p class="success">Le fichier api/.htaccess existe</p>';
            echo '<pre>' . htmlspecialchars(file_get_contents('api/.htaccess')) . '</pre>';
        } else {
            echo '<p class="warning">Le fichier api/.htaccess est manquant</p>';
        }
        ?>
    </div>
    
    <div class="actions">
        <a href="/" class="btn">Retour à l'application</a>
        <a href="/debug-assets.php" class="btn">Diagnostic des assets</a>
        <a href="/phpinfo-test.php" class="btn">Info PHP</a>
    </div>
    
    <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
        FormaCert Diagnostic Tool - <?= date('Y') ?>
    </p>
</body>
</html>
