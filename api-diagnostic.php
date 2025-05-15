
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic API FormaCert</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 1000px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        .button.blue { background-color: #2196F3; }
        .tabs { display: flex; margin-bottom: 15px; }
        .tab { padding: 10px 15px; cursor: pointer; border: 1px solid #ddd; border-bottom: none; border-radius: 5px 5px 0 0; margin-right: 5px; }
        .tab.active { background-color: #f0f0f0; font-weight: bold; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Diagnostic API FormaCert</h1>
        
        <div class="tabs">
            <div class="tab active" onclick="showTab('tab-config')">Configuration</div>
            <div class="tab" onclick="showTab('tab-files')">Fichiers</div>
            <div class="tab" onclick="showTab('tab-db')">Base de données</div>
            <div class="tab" onclick="showTab('tab-api')">Tests API</div>
        </div>
        
        <div id="tab-config" class="tab-content active">
            <div class="card">
                <h2>Configuration de l'environnement</h2>
                <?php
                echo "<p><strong>Version PHP:</strong> " . phpversion() . "</p>";
                echo "<p><strong>Document Root:</strong> " . htmlspecialchars($_SERVER['DOCUMENT_ROOT']) . "</p>";
                echo "<p><strong>Chemin du script:</strong> " . htmlspecialchars($_SERVER['SCRIPT_FILENAME']) . "</p>";
                
                // Vérifier les fichiers de configuration
                $files_to_check = [
                    'api/config/env.php' => 'Variables d\'environnement',
                    'api/config/db_config.json' => 'Configuration base de données',
                    '.htaccess' => 'Configuration Apache',
                    'api/.htaccess' => 'Configuration Apache API',
                    'index.html' => 'Page principale',
                    'index.php' => 'Redirection principale'
                ];
                
                echo "<h3>Fichiers critiques:</h3>";
                echo "<ul>";
                foreach ($files_to_check as $file => $desc) {
                    if (file_exists($file)) {
                        echo "<li><strong>$file:</strong> <span class='success'>Existe</span> - $desc</li>";
                    } else {
                        echo "<li><strong>$file:</strong> <span class='error'>Manquant</span> - $desc</li>";
                    }
                }
                echo "</ul>";
                
                // Check .htaccess issues
                if (file_exists('.htaccess')) {
                    $htaccess_content = file_get_contents('.htaccess');
                    if (strpos($htaccess_content, 'sites/qualiopi.ch') !== false) {
                        echo "<div class='warning'>";
                        echo "<p>⚠️ Le fichier .htaccess contient des chemins absolus qui peuvent causer des problèmes.</p>";
                        echo "<p><a href='fix-htaccess.php' class='button'>Corriger .htaccess</a></p>";
                        echo "</div>";
                    }
                }
                ?>
            </div>
            
            <?php if (!file_exists('api/config/env.php')): ?>
            <div class="card">
                <h2>Fichier env.php manquant</h2>
                <p class='error'>Le fichier api/config/env.php est absent, ce qui cause des erreurs de connexion.</p>
                
                <form method="post" action="">
                    <button type="submit" name="create_env" class="button">Créer le fichier env.php</button>
                </form>
                
                <?php
                if (isset($_POST['create_env'])) {
                    $env_dir = 'api/config';
                    if (!is_dir($env_dir)) {
                        mkdir($env_dir, 0755, true);
                    }
                    
                    $env_content = <<<EOT
<?php
// Configuration des variables d'environnement pour Infomaniak
define('DB_HOST', 'p71x6d.myd.infomaniak.com');
define('DB_NAME', 'p71x6d_richard');
define('DB_USER', 'p71x6d_richard');
define('DB_PASS', 'Trottinette43!');
define('API_BASE_URL', '/api');
define('APP_ENV', 'production');

// Fonction d'aide pour récupérer les variables d'environnement
function get_env(\$key, \$default = null) {
    \$const_name = strtoupper(\$key);
    if (defined(\$const_name)) {
        return constant(\$const_name);
    }
    return \$default;
}

// Alias pour compatibilité avec différentes syntaxes
if (!function_exists('env')) {
    function env(\$key, \$default = null) {
        return get_env(\$key, \$default);
    }
}
?>
EOT;
                    
                    if (file_put_contents("$env_dir/env.php", $env_content)) {
                        echo "<p class='success'>Fichier env.php créé avec succès!</p>";
                    } else {
                        echo "<p class='error'>Impossible de créer le fichier env.php. Vérifiez les permissions.</p>";
                    }
                }
                ?>
            </div>
            <?php endif; ?>
        </div>
        
        <div id="tab-files" class="tab-content">
            <div class="card">
                <h2>Structure des fichiers</h2>
                <?php
                // Vérifier les dossiers principaux
                $main_dirs = ['api', 'assets', 'public', 'dist'];
                
                echo "<h3>Dossiers principaux:</h3>";
                echo "<ul>";
                foreach ($main_dirs as $dir) {
                    if (is_dir($dir)) {
                        $file_count = count(glob("$dir/*"));
                        echo "<li><strong>$dir/</strong>: <span class='success'>Existe</span> ($file_count fichiers/dossiers)</li>";
                    } else {
                        echo "<li><strong>$dir/</strong>: <span class='error'>N'existe pas</span></li>";
                    }
                }
                echo "</ul>";
                
                // Vérifier les sous-dossiers API
                if (is_dir('api')) {
                    $api_subdirs = ['config', 'controllers', 'models', 'middleware'];
                    
                    echo "<h3>Structure API:</h3>";
                    echo "<ul>";
                    foreach ($api_subdirs as $subdir) {
                        $full_path = "api/$subdir";
                        if (is_dir($full_path)) {
                            $file_count = count(glob("$full_path/*"));
                            echo "<li><strong>$full_path/</strong>: <span class='success'>Existe</span> ($file_count fichiers)</li>";
                        } else {
                            echo "<li><strong>$full_path/</strong>: <span class='warning'>N'existe pas</span></li>";
                        }
                    }
                    echo "</ul>";
                }
                ?>
                
                <form method="post" action="">
                    <h3>Explorer un dossier spécifique</h3>
                    <input type="text" name="explore_dir" placeholder="api/config" style="padding: 8px; width: 200px;">
                    <button type="submit" name="submit_explore" class="button">Explorer</button>
                </form>
                
                <?php
                if (isset($_POST['submit_explore']) && !empty($_POST['explore_dir'])) {
                    $dir = $_POST['explore_dir'];
                    $dir = str_replace(['../', '..\\'], '', $dir); // Sécurité basique
                    
                    echo "<h3>Contenu de $dir:</h3>";
                    
                    if (is_dir($dir)) {
                        $files = scandir($dir);
                        echo "<ul>";
                        foreach ($files as $file) {
                            if ($file == '.' || $file == '..') continue;
                            
                            $path = "$dir/$file";
                            if (is_dir($path)) {
                                echo "<li>📁 $file/ (dossier)</li>";
                            } else {
                                $size = round(filesize($path) / 1024, 2);
                                echo "<li>📄 $file ($size KB)</li>";
                            }
                        }
                        echo "</ul>";
                    } else {
                        echo "<p class='error'>Le dossier n'existe pas ou n'est pas accessible.</p>";
                    }
                }
                ?>
            </div>
        </div>
        
        <div id="tab-db" class="tab-content">
            <div class="card">
                <h2>Configuration Base de Données</h2>
                <?php
                $db_config_file = 'api/config/db_config.json';
                $env_php_file = 'api/config/env.php';
                
                echo "<h3>Fichiers de configuration:</h3>";
                
                if (file_exists($db_config_file)) {
                    echo "<p class='success'>✓ Fichier db_config.json trouvé</p>";
                    $db_config = json_decode(file_get_contents($db_config_file), true);
                    if ($db_config) {
                        echo "<pre>";
                        echo "Host: " . htmlspecialchars($db_config['host']) . "\n";
                        echo "DB Name: " . htmlspecialchars($db_config['db_name']) . "\n";
                        echo "Username: " . htmlspecialchars($db_config['username']) . "\n";
                        echo "Password: " . (isset($db_config['password']) ? '********' : 'Non défini') . "\n";
                        echo "</pre>";
                    } else {
                        echo "<p class='error'>Impossible de parser le fichier db_config.json</p>";
                    }
                } else {
                    echo "<p class='error'>✗ Fichier db_config.json non trouvé</p>";
                    echo "<form method='post' action=''>";
                    echo "<button type='submit' name='create_db_config' class='button'>Créer db_config.json</button>";
                    echo "</form>";
                    
                    if (isset($_POST['create_db_config'])) {
                        $config_dir = 'api/config';
                        if (!is_dir($config_dir)) {
                            mkdir($config_dir, 0755, true);
                        }
                        
                        $db_config_content = <<<EOT
{
    "host": "p71x6d.myd.infomaniak.com",
    "db_name": "p71x6d_richard",
    "username": "p71x6d_richard",
    "password": "Trottinette43!"
}
EOT;
                        
                        if (file_put_contents("$config_dir/db_config.json", $db_config_content)) {
                            echo "<p class='success'>Fichier db_config.json créé avec succès!</p>";
                        } else {
                            echo "<p class='error'>Impossible de créer le fichier db_config.json. Vérifiez les permissions.</p>";
                        }
                    }
                }
                
                if (file_exists($env_php_file)) {
                    echo "<p class='success'>✓ Fichier env.php trouvé</p>";
                } else {
                    echo "<p class='error'>✗ Fichier env.php non trouvé</p>";
                }
                ?>
                
                <h3>Test de connexion à la base de données</h3>
                <form method="post" action="">
                    <button type="submit" name="test_db" class="button blue">Tester la connexion</button>
                </form>
                
                <?php
                if (isset($_POST['test_db'])) {
                    echo "<h4>Résultat du test:</h4>";
                    
                    // Test avec PDO
                    if (file_exists($db_config_file)) {
                        $db_config = json_decode(file_get_contents($db_config_file), true);
                        
                        if ($db_config) {
                            try {
                                $host = $db_config['host'];
                                $dbname = $db_config['db_name'];
                                $username = $db_config['username'];
                                $password = $db_config['password'];
                                
                                $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
                                $options = [
                                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                                    PDO::ATTR_EMULATE_PREPARES => false,
                                ];
                                
                                $pdo = new PDO($dsn, $username, $password, $options);
                                echo "<p class='success'>✓ Connexion à la base de données réussie!</p>";
                                
                                // Vérifier les tables existantes
                                $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
                                
                                if (count($tables) > 0) {
                                    echo "<p>Tables trouvées: " . count($tables) . "</p>";
                                    echo "<ul>";
                                    foreach ($tables as $table) {
                                        echo "<li>$table</li>";
                                    }
                                    echo "</ul>";
                                } else {
                                    echo "<p class='warning'>Aucune table trouvée dans la base de données.</p>";
                                }
                                
                            } catch (PDOException $e) {
                                echo "<p class='error'>Erreur de connexion: " . htmlspecialchars($e->getMessage()) . "</p>";
                            }
                        } else {
                            echo "<p class='error'>Impossible de parser le fichier db_config.json</p>";
                        }
                    } else {
                        echo "<p class='error'>Fichier db_config.json non trouvé</p>";
                    }
                }
                ?>
            </div>
        </div>
        
        <div id="tab-api" class="tab-content">
            <div class="card">
                <h2>Tests d'API</h2>
                <form method="post" action="">
                    <h3>Tester un endpoint API</h3>
                    <p>
                        <select name="api_test" style="padding: 8px; width: 200px;">
                            <option value="check.php">check.php (Statut)</option>
                            <option value="test.php">test.php (Test)</option>
                            <option value="login-test.php">login-test.php (Authentication)</option>
                        </select>
                        <button type="submit" name="submit_api_test" class="button">Tester</button>
                    </p>
                </form>
                
                <?php
                if (isset($_POST['submit_api_test'])) {
                    $endpoint = $_POST['api_test'];
                    $endpoint = basename($endpoint); // Sécurisation
                    $api_url = "api/$endpoint";
                    
                    echo "<h3>Test de l'endpoint: $api_url</h3>";
                    
                    if (file_exists($api_url)) {
                        echo "<p class='success'>✓ Le fichier existe</p>";
                        
                        // Utiliser curl pour tester l'API
                        $ch = curl_init();
                        curl_setopt($ch, CURLOPT_URL, $api_url);
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                        curl_setopt($ch, CURLOPT_HEADER, true);
                        $response = curl_exec($ch);
                        $info = curl_getinfo($ch);
                        curl_close($ch);
                        
                        echo "<p>Statut HTTP: " . $info['http_code'] . "</p>";
                        
                        // Séparer les en-têtes et le corps
                        $header_size = $info['header_size'];
                        $header = substr($response, 0, $header_size);
                        $body = substr($response, $header_size);
                        
                        echo "<h4>En-têtes de réponse:</h4>";
                        echo "<pre>" . htmlspecialchars($header) . "</pre>";
                        
                        echo "<h4>Corps de la réponse:</h4>";
                        // Essayer de formater JSON si c'est du JSON
                        $json_data = json_decode($body, true);
                        if ($json_data !== null) {
                            echo "<pre>" . htmlspecialchars(json_encode($json_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . "</pre>";
                        } else {
                            echo "<pre>" . htmlspecialchars($body) . "</pre>";
                        }
                    } else {
                        echo "<p class='error'>✗ Le fichier $api_url n'existe pas</p>";
                    }
                }
                ?>
                
                <h3>Créer un script de test API</h3>
                <form method="post" action="">
                    <button type="submit" name="create_test_api" class="button">Créer api/test.php</button>
                </form>
                
                <?php
                if (isset($_POST['create_test_api'])) {
                    $api_dir = 'api';
                    if (!is_dir($api_dir)) {
                        mkdir($api_dir, 0755);
                    }
                    
                    $test_api_content = <<<EOT
<?php
// Test API pour FormaCert
header('Content-Type: application/json');

// Activer CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// En cas de requête OPTIONS (preflight), terminer immédiatement
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Vérifier si env.php existe
\$env_exists = file_exists(__DIR__ . '/config/env.php');

// Vérifier si db_config.json existe
\$db_config_exists = file_exists(__DIR__ . '/config/db_config.json');

// Tester si la connexion à la base de données fonctionne
\$db_connection = false;
\$db_error = "";

if (\$db_config_exists) {
    try {
        \$db_config = json_decode(file_get_contents(__DIR__ . '/config/db_config.json'), true);
        
        if (\$db_config) {
            \$host = \$db_config['host'];
            \$dbname = \$db_config['db_name'];
            \$username = \$db_config['username'];
            \$password = \$db_config['password'];
            
            \$dsn = "mysql:host=\$host;dbname=\$dbname;charset=utf8mb4";
            \$options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            \$pdo = new PDO(\$dsn, \$username, \$password, \$options);
            \$db_connection = true;
        }
    } catch (PDOException \$e) {
        \$db_error = \$e->getMessage();
    }
}

// Construire la réponse
\$response = [
    'status' => 'success',
    'message' => 'API FormaCert fonctionne correctement',
    'timestamp' => date('Y-m-d H:i:s'),
    'diagnostics' => [
        'php_version' => phpversion(),
        'env_exists' => \$env_exists,
        'db_config_exists' => \$db_config_exists,
        'db_connection' => \$db_connection
    ]
];

if (\$db_error) {
    \$response['diagnostics']['db_error'] = \$db_error;
}

echo json_encode(\$response, JSON_PRETTY_PRINT);
?>
EOT;
                    
                    if (file_put_contents("$api_dir/test.php", $test_api_content)) {
                        echo "<p class='success'>Fichier api/test.php créé avec succès!</p>";
                        echo "<p><a href='api/test.php' target='_blank' class='button blue'>Tester maintenant</a></p>";
                    } else {
                        echo "<p class='error'>Impossible de créer le fichier api/test.php. Vérifiez les permissions.</p>";
                    }
                }
                ?>
            </div>
        </div>
    </div>
    
    <script>
        function showTab(tabId) {
            // Masquer tous les onglets
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Afficher l'onglet sélectionné
            document.getElementById(tabId).classList.add('active');
            document.querySelector(`.tab[onclick="showTab('${tabId}')"]`).classList.add('active');
        }
    </script>
</body>
</html>
