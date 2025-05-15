
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des fichiers PHP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; padding: 10px; background-color: #f0fff0; border-left: 4px solid green; }
        .error { color: red; padding: 10px; background-color: #fff0f0; border-left: 4px solid red; }
        .warning { color: orange; padding: 10px; background-color: #fffaf0; border-left: 4px solid orange; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Vérification des fichiers PHP</h1>
        
        <div class="card">
            <h2>Fichiers de configuration</h2>
            
            <?php
            // Vérifier env.php
            echo "<h3>Vérification de env.php</h3>";
            $env_file = './api/config/env.php';
            
            if (file_exists($env_file)) {
                echo "<p>Fichier trouvé: <strong>api/config/env.php</strong></p>";
                
                // Essayer d'inclure le fichier pour vérifier la syntaxe PHP
                try {
                    // Capturer la sortie pour éviter de l'afficher
                    ob_start();
                    $result = include $env_file;
                    ob_end_clean();
                    
                    if ($result !== false) {
                        echo "<div class='success'>Le fichier env.php semble être valide et s'exécute sans erreurs.</div>";
                        
                        // Vérifier les constantes définies
                        $required_constants = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'];
                        $missing = [];
                        
                        foreach ($required_constants as $constant) {
                            if (!defined($constant)) {
                                $missing[] = $constant;
                            }
                        }
                        
                        if (empty($missing)) {
                            echo "<div class='success'>Toutes les constantes requises sont définies.</div>";
                            echo "<p>DB_HOST: " . constant('DB_HOST') . "</p>";
                            echo "<p>DB_NAME: " . constant('DB_NAME') . "</p>";
                            echo "<p>DB_USER: " . constant('DB_USER') . "</p>";
                            echo "<p>DB_PASS: ********</p>";
                        } else {
                            echo "<div class='error'>Certaines constantes sont manquantes: " . implode(', ', $missing) . "</div>";
                        }
                        
                        // Vérifier la fonction get_env
                        if (function_exists('get_env')) {
                            echo "<div class='success'>La fonction get_env() est définie.</div>";
                        } else {
                            echo "<div class='error'>La fonction get_env() est manquante.</div>";
                        }
                    } else {
                        echo "<div class='error'>Le fichier env.php a été inclus mais a retourné false.</div>";
                    }
                } catch (Throwable $e) {
                    echo "<div class='error'>Erreur lors de l'inclusion du fichier env.php: " . htmlspecialchars($e->getMessage()) . "</div>";
                }
                
                // Afficher le contenu du fichier
                $content = file_get_contents($env_file);
                echo "<h4>Contenu du fichier:</h4>";
                echo "<pre>" . htmlspecialchars($content) . "</pre>";
                
                // Vérifier s'il y a des caractères suspects
                if (strpos($content, "Check failure") !== false || 
                    strpos($content, "error") !== false || 
                    strpos($content, "warning") !== false) {
                    echo "<div class='error'>Le fichier contient des messages d'erreur qui pourraient interférer avec son exécution.</div>";
                }
            } else {
                echo "<div class='error'>Fichier env.php non trouvé!</div>";
            }
            
            // Vérifier db_config.json
            echo "<h3>Vérification de db_config.json</h3>";
            $db_config_file = './api/config/db_config.json';
            
            if (file_exists($db_config_file)) {
                echo "<p>Fichier trouvé: <strong>api/config/db_config.json</strong></p>";
                
                // Lire le fichier JSON
                $content = file_get_contents($db_config_file);
                echo "<h4>Contenu du fichier:</h4>";
                echo "<pre>" . htmlspecialchars($content) . "</pre>";
                
                // Vérifier la validité du JSON
                $json_data = json_decode($content, true);
                if ($json_data === null) {
                    echo "<div class='error'>Le fichier JSON n'est pas valide: " . json_last_error_msg() . "</div>";
                } else {
                    echo "<div class='success'>Le fichier JSON est valide.</div>";
                    
                    // Vérifier les champs requis
                    $required_fields = ['host', 'db_name', 'username', 'password'];
                    $missing = [];
                    
                    foreach ($required_fields as $field) {
                        if (!isset($json_data[$field]) || empty($json_data[$field])) {
                            $missing[] = $field;
                        }
                    }
                    
                    if (empty($missing)) {
                        echo "<div class='success'>Tous les champs requis sont présents.</div>";
                    } else {
                        echo "<div class='error'>Certains champs sont manquants: " . implode(', ', $missing) . "</div>";
                    }
                }
                
                // Vérifier s'il y a des caractères suspects
                if (strpos($content, "Check failure") !== false || 
                    strpos($content, "error") !== false || 
                    strpos($content, "warning") !== false) {
                    echo "<div class='error'>Le fichier contient des messages d'erreur qui pourraient interférer avec son interprétation.</div>";
                }
            } else {
                echo "<div class='error'>Fichier db_config.json non trouvé!</div>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Test de connexion à la base de données</h2>
            
            <?php
            // Essayer de se connecter à la base de données
            try {
                // Charger les constantes depuis env.php si elles ne sont pas déjà définies
                if (!defined('DB_HOST') && file_exists($env_file)) {
                    include_once $env_file;
                }
                
                // Charger la configuration depuis db_config.json si les constantes ne sont pas définies
                if (!defined('DB_HOST') && file_exists($db_config_file)) {
                    $json_content = file_get_contents($db_config_file);
                    $db_config = json_decode($json_content, true);
                    
                    if ($db_config) {
                        define('DB_HOST', $db_config['host'] ?? '');
                        define('DB_NAME', $db_config['db_name'] ?? '');
                        define('DB_USER', $db_config['username'] ?? '');
                        define('DB_PASS', $db_config['password'] ?? '');
                    }
                }
                
                if (defined('DB_HOST') && defined('DB_NAME') && defined('DB_USER') && defined('DB_PASS')) {
                    // Connecter à la base de données
                    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
                    $options = [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                    ];
                    
                    echo "<p>Test de connexion à " . DB_HOST . " avec l'utilisateur " . DB_USER . "...</p>";
                    
                    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
                    
                    echo "<div class='success'>Connexion à la base de données établie avec succès!</div>";
                    
                    // Afficher quelques informations sur la connexion
                    echo "<h3>Informations sur la base de données:</h3>";
                    $stmt = $pdo->query("SELECT VERSION() as version");
                    $version = $stmt->fetch();
                    echo "<p>Version MySQL: " . htmlspecialchars($version['version']) . "</p>";
                    
                    // Vérifier les tables
                    $stmt = $pdo->query("SHOW TABLES");
                    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                    
                    echo "<p>Nombre de tables: " . count($tables) . "</p>";
                    if (!empty($tables)) {
                        echo "<ul>";
                        foreach (array_slice($tables, 0, 10) as $table) {
                            echo "<li>" . htmlspecialchars($table) . "</li>";
                        }
                        if (count($tables) > 10) {
                            echo "<li>...</li>";
                        }
                        echo "</ul>";
                    }
                } else {
                    echo "<div class='error'>Impossible de tester la connexion: certaines informations de configuration sont manquantes.</div>";
                }
            } catch (PDOException $e) {
                echo "<div class='error'>Erreur de connexion à la base de données: " . htmlspecialchars($e->getMessage()) . "</div>";
            } catch (Throwable $e) {
                echo "<div class='error'>Erreur lors du test de connexion: " . htmlspecialchars($e->getMessage()) . "</div>";
            }
            ?>
        </div>

        <div class="card">
            <h2>Rapport de vérification du déploiement</h2>
            
            <?php
            // Vérifier la structure des dossiers
            $required_directories = [
                'api', 'api/config', 'api/controllers', 'api/models',
                'assets', 'public', 'public/lovable-uploads'
            ];
            
            $missing_dirs = [];
            foreach ($required_directories as $dir) {
                if (!is_dir('./' . $dir)) {
                    $missing_dirs[] = $dir;
                }
            }
            
            if (empty($missing_dirs)) {
                echo "<div class='success'>Tous les dossiers requis sont présents.</div>";
            } else {
                echo "<div class='error'>Certains dossiers sont manquants: " . implode(', ', $missing_dirs) . "</div>";
            }
            
            // Vérifier les fichiers essentiels
            $essential_files = [
                'index.php', 'index.html', '.htaccess',
                'api/index.php', 'api/config/database.php'
            ];
            
            $missing_files = [];
            foreach ($essential_files as $file) {
                if (!file_exists('./' . $file)) {
                    $missing_files[] = $file;
                }
            }
            
            if (empty($missing_files)) {
                echo "<div class='success'>Tous les fichiers essentiels sont présents.</div>";
            } else {
                echo "<div class='error'>Certains fichiers essentiels sont manquants: " . implode(', ', $missing_files) . "</div>";
            }
            ?>
        </div>
    </div>
</body>
</html>
