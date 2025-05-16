
<?php
header('Content-Type: text/html; charset=utf-8');

$apiUrl = '/api';
$basePath = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
if ($basePath && $basePath !== '/') {
    $apiUrl = $basePath . '/api';
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>API Diagnostic</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        button { padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #45a049; }
        #result { margin-top: 15px; }
    </style>
</head>
<body>
    <h1>Diagnostic de l'API</h1>
    
    <div class="section">
        <h2>Configuration du serveur</h2>
        <p>Serveur: <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu'; ?></p>
        <p>PHP Version: <?php echo phpversion(); ?></p>
        <p>Document Root: <?php echo $_SERVER['DOCUMENT_ROOT']; ?></p>
        <p>Script Path: <?php echo $_SERVER['SCRIPT_FILENAME']; ?></p>
        <p>URL Path: <?php echo $_SERVER['REQUEST_URI']; ?></p>
        <p>API URL détectée: <?php echo $apiUrl; ?></p>
    </div>
    
    <div class="section">
        <h2>Test de l'API</h2>
        <button onclick="testAPI()">Tester l'API</button>
        <div id="result"></div>
        
        <h3>Tests spécifiques</h3>
        <button onclick="testEndpoint('/api')">Tester /api</button>
        <button onclick="testEndpoint('/api/')">Tester /api/</button>
        <button onclick="testEndpoint('/api/index.php')">Tester /api/index.php</button>
        <button onclick="testEndpoint('/api/test.php')">Tester /api/test.php</button>
        <div id="specificResults"></div>
    </div>
    
    <div class="section">
        <h2>Structure des fichiers API</h2>
        <?php
        $apiDir = __DIR__ . '/api';
        if (is_dir($apiDir)) {
            echo "<p><span class='success'>Dossier API trouvé</span>: $apiDir</p>";
            $files = scandir($apiDir);
            if (!empty($files)) {
                echo "<p>Fichiers trouvés dans le dossier API:</p><ul>";
                foreach ($files as $file) {
                    if ($file !== '.' && $file !== '..') {
                        $filePath = $apiDir . '/' . $file;
                        $fileStatus = is_file($filePath) ? 'Fichier' : 'Dossier';
                        $fileSize = is_file($filePath) ? ' (' . round(filesize($filePath)/1024, 2) . ' KB)' : '';
                        echo "<li>$fileStatus: $file$fileSize</li>";
                    }
                }
                echo "</ul>";
            } else {
                echo "<p><span class='error'>Aucun fichier trouvé dans le dossier API</span></p>";
            }
        } else {
            echo "<p><span class='error'>Dossier API non trouvé</span> à l'emplacement $apiDir</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Actions recommandées</h2>
        <ul>
            <li>Vérifiez que le fichier <code>api/index.php</code> existe et est accessible</li>
            <li>Vérifiez que le fichier <code>api/.htaccess</code> est correctement configuré</li>
            <li>Vérifiez les permissions des fichiers dans le dossier API</li>
            <li>Consultez le journal des erreurs PHP pour plus d'informations</li>
        </ul>
    </div>
    
    <script>
        function testAPI() {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<p>Test en cours...</p>';
            
            fetch('/api')
                .then(response => {
                    return response.text().then(text => {
                        return { status: response.status, text };
                    });
                })
                .then(data => {
                    resultDiv.innerHTML = `
                        <p>Statut: <span class="${data.status === 200 ? 'success' : 'error'}">${data.status}</span></p>
                        <p>Réponse:</p>
                        <pre>${htmlEscape(data.text)}</pre>
                    `;
                })
                .catch(error => {
                    resultDiv.innerHTML = `
                        <p>Erreur: <span class="error">${error.message}</span></p>
                    `;
                });
        }
        
        function testEndpoint(endpoint) {
            const resultsDiv = document.getElementById('specificResults');
            const testId = 'test-' + endpoint.replace(/[^a-zA-Z0-9]/g, '-');
            
            let resultElement = document.getElementById(testId);
            if (!resultElement) {
                resultElement = document.createElement('div');
                resultElement.id = testId;
                resultsDiv.appendChild(resultElement);
            }
            
            resultElement.innerHTML = `<p>Test de ${endpoint} en cours...</p>`;
            
            fetch(endpoint)
                .then(response => {
                    return response.text().then(text => {
                        return { status: response.status, text };
                    });
                })
                .then(data => {
                    resultElement.innerHTML = `
                        <h4>Résultat pour ${endpoint}:</h4>
                        <p>Statut: <span class="${data.status === 200 ? 'success' : 'error'}">${data.status}</span></p>
                        <pre>${htmlEscape(data.text.substring(0, 500))}${data.text.length > 500 ? '...' : ''}</pre>
                    `;
                })
                .catch(error => {
                    resultElement.innerHTML = `
                        <h4>Résultat pour ${endpoint}:</h4>
                        <p>Erreur: <span class="error">${error.message}</span></p>
                    `;
                });
        }
        
        function htmlEscape(str) {
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
    </script>
</body>
</html>
