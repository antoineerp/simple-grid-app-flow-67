
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des chemins d'inclusion</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; background-color: #f0fff0; padding: 10px; border-left: 4px solid green; }
        .error { color: red; font-weight: bold; background-color: #fff0f0; padding: 10px; border-left: 4px solid red; }
        .warning { color: orange; font-weight: bold; background-color: #fffaf0; padding: 10px; border-left: 4px solid orange; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
        code { background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
        button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; margin: 5px 0; }
        button:hover { background-color: #45a049; }
    </style>
</head>
<body>
    <h1>Vérification et correction des chemins d'inclusion</h1>
    
    <?php
    // Configuration
    $api_dir = './api';
    $config_dir = './api/config';
    $problematic_files = [];
    
    // Fichiers principaux à vérifier
    $critical_files = [
        'api/index.php',
        'api/test.php',
        'api/auth.php',
        'api/config/database.php',
        'api/config/DatabaseConfig.php',
        'api/config/DatabaseConnection.php'
    ];
    
    echo "<h2>1. Vérification des fichiers critiques</h2>";
    
    foreach ($critical_files as $file) {
        if (file_exists($file)) {
            echo "<p>✅ " . htmlspecialchars($file) . " existe</p>";
            
            // Analyser les inclusions dans le fichier
            $content = file_get_contents($file);
            preg_match_all('/(?:include|require)(?:_once)?\s*\(\s*[\'"](.+?)[\'"]/', $content, $matches);
            
            if (!empty($matches[1])) {
                $includes = $matches[1];
                echo "<p>Inclusions trouvées:</p><ul>";
                
                foreach ($includes as $include) {
                    echo "<li>" . htmlspecialchars($include);
                    
                    // Vérifier si l'inclusion pointe vers un fichier existant
                    $include_path = str_replace('__DIR__', dirname($file), $include);
                    $include_path = str_replace('dirname(__DIR__)', dirname(dirname($file)), $include_path);
                    
                    if (!file_exists($include_path)) {
                        echo " <strong style='color:red'>⚠️ FICHIER NON TROUVÉ!</strong>";
                        $problematic_files[$file][] = [
                            'include' => $include,
                            'resolved_path' => $include_path
                        ];
                    } else {
                        echo " ✅";
                    }
                    
                    echo "</li>";
                }
                
                echo "</ul>";
            } else {
                echo "<p>Aucune inclusion trouvée dans ce fichier.</p>";
            }
        } else {
            echo "<p>❌ " . htmlspecialchars($file) . " n'existe pas</p>";
        }
    }
    
    echo "<h2>2. Actions de correction</h2>";
    
    if (empty($problematic_files)) {
        echo "<div class='success'>Aucune inclusion problématique détectée dans les fichiers critiques.</div>";
    } else {
        echo "<div class='warning'>Des problèmes d'inclusion ont été détectés:</div>";
        
        foreach ($problematic_files as $file => $problems) {
            echo "<h3>Fichier: " . htmlspecialchars($file) . "</h3>";
            echo "<ul>";
            
            foreach ($problems as $problem) {
                echo "<li>L'inclusion <code>" . htmlspecialchars($problem['include']) . "</code> ne pointe pas vers un fichier existant.<br>";
                echo "Chemin résolu: <code>" . htmlspecialchars($problem['resolved_path']) . "</code></li>";
            }
            
            echo "</ul>";
        }
        
        // Si l'utilisateur a demandé la correction
        if (isset($_GET['fix']) && $_GET['fix'] === 'true') {
            echo "<h3>Tentative de correction des chemins d'inclusion</h3>";
            
            $corrections = 0;
            
            // Vérifier si env.php existe et créer une copie si nécessaire
            if (!file_exists('./api/config/env.php')) {
                $env_source = null;
                $possible_sources = [
                    './env.php',
                    'env.php',
                    '/env.php',
                    __DIR__ . '/env.php',
                    __DIR__ . '/api/config/env.example.php'
                ];
                
                foreach ($possible_sources as $source) {
                    if (file_exists($source)) {
                        $env_source = $source;
                        break;
                    }
                }
                
                if ($env_source) {
                    // S'assurer que le répertoire existe
                    if (!is_dir('./api/config')) {
                        mkdir('./api/config', 0755, true);
                        echo "<div class='success'>Répertoire ./api/config créé</div>";
                    }
                    
                    // Copier le fichier
                    if (copy($env_source, './api/config/env.php')) {
                        echo "<div class='success'>Fichier env.php copié depuis " . htmlspecialchars($env_source) . " vers ./api/config/env.php</div>";
                        $corrections++;
                    } else {
                        echo "<div class='error'>Impossible de copier env.php</div>";
                    }
                } else {
                    // Créer un nouveau fichier env.php
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
                    
                    // S'assurer que le répertoire existe
                    if (!is_dir('./api/config')) {
                        mkdir('./api/config', 0755, true);
                        echo "<div class='success'>Répertoire ./api/config créé</div>";
                    }
                    
                    if (file_put_contents('./api/config/env.php', $env_content)) {
                        echo "<div class='success'>Nouveau fichier env.php créé dans ./api/config/env.php</div>";
                        $corrections++;
                    } else {
                        echo "<div class='error'>Impossible de créer le fichier env.php</div>";
                    }
                }
            }
            
            // Corriger les chemins d'inclusion dans les fichiers problématiques
            foreach ($problematic_files as $file => $problems) {
                $content = file_get_contents($file);
                $modified = false;
                
                foreach ($problems as $problem) {
                    $include = $problem['include'];
                    
                    // Chercher un meilleur chemin pour cette inclusion
                    $better_path = null;
                    $include_file = basename($include);
                    
                    // Si c'est env.php, on sait où il devrait être
                    if ($include_file === 'env.php') {
                        if (file_exists('./api/config/env.php')) {
                            $better_path = './api/config/env.php';
                            
                            // Déterminer le chemin relatif à partir du fichier actuel
                            $file_dir = dirname($file);
                            $relative_path = '';
                            
                            if ($file_dir === '.') {
                                $relative_path = './api/config/env.php';
                            } elseif ($file_dir === './api') {
                                $relative_path = './config/env.php';
                            } elseif ($file_dir === './api/config') {
                                $relative_path = './env.php';
                            } else {
                                // Calculer chemin relatif complexe
                                $parts = explode('/', $file_dir);
                                $depth = count($parts);
                                $relative_path = str_repeat('../', $depth - 1) . 'api/config/env.php';
                            }
                            
                            // Remplacer l'inclusion par le nouveau chemin
                            $content = str_replace($include, $relative_path, $content);
                            $modified = true;
                        }
                    } else {
                        // Recherche générique
                        $found_paths = [];
                        exec('find ' . escapeshellarg(__DIR__) . ' -name ' . escapeshellarg($include_file) . ' 2>/dev/null', $found_paths);
                        
                        if (!empty($found_paths)) {
                            $better_path = $found_paths[0];
                            
                            // TODO: Calculer le chemin relatif et remplacer
                        }
                    }
                }
                
                if ($modified) {
                    if (file_put_contents($file, $content)) {
                        echo "<div class='success'>Fichier " . htmlspecialchars($file) . " corrigé</div>";
                        $corrections++;
                    } else {
                        echo "<div class='error'>Impossible de modifier le fichier " . htmlspecialchars($file) . "</div>";
                    }
                }
            }
            
            if ($corrections > 0) {
                echo "<div class='success'>$corrections corrections ont été effectuées.</div>";
            } else {
                echo "<div class='warning'>Aucune correction n'a été effectuée.</div>";
            }
            
            echo "<p><a href='" . htmlspecialchars($_SERVER['PHP_SELF']) . "'>Rafraîchir et vérifier à nouveau</a></p>";
        } else {
            echo "<p><a href='?fix=true'><button>Tenter de corriger les problèmes automatiquement</button></a></p>";
        }
    }
    
    echo "<h2>3. Affichage des erreurs PHP</h2>";
    
    if (isset($_GET['show_errors']) && $_GET['show_errors'] === 'true') {
        ini_set('display_errors', 1);
        error_reporting(E_ALL);
        
        echo "<div class='warning'>Affichage des erreurs PHP activé pour ce script.</div>";
        
        try {
            require_once './api/config/env.php';
            echo "<div class='success'>Fichier env.php inclus avec succès.</div>";
            
            echo "<p>Variables définies:</p>";
            echo "<ul>";
            echo "<li>DB_HOST: " . (defined('DB_HOST') ? DB_HOST : "Non défini") . "</li>";
            echo "<li>DB_NAME: " . (defined('DB_NAME') ? DB_NAME : "Non défini") . "</li>";
            echo "<li>DB_USER: " . (defined('DB_USER') ? DB_USER : "Non défini") . "</li>";
            echo "<li>DB_PASS: " . (defined('DB_PASS') ? "******" : "Non défini") . "</li>";
            echo "</ul>";
            
            if (function_exists('get_env')) {
                echo "<p>La fonction get_env() est définie.</p>";
            } else {
                echo "<p>La fonction get_env() n'est pas définie.</p>";
            }
        } catch (Throwable $e) {
            echo "<div class='error'>Exception lors de l'inclusion de env.php: " . htmlspecialchars($e->getMessage()) . "</div>";
        }
    } else {
        echo "<p><a href='?show_errors=true'><button>Afficher les erreurs PHP et tester env.php</button></a></p>";
    }
    
    echo "<h2>4. Liens utiles</h2>";
    echo "<ul>";
    echo "<li><a href='fix-env-path.php'>Retour à la correction des chemins d'env.php</a></li>";
    echo "<li><a href='test-database-connection.php'>Tester la connexion à la base de données</a></li>";
    echo "<li><a href='api/test.php'>Tester l'API</a></li>";
    echo "</ul>";
    ?>
</body>
</html>
