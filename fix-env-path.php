
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des chemins vers env.php</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; background-color: #f0fff0; padding: 10px; border-left: 4px solid green; }
        .error { color: red; font-weight: bold; background-color: #fff0f0; padding: 10px; border-left: 4px solid red; }
        .warning { color: orange; font-weight: bold; background-color: #fffaf0; padding: 10px; border-left: 4px solid orange; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
        button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; margin: 5px 0; }
        button:hover { background-color: #45a049; }
    </style>
</head>
<body>
    <h1>Diagnostic et correction des chemins vers env.php</h1>
    
    <?php
    // Liste des chemins attendus pour env.php
    $expected_paths = [
        './api/config/env.php',
        'api/config/env.php',
        '/api/config/env.php',
        '../api/config/env.php',
        __DIR__ . '/api/config/env.php',
        dirname(__DIR__) . '/api/config/env.php',
    ];
    
    // Chemin source (celui qui existe vraiment)
    $source_path = null;
    foreach ($expected_paths as $path) {
        if (file_exists($path)) {
            $source_path = $path;
            echo "<div class='success'>Fichier env.php trouvé à: " . htmlspecialchars($path) . "</div>";
            echo "<p>Chemin absolu: " . htmlspecialchars(realpath($path)) . "</p>";
            break;
        }
    }
    
    if (!$source_path) {
        echo "<div class='error'>Aucun fichier env.php trouvé dans les chemins attendus!</div>";
        
        // Recherche plus large
        echo "<h2>Recherche élargie du fichier env.php</h2>";
        $found = false;
        
        // Fonction récursive pour trouver des fichiers
        function find_files($dir, $pattern) {
            $results = [];
            $files = scandir($dir);
            
            foreach ($files as $file) {
                if ($file === '.' || $file === '..') continue;
                
                $path = $dir . '/' . $file;
                
                if (is_dir($path)) {
                    $subresults = find_files($path, $pattern);
                    $results = array_merge($results, $subresults);
                } else if (preg_match($pattern, $file)) {
                    $results[] = $path;
                }
            }
            
            return $results;
        }
        
        try {
            $search_results = find_files(__DIR__, '/^env.*\.php$/');
            
            if (!empty($search_results)) {
                echo "<div class='success'>Fichiers env*.php trouvés:</div>";
                echo "<ul>";
                foreach ($search_results as $file) {
                    echo "<li>" . htmlspecialchars($file) . "</li>";
                    $found = true;
                    if (basename($file) === 'env.php') {
                        $source_path = $file;
                    }
                }
                echo "</ul>";
            } else {
                echo "<div class='error'>Aucun fichier env*.php trouvé sur le serveur!</div>";
            }
        } catch (Exception $e) {
            echo "<div class='error'>Erreur lors de la recherche: " . htmlspecialchars($e->getMessage()) . "</div>";
        }
    }
    
    if ($source_path) {
        echo "<h2>Analyse du fichier env.php</h2>";
        
        // Vérifier le contenu du fichier
        $env_content = file_get_contents($source_path);
        
        // Vérifier s'il contient les définitions attendues
        $required_patterns = [
            'DB_HOST' => '/define\s*\(\s*[\'"]DB_HOST[\'"]\s*,/',
            'DB_NAME' => '/define\s*\(\s*[\'"]DB_NAME[\'"]\s*,/',
            'DB_USER' => '/define\s*\(\s*[\'"]DB_USER[\'"]\s*,/',
            'DB_PASS' => '/define\s*\(\s*[\'"]DB_PASS[\'"]\s*,/',
        ];
        
        $missing = [];
        foreach ($required_patterns as $name => $pattern) {
            if (!preg_match($pattern, $env_content)) {
                $missing[] = $name;
            }
        }
        
        if (!empty($missing)) {
            echo "<div class='warning'>Le fichier env.php trouvé ne contient pas toutes les définitions requises.</div>";
            echo "<p>Définitions manquantes: " . implode(', ', $missing) . "</p>";
        } else {
            echo "<div class='success'>Le fichier env.php contient toutes les définitions requises.</div>";
        }
        
        // Vérifier s'il y a des erreurs de syntaxe PHP
        $temp_file = tempnam(sys_get_temp_dir(), 'php_check');
        file_put_contents($temp_file, $env_content);
        
        exec("php -l " . escapeshellarg($temp_file) . " 2>&1", $output, $return_var);
        unlink($temp_file);
        
        if ($return_var !== 0) {
            echo "<div class='error'>Erreurs de syntaxe dans env.php:</div>";
            echo "<pre>" . htmlspecialchars(implode("\n", $output)) . "</pre>";
        } else {
            echo "<div class='success'>Aucune erreur de syntaxe dans env.php.</div>";
        }
        
        // Fonctionnalité pour créer des liens symboliques ou copier le fichier
        echo "<h2>Correction des chemins d'accès</h2>";
        
        // Liste des dossiers cibles où le fichier devrait être accessible
        $target_dirs = [
            'api/config',
            './api/config'
        ];
        
        foreach ($target_dirs as $dir) {
            if (!is_dir($dir)) {
                echo "<div class='warning'>Le répertoire " . htmlspecialchars($dir) . " n'existe pas.</div>";
                
                // Offrir la possibilité de créer le répertoire
                if (isset($_GET['create_dir']) && $_GET['create_dir'] === $dir) {
                    if (mkdir($dir, 0755, true)) {
                        echo "<div class='success'>Répertoire " . htmlspecialchars($dir) . " créé avec succès.</div>";
                    } else {
                        echo "<div class='error'>Impossible de créer le répertoire " . htmlspecialchars($dir) . "</div>";
                    }
                } else {
                    echo "<p><a href='?create_dir=" . urlencode($dir) . "'><button>Créer ce répertoire</button></a></p>";
                }
            }
        }
        
        // Si des répertoires ont été créés, offrir la possibilité de copier env.php
        if (isset($_GET['copy_env']) && $_GET['copy_env'] === 'true') {
            $success = true;
            $messages = [];
            
            foreach ($target_dirs as $dir) {
                if (is_dir($dir) && realpath($dir . '/env.php') !== realpath($source_path)) {
                    if (copy($source_path, $dir . '/env.php')) {
                        $messages[] = "<div class='success'>Fichier env.php copié avec succès vers " . htmlspecialchars($dir) . "</div>";
                    } else {
                        $success = false;
                        $messages[] = "<div class='error'>Impossible de copier env.php vers " . htmlspecialchars($dir) . "</div>";
                    }
                }
            }
            
            foreach ($messages as $msg) {
                echo $msg;
            }
            
            if ($success) {
                echo "<div class='success'>Toutes les copies ont été effectuées avec succès.</div>";
                echo "<p>Veuillez tester à nouveau votre application pour voir si le problème est résolu.</p>";
            }
        } else {
            // Bouton pour lancer la copie
            echo "<p><a href='?copy_env=true'><button>Copier env.php dans tous les répertoires cibles</button></a></p>";
        }
        
        // Offrir la possibilité de recréer le fichier env.php
        echo "<h2>Recréer env.php</h2>";
        
        if (isset($_GET['recreate_env']) && $_GET['recreate_env'] === 'true') {
            $new_env_content = <<<EOT
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
            
            $success = true;
            $messages = [];
            
            foreach ($target_dirs as $dir) {
                if (is_dir($dir)) {
                    if (file_put_contents($dir . '/env.php', $new_env_content)) {
                        $messages[] = "<div class='success'>Nouveau fichier env.php créé avec succès dans " . htmlspecialchars($dir) . "</div>";
                    } else {
                        $success = false;
                        $messages[] = "<div class='error'>Impossible de créer env.php dans " . htmlspecialchars($dir) . "</div>";
                    }
                }
            }
            
            foreach ($messages as $msg) {
                echo $msg;
            }
            
            if ($success) {
                echo "<div class='success'>Tous les fichiers env.php ont été recréés avec succès.</div>";
                echo "<p>Veuillez tester à nouveau votre application pour voir si le problème est résolu.</p>";
            }
        } else {
            // Bouton pour lancer la recréation
            echo "<p><a href='?recreate_env=true'><button>Recréer tous les fichiers env.php</button></a></p>";
        }
    } else {
        echo "<div class='error'>Impossible de trouver env.php pour effectuer des corrections!</div>";
        
        // Offrir la possibilité de créer le fichier env.php
        if (isset($_GET['create_new_env']) && $_GET['create_new_env'] === 'true') {
            $directory = 'api/config';
            
            // Créer le répertoire s'il n'existe pas
            if (!is_dir($directory)) {
                if (!mkdir($directory, 0755, true)) {
                    echo "<div class='error'>Impossible de créer le répertoire " . htmlspecialchars($directory) . "</div>";
                } else {
                    echo "<div class='success'>Répertoire " . htmlspecialchars($directory) . " créé avec succès.</div>";
                }
            }
            
            $new_env_content = <<<EOT
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
            
            if (file_put_contents($directory . '/env.php', $new_env_content)) {
                echo "<div class='success'>Fichier env.php créé avec succès dans " . htmlspecialchars($directory) . "</div>";
                echo "<p>Veuillez tester à nouveau votre application pour voir si le problème est résolu.</p>";
            } else {
                echo "<div class='error'>Impossible de créer le fichier env.php dans " . htmlspecialchars($directory) . "</div>";
            }
        } else {
            // Bouton pour lancer la création
            echo "<p><a href='?create_new_env=true'><button>Créer un nouveau fichier env.php</button></a></p>";
        }
    }
    
    // Test d'inclusion
    echo "<h2>Test d'inclusion du fichier env.php</h2>";
    
    if (isset($_GET['test_include']) && $_GET['test_include'] === 'true') {
        $include_paths = [
            './api/config/env.php',
            'api/config/env.php',
            '/api/config/env.php',
            __DIR__ . '/api/config/env.php',
            dirname(__DIR__) . '/api/config/env.php'
        ];
        
        $success = false;
        
        foreach ($include_paths as $path) {
            echo "<p>Test d'inclusion du fichier: " . htmlspecialchars($path) . "</p>";
            
            if (file_exists($path)) {
                try {
                    ob_start();
                    include_once $path;
                    $output = ob_get_clean();
                    
                    if (defined('DB_HOST')) {
                        echo "<div class='success'>Inclusion réussie! DB_HOST est défini: " . DB_HOST . "</div>";
                        $success = true;
                        break;
                    } else {
                        echo "<div class='error'>Le fichier a été inclus mais DB_HOST n'est pas défini.</div>";
                        if (!empty($output)) {
                            echo "<pre>" . htmlspecialchars($output) . "</pre>";
                        }
                    }
                } catch (Exception $e) {
                    $error = ob_get_clean();
                    echo "<div class='error'>Erreur lors de l'inclusion: " . htmlspecialchars($e->getMessage()) . "</div>";
                    if (!empty($error)) {
                        echo "<pre>" . htmlspecialchars($error) . "</pre>";
                    }
                }
            } else {
                echo "<div class='warning'>Ce fichier n'existe pas.</div>";
            }
        }
        
        if (!$success) {
            echo "<div class='error'>Aucune inclusion n'a réussi.</div>";
        }
    } else {
        echo "<p><a href='?test_include=true'><button>Tester l'inclusion du fichier env.php</button></a></p>";
    }
    ?>

    <h2>Liens utiles</h2>
    <ul>
        <li><a href="verify-php-files.php">Vérifier les fichiers PHP</a></li>
        <li><a href="test-env-paths.php">Tester les chemins du fichier env.php</a></li>
        <li><a href="api/test.php">Tester l'API</a></li>
        <li><a href="phpinfo.php">Afficher les informations PHP (phpinfo)</a></li>
    </ul>
</body>
</html>
