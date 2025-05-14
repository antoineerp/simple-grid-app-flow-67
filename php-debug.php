
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic PHP et MySQL</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Diagnostic PHP et MySQL</h1>
    
    <div class="section">
        <h2>Environnement PHP</h2>
        <?php
        echo "<p>PHP Version: " . phpversion() . "</p>";
        echo "<p>Serveur Web: " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
        echo "<p>Interface PHP: " . php_sapi_name() . "</p>";
        echo "<p>Extensions chargées: " . implode(', ', get_loaded_extensions()) . "</p>";
        
        // Vérifier les extensions critiques
        $required_extensions = ['pdo', 'pdo_mysql', 'mysqli', 'json', 'mbstring'];
        echo "<h3>Extensions requises:</h3><ul>";
        foreach ($required_extensions as $ext) {
            if (extension_loaded($ext)) {
                echo "<li><span class='success'>✓ $ext</span></li>";
            } else {
                echo "<li><span class='error'>✗ $ext</span></li>";
            }
        }
        echo "</ul>";
        ?>
    </div>
    
    <div class="section">
        <h2>Test de connexion à la base de données</h2>
        <?php
        // Tester la connexion avec les paramètres de db_config.json
        $config_file = __DIR__ . '/api/config/db_config.json';
        if (file_exists($config_file)) {
            echo "<p>Fichier de configuration trouvé: $config_file</p>";
            $json = file_get_contents($config_file);
            $config = json_decode($json, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                echo "<p class='error'>Erreur de décodage JSON: " . json_last_error_msg() . "</p>";
                echo "<pre>" . htmlentities($json) . "</pre>";
            } else {
                echo "<p>Configuration chargée:</p>";
                echo "<ul>";
                echo "<li>Hôte: " . (isset($config['host']) ? $config['host'] : 'Non défini') . "</li>";
                echo "<li>Base de données: " . (isset($config['db_name']) ? $config['db_name'] : 'Non défini') . "</li>";
                echo "<li>Utilisateur: " . (isset($config['username']) ? $config['username'] : 'Non défini') . "</li>";
                echo "<li>Mot de passe: " . (isset($config['password']) ? (empty($config['password']) ? 'VIDE' : 'Défini') : 'Non défini') . "</li>";
                echo "</ul>";
                
                // Tester la connexion MySQLi
                if (extension_loaded('mysqli')) {
                    echo "<h3>Test de connexion MySQLi:</h3>";
                    if (isset($config['host']) && isset($config['username'])) {
                        try {
                            $mysqli = new mysqli(
                                $config['host'],
                                $config['username'],
                                $config['password'] ?? '',
                                $config['db_name'] ?? ''
                            );
                            
                            if ($mysqli->connect_error) {
                                echo "<p class='error'>Erreur de connexion MySQLi: " . $mysqli->connect_error . "</p>";
                            } else {
                                echo "<p class='success'>Connexion MySQLi réussie!</p>";
                                echo "<p>Version MySQL: " . $mysqli->server_info . "</p>";
                                
                                // Afficher les tables
                                $tables_result = $mysqli->query("SHOW TABLES");
                                if ($tables_result) {
                                    $tables = [];
                                    while ($row = $tables_result->fetch_array()) {
                                        $tables[] = $row[0];
                                    }
                                    echo "<p>Tables disponibles (" . count($tables) . "): " . implode(", ", $tables) . "</p>";
                                }
                                
                                $mysqli->close();
                            }
                        } catch (Exception $e) {
                            echo "<p class='error'>Exception MySQLi: " . $e->getMessage() . "</p>";
                        }
                    } else {
                        echo "<p class='warning'>Configuration incomplète pour le test MySQLi.</p>";
                    }
                } else {
                    echo "<p class='warning'>Extension MySQLi non disponible.</p>";
                }
                
                // Tester la connexion PDO
                if (extension_loaded('pdo') && extension_loaded('pdo_mysql')) {
                    echo "<h3>Test de connexion PDO:</h3>";
                    if (isset($config['host']) && isset($config['username'])) {
                        try {
                            $dsn = "mysql:host={$config['host']};charset=utf8mb4";
                            if (isset($config['db_name']) && !empty($config['db_name'])) {
                                $dsn .= ";dbname={$config['db_name']}";
                            }
                            
                            $pdo = new PDO(
                                $dsn,
                                $config['username'],
                                $config['password'] ?? '',
                                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
                            );
                            
                            echo "<p class='success'>Connexion PDO réussie!</p>";
                            
                            // Afficher la version
                            $version = $pdo->query('SELECT VERSION()')->fetchColumn();
                            echo "<p>Version MySQL: " . $version . "</p>";
                            
                            // Afficher les tables
                            if (isset($config['db_name']) && !empty($config['db_name'])) {
                                $tables_result = $pdo->query("SHOW TABLES");
                                if ($tables_result) {
                                    $tables = $tables_result->fetchAll(PDO::FETCH_COLUMN);
                                    echo "<p>Tables disponibles (" . count($tables) . "): " . implode(", ", $tables) . "</p>";
                                }
                            }
                        } catch (PDOException $e) {
                            echo "<p class='error'>Erreur PDO: " . $e->getMessage() . "</p>";
                        }
                    } else {
                        echo "<p class='warning'>Configuration incomplète pour le test PDO.</p>";
                    }
                } else {
                    echo "<p class='warning'>Extensions PDO et/ou PDO_MySQL non disponibles.</p>";
                }
            }
        } else {
            echo "<p class='error'>Fichier de configuration non trouvé: $config_file</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Informations sur le serveur</h2>
        <?php
        echo "<p>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
        echo "<p>Chemin absolu du script: " . __FILE__ . "</p>";
        echo "<p>Répertoire du script: " . dirname(__FILE__) . "</p>";
        
        // Vérifier les droits d'écriture
        $test_directories = [
            __DIR__ . '/api',
            __DIR__ . '/api/config',
            __DIR__ . '/api/logs',
            __DIR__ . '/public',
            __DIR__ . '/public/lovable-uploads'
        ];
        
        echo "<h3>Permissions des dossiers:</h3><ul>";
        foreach ($test_directories as $dir) {
            if (file_exists($dir)) {
                if (is_writable($dir)) {
                    echo "<li><span class='success'>✓ $dir (Accessible en écriture)</span></li>";
                } else {
                    echo "<li><span class='error'>✗ $dir (Non accessible en écriture)</span></li>";
                }
            } else {
                echo "<li><span class='warning'>? $dir (N'existe pas)</span></li>";
            }
        }
        echo "</ul>";
        
        // Vérifier si nous pouvons créer un fichier test
        $test_file = __DIR__ . '/api/test_file.txt';
        $test_content = "Test d'écriture: " . date('Y-m-d H:i:s');
        $write_success = @file_put_contents($test_file, $test_content);
        
        if ($write_success !== false) {
            echo "<p class='success'>Test d'écriture de fichier réussi: $test_file</p>";
            // Nettoyer après le test
            @unlink($test_file);
        } else {
            echo "<p class='error'>Échec du test d'écriture de fichier: $test_file</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Actions</h2>
        <p>
            <a href="phpinfo.php" style="display:inline-block; background:#4CAF50; color:white; padding:10px 15px; text-decoration:none; border-radius:5px; margin-right:10px;">
                Voir phpinfo()
            </a>
            <a href="api/db-info.php" style="display:inline-block; background:#2196F3; color:white; padding:10px 15px; text-decoration:none; border-radius:5px; margin-right:10px;">
                Info base de données
            </a>
            <a href="api/db-test.php" style="display:inline-block; background:#FF9800; color:white; padding:10px 15px; text-decoration:none; border-radius:5px;">
                Tester connexion DB
            </a>
        </p>
    </div>
</body>
</html>
