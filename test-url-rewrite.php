
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test des Règles de Réécriture pour Infomaniak</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
    </style>
</head>
<body>
    <h1>Test des Règles de Réécriture pour Infomaniak</h1>
    <p>Cette page teste spécifiquement les règles de réécriture pour l'accès aux ressources statiques.</p>

    <h2>Configuration du serveur</h2>
    <table>
        <tr><th>Variable</th><th>Valeur</th></tr>
        <tr><td>Document Root</td><td><?php echo $_SERVER['DOCUMENT_ROOT']; ?></td></tr>
        <tr><td>Script Name</td><td><?php echo $_SERVER['SCRIPT_NAME']; ?></td></tr>
        <tr><td>Server Name</td><td><?php echo $_SERVER['SERVER_NAME']; ?></td></tr>
        <tr><td>HTTP Host</td><td><?php echo $_SERVER['HTTP_HOST']; ?></td></tr>
        <tr><td>Server Software</td><td><?php echo $_SERVER['SERVER_SOFTWARE']; ?></td></tr>
    </table>

    <h2>Test de règles de réécriture pour les assets</h2>
    <?php
    // Fonction pour tester une URL
    function testUrl($url, $description) {
        $fullUrl = "http://" . $_SERVER['HTTP_HOST'] . $url;
        $ch = curl_init($fullUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_NOBODY, false);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $headers = substr($response, 0, $headerSize);
        $body = substr($response, $headerSize);
        $contentLength = curl_getinfo($ch, CURLINFO_CONTENT_LENGTH_DOWNLOAD);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        curl_close($ch);
        
        return [
            'url' => $url,
            'description' => $description,
            'httpCode' => $httpCode,
            'contentLength' => $contentLength,
            'contentType' => $contentType,
            'headers' => $headers,
            'body_preview' => substr($body, 0, 100)
        ];
    }
    
    // Liste des URLs à tester
    $testUrls = [
        '/assets/index.js' => 'JavaScript principal (chemin standard)',
        '/sites/qualiopi.ch/assets/index.js' => 'JavaScript principal (chemin Infomaniak)',
        '/lovable-uploads/formacert-logo.png' => 'Logo (chemin standard)',
        '/public/lovable-uploads/formacert-logo.png' => 'Logo (chemin public)',
        '/sites/qualiopi.ch/public/lovable-uploads/formacert-logo.png' => 'Logo (chemin Infomaniak)'
    ];
    
    // Trouver les fichiers .js avec hachage
    $assetsDir = $_SERVER['DOCUMENT_ROOT'] . '/assets';
    if (is_dir($assetsDir)) {
        $jsFiles = glob($assetsDir . '/*.js');
        if (!empty($jsFiles)) {
            $jsFile = basename($jsFiles[0]);
            $testUrls['/assets/' . $jsFile] = 'JavaScript avec hachage (chemin standard)';
        }
    }
    
    // Tableau pour stocker les résultats
    $results = [];
    
    // Exécuter les tests
    foreach ($testUrls as $url => $description) {
        $results[] = testUrl($url, $description);
    }
    
    // Afficher les résultats dans un tableau
    echo '<table>';
    echo '<tr><th>URL</th><th>Description</th><th>Code HTTP</th><th>Taille</th><th>Type de contenu</th></tr>';
    
    foreach ($results as $result) {
        echo '<tr>';
        echo '<td><code>' . htmlspecialchars($result['url']) . '</code></td>';
        echo '<td>' . htmlspecialchars($result['description']) . '</td>';
        
        $statusClass = ($result['httpCode'] >= 200 && $result['httpCode'] < 300) ? 'success' : 'error';
        echo '<td class="' . $statusClass . '">' . $result['httpCode'] . '</td>';
        
        if ($result['contentLength'] > 0) {
            echo '<td>' . $result['contentLength'] . ' octets</td>';
        } else {
            echo '<td class="warning">Taille inconnue</td>';
        }
        
        echo '<td>' . htmlspecialchars($result['contentType']) . '</td>';
        echo '</tr>';
    }
    
    echo '</table>';
    
    // Tests plus détaillés pour certaines URLs
    echo '<h2>Tests détaillés</h2>';
    
    // Trouver un asset JS existant pour test approfondi
    $detailedTestUrl = '/assets/index.js';
    $jsFiles = glob($assetsDir . '/*.js');
    if (!empty($jsFiles)) {
        $detailedTestUrl = '/assets/' . basename($jsFiles[0]);
    }
    
    // Tester l'URL de manière détaillée
    $detailedResult = testUrl($detailedTestUrl, 'Test détaillé d\'asset JS');
    echo '<h3>Test détaillé pour: <code>' . htmlspecialchars($detailedTestUrl) . '</code></h3>';
    
    echo '<h4>Résultat:</h4>';
    echo '<ul>';
    echo '<li>Code HTTP: <span class="' . (($detailedResult['httpCode'] >= 200 && $detailedResult['httpCode'] < 300) ? 'success' : 'error') . '">' . $detailedResult['httpCode'] . '</span></li>';
    echo '<li>Type de contenu: ' . htmlspecialchars($detailedResult['contentType']) . '</li>';
    echo '<li>Taille: ' . ($detailedResult['contentLength'] > 0 ? $detailedResult['contentLength'] . ' octets' : 'Taille inconnue') . '</li>';
    echo '</ul>';
    
    echo '<h4>En-têtes:</h4>';
    echo '<pre>' . htmlspecialchars($detailedResult['headers']) . '</pre>';
    
    echo '<h4>Aperçu du contenu:</h4>';
    echo '<pre>' . htmlspecialchars($detailedResult['body_preview']) . '...</pre>';
    
    // Test des chemins de fichiers physiques
    echo '<h2>Vérification des chemins de fichiers physiques</h2>';
    
    $physicalPaths = [
        $_SERVER['DOCUMENT_ROOT'] . '/assets/index.js',
        $_SERVER['DOCUMENT_ROOT'] . '/sites/qualiopi.ch/assets/index.js',
        $_SERVER['DOCUMENT_ROOT'] . '/lovable-uploads/formacert-logo.png',
        $_SERVER['DOCUMENT_ROOT'] . '/public/lovable-uploads/formacert-logo.png',
        $_SERVER['DOCUMENT_ROOT'] . '/sites/qualiopi.ch/public/lovable-uploads/formacert-logo.png',
        // Ajouter le fichier JS avec hachage
        !empty($jsFiles) ? $_SERVER['DOCUMENT_ROOT'] . '/assets/' . basename($jsFiles[0]) : ''
    ];
    
    echo '<table>';
    echo '<tr><th>Chemin physique</th><th>Existe</th><th>Taille</th><th>Dernière modification</th></tr>';
    
    foreach ($physicalPaths as $path) {
        if (empty($path)) continue;
        
        echo '<tr>';
        echo '<td><code>' . htmlspecialchars($path) . '</code></td>';
        
        if (file_exists($path)) {
            echo '<td class="success">Oui</td>';
            echo '<td>' . filesize($path) . ' octets</td>';
            echo '<td>' . date('Y-m-d H:i:s', filemtime($path)) . '</td>';
        } else {
            echo '<td class="error">Non</td>';
            echo '<td colspan="2">Fichier non trouvé</td>';
        }
        
        echo '</tr>';
    }
    
    echo '</table>';

    // Vérifier les fonctionnalités du fichier env.php
    echo '<h2>Test des fonctions de env.php</h2>';
    
    $envFile = $_SERVER['DOCUMENT_ROOT'] . '/api/config/env.php';
    if (file_exists($envFile)) {
        require_once $envFile;
        
        echo '<p>Fichier env.php trouvé et chargé.</p>';
        
        if (function_exists('adjustPathForInfomaniak')) {
            echo '<p class="success">Fonction adjustPathForInfomaniak disponible.</p>';
            
            // Tester la fonction avec différents chemins
            $testPaths = [
                '/assets/index.js',
                '/lovable-uploads/formacert-logo.png',
                '/sites/qualiopi.ch/assets/index.js',
                '/sites/qualiopi.ch/public/lovable-uploads/formacert-logo.png'
            ];
            
            echo '<table>';
            echo '<tr><th>Chemin d\'origine</th><th>Chemin ajusté</th><th>Changé</th></tr>';
            
            foreach ($testPaths as $path) {
                $adjustedPath = adjustPathForInfomaniak($path);
                $changed = $path !== $adjustedPath;
                
                echo '<tr>';
                echo '<td><code>' . htmlspecialchars($path) . '</code></td>';
                echo '<td><code>' . htmlspecialchars($adjustedPath) . '</code></td>';
                echo '<td class="' . ($changed ? 'success' : '') . '">' . ($changed ? 'Oui' : 'Non') . '</td>';
                echo '</tr>';
            }
            
            echo '</table>';
        } else {
            echo '<p class="error">Fonction adjustPathForInfomaniak non trouvée.</p>';
        }
        
        // Vérifier d'autres variables importantes
        echo '<h3>Variables d\'environnement importantes:</h3>';
        echo '<ul>';
        echo '<li>IS_INFOMANIAK: ' . (env('IS_INFOMANIAK') ?? 'non défini') . '</li>';
        echo '<li>INFOMANIAK_DOMAIN_ROOT: ' . (env('INFOMANIAK_DOMAIN_ROOT') ?? 'non défini') . '</li>';
        echo '<li>ASSETS_PATH: ' . (env('ASSETS_PATH') ?? 'non défini') . '</li>';
        echo '<li>UPLOADS_PATH: ' . (env('UPLOADS_PATH') ?? 'non défini') . '</li>';
        echo '</ul>';
    } else {
        echo '<p class="error">Fichier env.php non trouvé à l\'emplacement: ' . htmlspecialchars($envFile) . '</p>';
    }
    ?>

    <h2>Conclusion</h2>
    <p>Ce test vérifie l'accès aux ressources statiques via différents chemins pour s'assurer que les règles de réécriture fonctionnent correctement.</p>
    <p>Si les tests échouent, vérifiez:</p>
    <ol>
        <li>Le fichier .htaccess à la racine du site</li>
        <li>La configuration du fichier env.php</li>
        <li>L'existence des fichiers physiques aux chemins attendus</li>
        <li>Les permissions des fichiers et dossiers</li>
    </ol>
    
    <p><a href="infomaniak-paths-check.php" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-right: 10px;">Retour au diagnostic complet</a></p>
</body>
</html>
