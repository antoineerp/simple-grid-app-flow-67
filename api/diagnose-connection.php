
<?php
// Activer l'affichage des erreurs pour le diagnostic
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Headers pour éviter les problèmes de CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: text/html; charset=UTF-8");

// Fonction pour vérifier si un fichier est accessible
function checkFile($path) {
    $fullPath = dirname(__DIR__) . '/' . $path;
    $exists = file_exists($fullPath);
    $readable = is_readable($fullPath);
    $writable = is_writable($fullPath);
    $size = $exists ? filesize($fullPath) : 0;
    
    return [
        'path' => $path,
        'exists' => $exists,
        'readable' => $readable,
        'writable' => $writable,
        'size' => $size,
        'last_modified' => $exists ? date("Y-m-d H:i:s", filemtime($fullPath)) : null
    ];
}

// Fonction pour tester la connexion à la base de données
function testDatabaseConnection() {
    try {
        $host = "p71x6d.myd.infomaniak.com";
        $dbname = "p71x6d_system";
        $username = "p71x6d_richard";
        $password = "Trottinette43!";
        
        $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $conn = new PDO($dsn, $username, $password, $options);
        
        return [
            'success' => true,
            'message' => 'Connexion à la base de données réussie',
            'version' => $conn->getAttribute(PDO::ATTR_SERVER_VERSION)
        ];
    } catch (PDOException $e) {
        return [
            'success' => false,
            'message' => 'Erreur de connexion à la base de données: ' . $e->getMessage()
        ];
    }
}

// Collecter les informations de diagnostic
$info = [
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible',
    'server_name' => $_SERVER['SERVER_NAME'] ?? 'Non disponible',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Non disponible',
    'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Non disponible',
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Non disponible',
    'timestamp' => date('Y-m-d H:i:s'),
    'memory_usage' => memory_get_usage(true),
    'max_execution_time' => ini_get('max_execution_time'),
    'post_max_size' => ini_get('post_max_size'),
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'server_timezone' => date_default_timezone_get(),
    'loaded_extensions' => get_loaded_extensions(),
    'headers_list' => headers_list(),
    'json_support' => function_exists('json_encode') && function_exists('json_decode'),
    'pdo_support' => extension_loaded('pdo'),
    'mysql_support' => extension_loaded('pdo_mysql'),
    'session_support' => function_exists('session_start'),
    'disk_free_space' => function_exists('disk_free_space') ? disk_free_space('.') : 'Non disponible',
    'disk_total_space' => function_exists('disk_total_space') ? disk_total_space('.') : 'Non disponible',
];

// Vérifier les fichiers importants
$filesToCheck = [
    '.htaccess',
    'index.html',
    'api/php-test.php',
    'api/check-users.php',
    'api/controllers/UsersController.php'
];

$info['files'] = [];
foreach ($filesToCheck as $file) {
    $info['files'][] = checkFile($file);
}

// Tester la connexion à la base de données
$info['database_connection'] = testDatabaseConnection();

// Générer un exemple de JSON
$jsonExample = [
    'status' => 'success',
    'message' => 'Ceci est un exemple de JSON valide',
    'data' => [
        'id' => 1,
        'name' => 'Test',
        'timestamp' => time()
    ]
];

$info['json_example'] = json_encode($jsonExample);

// Afficher le rapport
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnostic de connexion PHP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        h1, h2 { color: #333; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .code { font-family: monospace; background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .api-test { margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 5px; }
        button { padding: 8px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #45a049; }
        #api-result { margin-top: 10px; padding: 10px; border: 1px dashed #ddd; display: none; }
    </style>
</head>
<body>
    <h1>Diagnostic de connexion PHP</h1>
    
    <div class="section">
        <h2>Informations sur le serveur</h2>
        <table>
            <tr><th>Paramètre</th><th>Valeur</th></tr>
            <tr><td>Version PHP</td><td><?php echo $info['php_version']; ?></td></tr>
            <tr><td>Serveur web</td><td><?php echo $info['server_software']; ?></td></tr>
            <tr><td>Racine des documents</td><td><?php echo $info['document_root']; ?></td></tr>
            <tr><td>Nom du serveur</td><td><?php echo $info['server_name']; ?></td></tr>
            <tr><td>URI de la requête</td><td><?php echo $info['request_uri']; ?></td></tr>
            <tr><td>Méthode de la requête</td><td><?php echo $info['request_method']; ?></td></tr>
            <tr><td>Adresse IP du client</td><td><?php echo $info['remote_addr']; ?></td></tr>
            <tr><td>Horodatage</td><td><?php echo $info['timestamp']; ?></td></tr>
            <tr><td>Utilisation de la mémoire</td><td><?php echo round($info['memory_usage'] / 1024 / 1024, 2); ?> Mo</td></tr>
            <tr><td>Temps d'exécution maximum</td><td><?php echo $info['max_execution_time']; ?> secondes</td></tr>
            <tr><td>Taille maximale des POST</td><td><?php echo $info['post_max_size']; ?></td></tr>
            <tr><td>Taille maximale des uploads</td><td><?php echo $info['upload_max_filesize']; ?></td></tr>
            <tr><td>Fuseau horaire du serveur</td><td><?php echo $info['server_timezone']; ?></td></tr>
            <tr><td>Espace disque libre</td><td><?php echo is_numeric($info['disk_free_space']) ? round($info['disk_free_space'] / 1024 / 1024 / 1024, 2) . ' Go' : $info['disk_free_space']; ?></td></tr>
            <tr><td>Espace disque total</td><td><?php echo is_numeric($info['disk_total_space']) ? round($info['disk_total_space'] / 1024 / 1024 / 1024, 2) . ' Go' : $info['disk_total_space']; ?></td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Support des fonctionnalités</h2>
        <table>
            <tr><th>Fonctionnalité</th><th>Statut</th></tr>
            <tr>
                <td>Support JSON</td>
                <td class="<?php echo $info['json_support'] ? 'success' : 'error'; ?>">
                    <?php echo $info['json_support'] ? '✅ Supporté' : '❌ Non supporté'; ?>
                </td>
            </tr>
            <tr>
                <td>Support PDO</td>
                <td class="<?php echo $info['pdo_support'] ? 'success' : 'error'; ?>">
                    <?php echo $info['pdo_support'] ? '✅ Supporté' : '❌ Non supporté'; ?>
                </td>
            </tr>
            <tr>
                <td>Support MySQL</td>
                <td class="<?php echo $info['mysql_support'] ? 'success' : 'error'; ?>">
                    <?php echo $info['mysql_support'] ? '✅ Supporté' : '❌ Non supporté'; ?>
                </td>
            </tr>
            <tr>
                <td>Support des sessions</td>
                <td class="<?php echo $info['session_support'] ? 'success' : 'error'; ?>">
                    <?php echo $info['session_support'] ? '✅ Supporté' : '❌ Non supporté'; ?>
                </td>
            </tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Connexion à la base de données</h2>
        <div class="<?php echo $info['database_connection']['success'] ? 'success' : 'error'; ?>">
            <?php echo $info['database_connection']['message']; ?>
            <?php if ($info['database_connection']['success'] && isset($info['database_connection']['version'])): ?>
                <p>Version du serveur MySQL: <?php echo $info['database_connection']['version']; ?></p>
            <?php endif; ?>
        </div>
    </div>
    
    <div class="section">
        <h2>Vérification des fichiers</h2>
        <table>
            <tr>
                <th>Fichier</th>
                <th>Existe</th>
                <th>Lisible</th>
                <th>Inscriptible</th>
                <th>Taille</th>
                <th>Dernière modification</th>
            </tr>
            <?php foreach ($info['files'] as $file): ?>
            <tr>
                <td><?php echo $file['path']; ?></td>
                <td class="<?php echo $file['exists'] ? 'success' : 'error'; ?>">
                    <?php echo $file['exists'] ? '✅ Oui' : '❌ Non'; ?>
                </td>
                <td class="<?php echo $file['readable'] ? 'success' : 'error'; ?>">
                    <?php echo $file['readable'] ? '✅ Oui' : '❌ Non'; ?>
                </td>
                <td class="<?php echo $file['writable'] ? 'success' : 'error'; ?>">
                    <?php echo $file['writable'] ? '✅ Oui' : '❌ Non'; ?>
                </td>
                <td><?php echo $file['size']; ?> octets</td>
                <td><?php echo $file['last_modified']; ?></td>
            </tr>
            <?php endforeach; ?>
        </table>
    </div>
    
    <div class="section">
        <h2>Exemple de JSON</h2>
        <pre><?php echo $info['json_example']; ?></pre>
    </div>
    
    <div class="section">
        <h2>En-têtes HTTP renvoyés</h2>
        <ul>
            <?php foreach ($info['headers_list'] as $header): ?>
            <li><?php echo htmlspecialchars($header); ?></li>
            <?php endforeach; ?>
        </ul>
    </div>
    
    <div class="api-test">
        <h2>Test de l'API</h2>
        <p>Cliquez sur le bouton pour tester si l'API renvoie correctement du JSON :</p>
        <button id="test-api">Tester l'API</button>
        <div id="api-result"></div>
        
        <script>
            document.getElementById('test-api').addEventListener('click', function() {
                const resultDiv = document.getElementById('api-result');
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = 'Chargement...';
                
                fetch('../api/php-test.php?_t=' + Date.now())
                    .then(response => {
                        const contentType = response.headers.get('content-type');
                        if (!contentType || !contentType.includes('application/json')) {
                            throw new Error(`Réponse non-JSON reçue: ${contentType}`);
                        }
                        return response.text();
                    })
                    .then(text => {
                        try {
                            const data = JSON.parse(text);
                            resultDiv.innerHTML = `<div class="success">✅ Succès! L'API fonctionne correctement.</div>
                                                  <pre>${JSON.stringify(data, null, 2)}</pre>`;
                        } catch (e) {
                            resultDiv.innerHTML = `<div class="error">❌ Erreur de parsing JSON: ${e.message}</div>
                                                  <p>Réponse brute reçue:</p>
                                                  <pre>${text}</pre>`;
                        }
                    })
                    .catch(error => {
                        resultDiv.innerHTML = `<div class="error">❌ Erreur: ${error.message}</div>`;
                    });
            });
        </script>
    </div>
    
    <footer style="margin-top: 50px; text-align: center; color: #777;">
        <p>Diagnostic généré le <?php echo date('Y-m-d H:i:s'); ?></p>
    </footer>
</body>
</html>
<?php
// Flush output buffer
ob_end_flush();
?>
