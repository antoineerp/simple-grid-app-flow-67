
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des chemins et du routage</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; background-color: #f0fff0; padding: 10px; border-left: 4px solid green; }
        .error { color: red; font-weight: bold; background-color: #fff0f0; padding: 10px; border-left: 4px solid red; }
        .warning { color: orange; font-weight: bold; background-color: #fffaf0; padding: 10px; border-left: 4px solid orange; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .include-path { background-color: #e8f4f8; padding: 10px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Diagnostic des chemins et du routage PHP</h1>
    
    <h2>1. Informations sur le serveur</h2>
    <?php
    echo "<table>";
    echo "<tr><td>Serveur</td><td>" . htmlspecialchars($_SERVER['SERVER_SOFTWARE'] ?? 'Non défini') . "</td></tr>";
    echo "<tr><td>PHP Version</td><td>" . phpversion() . "</td></tr>";
    echo "<tr><td>Document Root</td><td>" . htmlspecialchars($_SERVER['DOCUMENT_ROOT'] ?? 'Non défini') . "</td></tr>";
    echo "<tr><td>Script Filename</td><td>" . htmlspecialchars($_SERVER['SCRIPT_FILENAME'] ?? 'Non défini') . "</td></tr>";
    echo "<tr><td>Request URI</td><td>" . htmlspecialchars($_SERVER['REQUEST_URI'] ?? 'Non défini') . "</td></tr>";
    echo "</table>";
    ?>
    
    <h2>2. Vérification des fichiers clés</h2>
    
    <h3>Fichier env.php</h3>
    <?php
    // Chemins possibles pour env.php
    $envPaths = [
        './api/config/env.php',
        'api/config/env.php',
        '../api/config/env.php',
        dirname(__DIR__) . '/api/config/env.php',
        __DIR__ . '/api/config/env.php',
        '/api/config/env.php',
        '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch/api/config/env.php',
        'sites/qualiopi.ch/api/config/env.php'
    ];

    $envFound = false;
    foreach ($envPaths as $path) {
        echo "<p>Test du chemin: " . htmlspecialchars($path) . " - ";
        if (file_exists($path)) {
            echo "<span class='success'>EXISTE</span>";
            echo " (Taille: " . filesize($path) . " octets, Dernière modification: " . date("Y-m-d H:i:s", filemtime($path)) . ")";
            $envFound = true;
            $foundPath = $path;
        } else {
            echo "<span class='error'>N'EXISTE PAS</span>";
        }
        echo "</p>";
    }

    if ($envFound) {
        echo "<div class='success'>Le fichier env.php a été trouvé à l'emplacement: " . htmlspecialchars($foundPath) . "</div>";
        
        // Vérifier si le fichier est lisible
        if (is_readable($foundPath)) {
            echo "<div class='success'>Le fichier est lisible</div>";
            
            // Essayer de lire le contenu
            $content = file_get_contents($foundPath);
            echo "<p>Contenu du fichier (premiers caractères): " . htmlspecialchars(substr($content, 0, 100)) . "...</p>";
            
            // Vérifier si le fichier contient les définitions nécessaires
            $requiredConstants = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'];
            $missing = [];
            foreach ($requiredConstants as $const) {
                if (!preg_match("/define\s*\(\s*['\"]" . $const . "['\"].*\)/i", $content)) {
                    $missing[] = $const;
                }
            }
            
            if (empty($missing)) {
                echo "<div class='success'>Le fichier contient toutes les définitions requises</div>";
            } else {
                echo "<div class='warning'>Le fichier ne contient pas toutes les définitions requises. Manquantes: " . implode(', ', $missing) . "</div>";
            }
        } else {
            echo "<div class='error'>Le fichier n'est pas lisible!</div>";
        }
        
        // Tester l'inclusion
        echo "<h3>Test d'inclusion du fichier env.php</h3>";
        try {
            @include_once $foundPath;
            if (defined('DB_HOST')) {
                echo "<div class='success'>Inclusion réussie! DB_HOST est définie comme: " . DB_HOST . "</div>";
            } else {
                echo "<div class='error'>Le fichier a été inclus mais DB_HOST n'est pas définie</div>";
            }
        } catch (Exception $e) {
            echo "<div class='error'>Erreur lors de l'inclusion: " . htmlspecialchars($e->getMessage()) . "</div>";
        }
    } else {
        echo "<div class='error'>Le fichier env.php n'a pas été trouvé dans les chemins testés!</div>";
    }
    ?>
    
    <h2>3. Vérification des chemins d'inclusion PHP</h2>
    <div class="include-path">
        <?php
        $includePaths = explode(PATH_SEPARATOR, get_include_path());
        echo "<p>Chemins d'inclusion PHP:</p><ul>";
        foreach ($includePaths as $path) {
            echo "<li>" . htmlspecialchars($path) . "</li>";
        }
        echo "</ul>";
        ?>
    </div>
    
    <h2>4. Vérification de la configuration .htaccess</h2>
    <?php
    $htaccessPaths = [
        './.htaccess',
        './api/.htaccess'
    ];
    
    foreach ($htaccessPaths as $path) {
        echo "<h3>Fichier: " . htmlspecialchars($path) . "</h3>";
        if (file_exists($path)) {
            echo "<div class='success'>Le fichier existe</div>";
            $content = file_get_contents($path);
            echo "<pre>" . htmlspecialchars($content) . "</pre>";
            
            // Vérifier les règles de réécriture
            if (preg_match('/RewriteEngine\s+On/i', $content)) {
                echo "<div class='success'>La réécriture d'URL est activée</div>";
            } else {
                echo "<div class='warning'>La réécriture d'URL ne semble pas être activée</div>";
            }
            
            // Vérifier la configuration PHP
            if (preg_match('/AddHandler\s+application\/x-httpd-php/i', $content)) {
                echo "<div class='success'>La configuration du handler PHP est présente</div>";
            } else {
                echo "<div class='warning'>La configuration du handler PHP pourrait être manquante</div>";
            }
        } else {
            echo "<div class='warning'>Le fichier n'existe pas</div>";
        }
    }
    ?>
    
    <h2>5. Test de routage des requêtes API</h2>
    <?php
    // Tester si l'API est accessible
    $apiEndpoints = [
        '/api/check.php' => 'Vérification de base',
        '/api/test.php' => 'Test API',
        '/api/config/env.php' => 'Fichier env.php direct',
        '/api/auth.php' => 'Authentification'
    ];
    
    echo "<table>";
    echo "<tr><th>Endpoint</th><th>URL</th><th>Méthode</th><th>Résultat</th></tr>";
    
    foreach ($apiEndpoints as $endpoint => $description) {
        $url = 'http' . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 's' : '') . '://' . $_SERVER['HTTP_HOST'] . $endpoint;
        
        echo "<tr>";
        echo "<td>" . htmlspecialchars($description) . "</td>";
        echo "<td><a href='" . htmlspecialchars($url) . "' target='_blank'>" . htmlspecialchars($endpoint) . "</a></td>";
        echo "<td>GET</td>";
        
        // Tester l'accès sans exécuter
        $headers = @get_headers($url);
        if ($headers) {
            $status = substr($headers[0], 9, 3);
            if ($status >= 200 && $status < 300) {
                echo "<td><span class='success'>OK ($status)</span></td>";
            } else {
                echo "<td><span class='error'>Erreur ($status)</span></td>";
            }
        } else {
            echo "<td><span class='error'>Inaccessible</span></td>";
        }
        
        echo "</tr>";
    }
    echo "</table>";
    ?>
    
    <h2>6. Suggestions de résolution</h2>
    
    <h3>Si le fichier env.php existe mais n'est pas trouvé:</h3>
    <ol>
        <li>Vérifier que le chemin d'accès au fichier est correct dans les scripts PHP</li>
        <li>Vérifier les permissions du fichier (il devrait être lisible par l'utilisateur web)</li>
        <li>Créer un lien symbolique vers le fichier dans les répertoires où il est cherché</li>
        <li>Vérifier que la directive <code>include_path</code> de PHP est correctement configurée</li>
    </ol>
    
    <h3>Si les requêtes PHP ne sont pas exécutées:</h3>
    <ol>
        <li>Vérifier que le module PHP est correctement activé sur le serveur</li>
        <li>Vérifier les directives PHP dans le fichier .htaccess</li>
        <li>Vérifier que le serveur web a les permissions pour exécuter les scripts PHP</li>
        <li>Consulter les logs d'erreur du serveur pour plus d'informations</li>
    </ol>
    
    <h2>7. Tests supplémentaires</h2>
    
    <div>
        <h3>Test de connexion à la base de données</h3>
        <form method="post" action="<?php echo htmlspecialchars($_SERVER['PHP_SELF']); ?>">
            <input type="hidden" name="test_db" value="1">
            <button type="submit">Tester la connexion à la base de données</button>
        </form>
        
        <?php
        if (isset($_POST['test_db'])) {
            // Essayer de se connecter à la base de données
            try {
                // Chercher un fichier de configuration
                if (defined('DB_HOST') && defined('DB_NAME') && defined('DB_USER') && defined('DB_PASS')) {
                    $host = DB_HOST;
                    $dbname = DB_NAME;
                    $username = DB_USER;
                    $password = DB_PASS;
                    
                    echo "<div>Tentative de connexion à la base de données avec les constantes DB_* définies...</div>";
                } else {
                    // Essayer de charger depuis db_config.json
                    $dbConfigPath = './api/config/db_config.json';
                    if (file_exists($dbConfigPath)) {
                        $dbConfig = json_decode(file_get_contents($dbConfigPath), true);
                        $host = $dbConfig['host'] ?? '';
                        $dbname = $dbConfig['db_name'] ?? '';
                        $username = $dbConfig['username'] ?? '';
                        $password = $dbConfig['password'] ?? '';
                        
                        echo "<div>Tentative de connexion à la base de données avec db_config.json...</div>";
                    } else {
                        throw new Exception("Impossible de trouver les informations de connexion à la base de données");
                    }
                }
                
                $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];
                
                $pdo = new PDO($dsn, $username, $password, $options);
                echo "<div class='success'>Connexion à la base de données réussie!</div>";
                
                // Afficher quelques informations sur la base de données
                $stmt = $pdo->query("SELECT VERSION() as version");
                $version = $stmt->fetch();
                echo "<p>Version MySQL: " . htmlspecialchars($version['version']) . "</p>";
                
                // Lister les tables
                $stmt = $pdo->query("SHOW TABLES");
                $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                echo "<p>Tables dans la base de données:</p><ul>";
                foreach (array_slice($tables, 0, 10) as $table) {
                    echo "<li>" . htmlspecialchars($table) . "</li>";
                }
                if (count($tables) > 10) {
                    echo "<li>... et " . (count($tables) - 10) . " autres tables</li>";
                }
                echo "</ul>";
                
            } catch (PDOException $e) {
                echo "<div class='error'>Erreur de connexion à la base de données: " . htmlspecialchars($e->getMessage()) . "</div>";
            } catch (Exception $e) {
                echo "<div class='error'>" . htmlspecialchars($e->getMessage()) . "</div>";
            }
        }
        ?>
    </div>
</body>
</html>
