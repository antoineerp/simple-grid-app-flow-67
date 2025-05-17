
<?php
// Script de diagnostic complet pour API sur Infomaniak
header('Content-Type: text/html; charset=utf-8');
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Définir les chemins de base
$document_root = $_SERVER['DOCUMENT_ROOT'];
$script_filename = $_SERVER['SCRIPT_FILENAME'];
$request_uri = $_SERVER['REQUEST_URI'];
$server_name = $_SERVER['SERVER_NAME'];

// Détecter l'URL de l'API
$api_path = '/api'; // Chemin par défaut
$api_url = "https://{$server_name}{$api_path}";

// Fonction pour tester une URL API
function testApiEndpoint($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_NOBODY, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    $content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    
    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = substr($response, 0, $header_size);
    $body = substr($response, $header_size);
    
    curl_close($ch);
    
    return [
        'status' => $status,
        'body' => $body,
        'headers' => $headers,
        'error' => $error,
        'content_type' => $content_type
    ];
}

// Fonction pour récupérer tous les fichiers d'un dossier
function listFiles($dir) {
    $result = [];
    if (is_dir($dir)) {
        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file !== '.' && $file !== '..') {
                $path = $dir . '/' . $file;
                if (is_dir($path)) {
                    $result[] = $file . '/';
                } else {
                    $result[] = $file;
                }
            }
        }
    }
    return $result;
}

// Test de l'API principale
$api_test = testApiEndpoint($api_url);

// Test des points d'entrée spécifiques
$api_endpoints = [
    'api_root' => $api_url,
    'api_slash' => $api_url . '/',
    'api_index' => $api_url . '/index.php',
    'api_test' => $api_url . '/test.php',
    'api_auth' => $api_url . '/auth.php',
];

$endpoint_results = [];
foreach ($api_endpoints as $name => $endpoint) {
    $endpoint_results[$name] = testApiEndpoint($endpoint);
}

// Vérifier la structure des fichiers de l'API
$api_dir = $document_root . '/api';
$api_files = is_dir($api_dir) ? listFiles($api_dir) : [];

// Vérifier l'existence des fichiers de configuration
$config_dir = $api_dir . '/config';
$config_files = is_dir($config_dir) ? listFiles($config_dir) : [];

// Vérifier l'existence des fichiers .htaccess
$htaccess_root = file_exists($document_root . '/.htaccess');
$htaccess_api = file_exists($api_dir . '/.htaccess');

// Obtenir la configuration PHP
$php_version = phpversion();
$server_software = $_SERVER['SERVER_SOFTWARE'];

?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnostic de l'API</title>
    <style>
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.5;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1, h2, h3 {
            color: #2563eb;
        }
        .success {
            color: green;
        }
        .error {
            color: red;
        }
        .warning {
            color: orange;
        }
        .info {
            color: blue;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        pre {
            background-color: #f0f0f0;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
        }
        button {
            background-color: #2563eb;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 8px;
            margin-bottom: 8px;
        }
        button:hover {
            background-color: #1d4ed8;
        }
        .result-box {
            background-color: #fff;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
            margin-top: 10px;
        }
        .tools {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 20px 0;
        }
        .tool-button {
            padding: 10px 15px;
            background-color: #f59e0b;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            font-weight: bold;
        }
        .file-list {
            list-style: none;
            padding-left: 0;
        }
        .file-list li {
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }
    </style>
</head>
<body>
    <h1>Diagnostic de l'API</h1>
    
    <div class="section">
        <h2>Configuration du serveur</h2>
        <p><strong>Serveur:</strong> <?php echo htmlspecialchars($server_software); ?></p>
        <p><strong>PHP Version:</strong> <?php echo htmlspecialchars($php_version); ?></p>
        <p><strong>Document Root:</strong> <?php echo htmlspecialchars($document_root); ?></p>
        <p><strong>Script Path:</strong> <?php echo htmlspecialchars($script_filename); ?></p>
        <p><strong>URL Path:</strong> <?php echo htmlspecialchars($request_uri); ?></p>
        <p><strong>API URL détectée:</strong> <?php echo htmlspecialchars($api_path); ?></p>
    </div>
    
    <div class="section">
        <h2>Outils de réparation</h2>
        <div class="tools">
            <a href="fix-cors.php" class="tool-button">Réparer les erreurs CORS</a>
            <a href="fix-htaccess.php" class="tool-button">Réparer .htaccess</a>
            <a href="create-api-htaccess.php" class="tool-button">Créer api/.htaccess</a>
            <a href="fix-css-deployment.php" class="tool-button">Réparer les CSS</a>
        </div>
    </div>
    
    <div class="section">
        <h2>Test de l'API</h2>
        <h3>Tester l'API</h3>
        <p>Statut: <span class="<?php echo ($api_test['status'] >= 200 && $api_test['status'] < 300) ? 'success' : 'error'; ?>"><?php echo $api_test['status']; ?></span></p>
        
        <?php if (!empty($api_test['error'])): ?>
            <p class="error">Erreur: <?php echo htmlspecialchars($api_test['error']); ?></p>
        <?php endif; ?>
        
        <h4>Réponse:</h4>
        <pre><?php echo htmlspecialchars($api_test['body']); ?></pre>
    </div>
    
    <div class="section">
        <h2>Tests spécifiques</h2>
        <?php foreach ($api_endpoints as $name => $url): ?>
            <button onclick="testEndpoint('<?php echo htmlspecialchars($url); ?>')"><?php echo "Tester " . htmlspecialchars($url); ?></button>
        <?php endforeach; ?>
        <div id="endpoint-result" class="result-box" style="display: none;"></div>
    </div>
    
    <div class="section">
        <h2>Structure des fichiers API</h2>
        <?php if (is_dir($api_dir)): ?>
            <p class="success">Dossier API trouvé: <?php echo htmlspecialchars($api_dir); ?></p>
            
            <h3>Fichiers trouvés dans le dossier API:</h3>
            <ul class="file-list">
                <?php foreach ($api_files as $file): ?>
                    <li><?php echo htmlspecialchars($file); ?></li>
                <?php endforeach; ?>
            </ul>
            
            <?php if (is_dir($config_dir)): ?>
                <h3>Fichiers de configuration:</h3>
                <ul class="file-list">
                    <?php foreach ($config_files as $file): ?>
                        <li><?php echo htmlspecialchars($file); ?></li>
                    <?php endforeach; ?>
                </ul>
            <?php else: ?>
                <p class="warning">Dossier de configuration (api/config) non trouvé</p>
            <?php endif; ?>
            
            <h3>Fichiers .htaccess:</h3>
            <p><?php echo $htaccess_root ? '<span class="success">✅ .htaccess racine trouvé</span>' : '<span class="error">❌ .htaccess racine non trouvé</span>'; ?></p>
            <p><?php echo $htaccess_api ? '<span class="success">✅ .htaccess API trouvé</span>' : '<span class="error">❌ .htaccess API non trouvé</span>'; ?></p>
            
        <?php else: ?>
            <p class="error">Dossier API non trouvé à l'emplacement: <?php echo htmlspecialchars($api_dir); ?></p>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>Prochaines étapes</h2>
        <p>Si votre API ne fonctionne pas correctement, essayez les outils de réparation ci-dessus ou consultez la documentation pour plus d'informations.</p>
        <p><a href="/">Retour à la page d'accueil</a></p>
    </div>
    
    <script>
        function testEndpoint(url) {
            document.getElementById('endpoint-result').style.display = 'block';
            document.getElementById('endpoint-result').innerHTML = 'Test en cours...';
            
            fetch(url)
                .then(response => {
                    const status = response.status;
                    return response.text().then(text => {
                        return { status, text };
                    });
                })
                .then(data => {
                    let result = `<p>Statut: <span class="${data.status >= 200 && data.status < 300 ? 'success' : 'error'}">${data.status}</span></p>`;
                    result += `<h4>Réponse:</h4><pre>${data.text}</pre>`;
                    document.getElementById('endpoint-result').innerHTML = result;
                })
                .catch(error => {
                    document.getElementById('endpoint-result').innerHTML = `<p class="error">Erreur: ${error.message}</p>`;
                });
        }
    </script>
</body>
</html>
