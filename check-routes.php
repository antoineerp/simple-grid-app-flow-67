
<?php
header('Content-Type: text/html; charset=utf-8');

// Fonction pour tester un URL et obtenir les en-têtes
function testUrl($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $error = curl_error($ch);
    curl_close($ch);
    
    return [
        'url' => $url,
        'status' => $httpCode,
        'contentType' => $contentType,
        'error' => $error
    ];
}

// Obtenir l'hôte et le protocole
$host = $_SERVER['HTTP_HOST'];
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$baseUrl = "$protocol://$host";

// Tester quelques routes clés
$testUrls = [
    // Fichiers statiques
    "$baseUrl/assets/",
    "$baseUrl/assets/index.css",
    "$baseUrl/assets/main.js",
    
    // Routes API
    "$baseUrl/api/",
    "$baseUrl/api/test.php",
    "$baseUrl/api/check-users",
    
    // Routes React
    "$baseUrl/",
    "$baseUrl/pilotage",
    "$baseUrl/administration"
];

// Résultats des tests
$results = [];
foreach ($testUrls as $url) {
    $results[] = testUrl($url);
}

// Vérifier les fichiers JavaScript existants
$jsFiles = glob('./assets/*.js');
if (!empty($jsFiles)) {
    foreach ($jsFiles as $file) {
        $results[] = testUrl("$baseUrl/" . $file);
    }
}

// Vérifier les fichiers CSS existants
$cssFiles = glob('./assets/*.css');
if (!empty($cssFiles)) {
    foreach ($cssFiles as $file) {
        $results[] = testUrl("$baseUrl/" . $file);
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic des Routes - FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1, h2 { color: #2c5282; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
        th { background-color: #edf2f7; }
        tr:nth-child(even) { background-color: #f7fafc; }
        .success { color: #2f855a; }
        .warning { color: #c05621; }
        .error { color: #c53030; }
        .container { background-color: #f7fafc; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        pre { background-color: #edf2f7; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .section { margin-bottom: 30px; }
        .solution { background-color: #ebf4ff; padding: 15px; border-radius: 4px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Diagnostic des Routes FormaCert</h1>
        
        <div class="section">
            <h2>Information sur le Serveur</h2>
            <p><strong>Serveur:</strong> <?php echo $_SERVER['SERVER_SOFTWARE']; ?></p>
            <p><strong>Hôte:</strong> <?php echo $host; ?></p>
            <p><strong>Protocol:</strong> <?php echo $protocol; ?></p>
            <p><strong>PHP Version:</strong> <?php echo phpversion(); ?></p>
        </div>
        
        <div class="section">
            <h2>Résultats des Tests de Routes</h2>
            <table>
                <thead>
                    <tr>
                        <th>URL</th>
                        <th>Statut</th>
                        <th>Type de Contenu</th>
                        <th>Diagnostic</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($results as $result): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($result['url']); ?></td>
                            <td>
                                <?php if ($result['status'] >= 200 && $result['status'] < 300): ?>
                                    <span class="success"><?php echo $result['status']; ?></span>
                                <?php elseif ($result['status'] >= 300 && $result['status'] < 400): ?>
                                    <span class="warning"><?php echo $result['status']; ?> (Redirection)</span>
                                <?php else: ?>
                                    <span class="error"><?php echo $result['status']; ?></span>
                                <?php endif; ?>
                            </td>
                            <td><?php echo htmlspecialchars($result['contentType'] ?: 'Non spécifié'); ?></td>
                            <td>
                                <?php 
                                // Analyse du résultat
                                $url = $result['url'];
                                $status = $result['status'];
                                $contentType = $result['contentType'];
                                $error = $result['error'];
                                
                                if ($error) {
                                    echo "<span class='error'>Erreur: " . htmlspecialchars($error) . "</span>";
                                }
                                elseif ($status >= 400) {
                                    echo "<span class='error'>Erreur " . $status . "</span>";
                                }
                                elseif (strpos($url, '.js') !== false && $contentType != 'application/javascript' && $contentType != 'text/javascript') {
                                    echo "<span class='error'>Mauvais type MIME pour JavaScript! Reçu: " . htmlspecialchars($contentType) . "</span>";
                                }
                                elseif (strpos($url, '.css') !== false && $contentType != 'text/css') {
                                    echo "<span class='error'>Mauvais type MIME pour CSS! Reçu: " . htmlspecialchars($contentType) . "</span>";
                                }
                                elseif (strpos($url, '/api/') !== false && strpos($contentType, 'application/json') === false && strpos($contentType, '/php') === false) {
                                    echo "<span class='warning'>API peut ne pas renvoyer du JSON! Type: " . htmlspecialchars($contentType) . "</span>";
                                }
                                elseif ($status >= 200 && $status < 300) {
                                    echo "<span class='success'>OK</span>";
                                }
                                ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>Solutions pour les Problèmes Courants</h2>
            
            <h3>1. Problème de Type MIME pour JavaScript</h3>
            <div class="solution">
                <p>Si les fichiers JavaScript sont servis avec le mauvais type MIME, ajoutez ceci à votre .htaccess:</p>
                <pre>
&lt;FilesMatch "\.js$"&gt;
    Header set Content-Type "application/javascript"
&lt;/FilesMatch&gt;
                </pre>
            </div>
            
            <h3>2. Problème de Type MIME pour CSS</h3>
            <div class="solution">
                <p>Si les fichiers CSS sont servis avec le mauvais type MIME, ajoutez ceci à votre .htaccess:</p>
                <pre>
&lt;FilesMatch "\.css$"&gt;
    Header set Content-Type "text/css"
&lt;/FilesMatch&gt;
                </pre>
            </div>
            
            <h3>3. API PHP renvoyant du code source au lieu de JSON</h3>
            <div class="solution">
                <p>Si vos fichiers PHP sont affichés comme du texte brut, assurez-vous que PHP est correctement configuré sur le serveur et ajoutez ceci à .htaccess dans le dossier API:</p>
                <pre>
&lt;FilesMatch "\.php$"&gt;
    SetHandler application/x-httpd-php
&lt;/FilesMatch&gt;
                </pre>
            </div>
            
            <h3>4. Problèmes de Routing pour React</h3>
            <div class="solution">
                <p>Si les routes React ne fonctionnent pas, vérifiez que la règle de réécriture vers index.html est correcte dans votre .htaccess:</p>
                <pre>
# Rediriger toutes les requêtes vers index.html pour React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule ^(.*)$ index.html [QSA,L]
                </pre>
            </div>
        </div>
    </div>
</body>
</html>
