
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction des chemins Infomaniak</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .section { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Correction des chemins Infomaniak pour PHP</h1>
    
    <?php
    // Fonction pour logger les messages
    function log_message($type, $message) {
        $class = ($type == 'success') ? 'success' : (($type == 'error') ? 'error' : 'warning');
        echo "<p class='$class'>$message</p>";
    }

    // Déterminer les chemins corrects
    $document_root = $_SERVER['DOCUMENT_ROOT'];
    $script_path = $_SERVER['SCRIPT_FILENAME'];
    $current_dir = dirname($script_path);
    
    echo "<div class='section'>";
    echo "<h2>Informations du serveur</h2>";
    echo "<p>Document root: <code>$document_root</code></p>";
    echo "<p>Script path: <code>$script_path</code></p>";
    echo "<p>Répertoire courant: <code>$current_dir</code></p>";
    echo "</div>";
    
    // Vérifier la structure du chemin
    echo "<div class='section'>";
    echo "<h2>Vérification des chemins</h2>";
    
    $expected_infomaniak_path = '/home/clients/df8dceff557ccc0605d45e1581aa661b';
    $sites_path = $expected_infomaniak_path . '/sites';
    $qualiopi_path = $sites_path . '/qualiopi.ch';
    
    if (is_dir($expected_infomaniak_path)) {
        log_message('success', "Chemin Infomaniak trouvé: $expected_infomaniak_path");
    } else {
        log_message('error', "Chemin Infomaniak non trouvé: $expected_infomaniak_path");
    }
    
    if (is_dir($sites_path)) {
        log_message('success', "Dossier sites trouvé: $sites_path");
    } else {
        log_message('error', "Dossier sites non trouvé: $sites_path");
    }
    
    if (is_dir($qualiopi_path)) {
        log_message('success', "Dossier qualiopi.ch trouvé: $qualiopi_path");
    } else {
        log_message('error', "Dossier qualiopi.ch non trouvé: $qualiopi_path");
    }
    
    // Vérifier si nous sommes dans le bon répertoire
    $current_is_qualiopi = ($current_dir == $qualiopi_path);
    if ($current_is_qualiopi) {
        log_message('success', "Le script s'exécute dans le répertoire correct de qualiopi.ch");
    } else {
        log_message('warning', "Le script ne s'exécute pas dans le répertoire attendu de qualiopi.ch");
        log_message('info', "Chemin actuel: $current_dir");
        log_message('info', "Chemin attendu: $qualiopi_path");
    }
    echo "</div>";
    
    // Corriger les références aux chemins dans les fichiers
    echo "<div class='section'>";
    echo "<h2>Analyse des fichiers pour détecter les références incorrectes</h2>";
    
    $files_to_check = [
        '.htaccess',
        'api/.htaccess',
        'infomaniak-paths-check.php',
        'diagnose-infomaniak.php',
        'deploy-check.php',
        'fix-paths.php'
    ];
    
    foreach ($files_to_check as $file) {
        if (file_exists($file)) {
            $content = file_get_contents($file);
            $incorrect_paths = [
                '/sites/qualiopi.ch',
                '/sites/',
                'sites/qualiopi.ch'
            ];
            
            $found = false;
            foreach ($incorrect_paths as $path) {
                if (strpos($content, $path) !== false) {
                    $found = true;
                    echo "<p>Fichier <code>$file</code> contient le chemin incorrect <code>$path</code></p>";
                }
            }
            
            if (!$found) {
                echo "<p>Fichier <code>$file</code> ne contient pas de chemins incorrects.</p>";
            }
        } else {
            echo "<p>Fichier <code>$file</code> n'existe pas.</p>";
        }
    }
    echo "</div>";
    
    // Corriger le fichier .htaccess
    echo "<div class='section'>";
    echo "<h2>Correction du fichier .htaccess</h2>";
    
    $htaccess_file = '.htaccess';
    if (file_exists($htaccess_file)) {
        $htaccess_content = file_get_contents($htaccess_file);
        $original_htaccess = $htaccess_content;
        
        // Remplacer les références à /sites/qualiopi.ch
        $htaccess_content = str_replace('/sites/qualiopi.ch', '', $htaccess_content);
        $htaccess_content = str_replace('sites/qualiopi.ch', '', $htaccess_content);
        
        if ($htaccess_content !== $original_htaccess) {
            if (file_put_contents($htaccess_file, $htaccess_content)) {
                log_message('success', "Fichier .htaccess mis à jour avec succès");
            } else {
                log_message('error', "Impossible de mettre à jour le fichier .htaccess");
            }
        } else {
            log_message('info', "Aucune modification nécessaire dans .htaccess");
        }
    } else {
        log_message('error', "Fichier .htaccess non trouvé");
    }
    echo "</div>";
    
    // Afficher l'environnement PHP
    echo "<div class='section'>";
    echo "<h2>Informations PHP</h2>";
    
    echo "<p>Version PHP: " . phpversion() . "</p>";
    echo "<p>Extensions chargées: " . implode(', ', get_loaded_extensions()) . "</p>";
    
    // Vérifier les extensions critiques
    $critical_extensions = ['pdo', 'pdo_mysql', 'mysqli', 'json', 'curl'];
    foreach ($critical_extensions as $ext) {
        if (extension_loaded($ext)) {
            log_message('success', "Extension '$ext' est chargée");
        } else {
            log_message('error', "Extension '$ext' n'est pas chargée");
        }
    }
    
    // Configuration PHP
    echo "<h3>Configuration PHP</h3>";
    echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
    echo "<tr><th>Directive</th><th>Valeur</th></tr>";
    $directives = ['display_errors', 'error_reporting', 'log_errors', 'error_log', 
                   'upload_max_filesize', 'post_max_size', 'memory_limit', 'max_execution_time'];
    foreach ($directives as $directive) {
        echo "<tr><td>$directive</td><td>" . ini_get($directive) . "</td></tr>";
    }
    echo "</table>";
    echo "</div>";
    
    // Tester l'exécution d'un script PHP simple
    echo "<div class='section'>";
    echo "<h2>Test d'exécution PHP</h2>";
    
    // Créer un fichier de test temporaire
    $test_file = 'php-exec-test-' . time() . '.php';
    $test_content = '<?php echo "PHP fonctionne correctement - " . date("Y-m-d H:i:s"); ?>';
    
    if (file_put_contents($test_file, $test_content)) {
        echo "<p>Fichier de test créé: <code>$test_file</code></p>";
        
        // Essayer d'exécuter le script via include
        echo "<p>Résultat d'inclusion directe: ";
        ob_start();
        include($test_file);
        $result = ob_get_clean();
        echo "<code>$result</code></p>";
        
        // Essayer via une requête HTTP
        $test_url = 'http://' . $_SERVER['HTTP_HOST'] . '/' . basename($test_file);
        echo "<p>URL de test: <a href='$test_url' target='_blank'>$test_url</a></p>";
        
        // Supprimer le fichier de test
        unlink($test_file);
        echo "<p>Fichier de test supprimé</p>";
    } else {
        log_message('error', "Impossible de créer le fichier de test");
    }
    echo "</div>";
    
    // Tester la connexion à la base de données
    echo "<div class='section'>";
    echo "<h2>Test de connexion à la base de données</h2>";
    
    $db_config_file = 'api/config/db_config.json';
    if (file_exists($db_config_file)) {
        $db_config = json_decode(file_get_contents($db_config_file), true);
        
        if ($db_config && isset($db_config['host']) && isset($db_config['db_name']) && 
            isset($db_config['username']) && isset($db_config['password'])) {
            
            echo "<p>Configuration DB trouvée:</p>";
            echo "<ul>";
            echo "<li>Host: " . $db_config['host'] . "</li>";
            echo "<li>DB: " . $db_config['db_name'] . "</li>";
            echo "<li>User: " . $db_config['username'] . "</li>";
            echo "</ul>";
            
            try {
                $dsn = "mysql:host={$db_config['host']};dbname={$db_config['db_name']}";
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_TIMEOUT => 5,
                ];
                
                $pdo = new PDO($dsn, $db_config['username'], $db_config['password'], $options);
                log_message('success', "Connexion à la base de données réussie!");
                
                // Test de requête simple
                $stmt = $pdo->query("SELECT VERSION() as version");
                $result = $stmt->fetch();
                log_message('success', "Version MySQL: " . $result['version']);
            } catch (PDOException $e) {
                log_message('error', "Erreur de connexion: " . $e->getMessage());
            }
        } else {
            log_message('error', "Format de configuration DB invalide");
        }
    } else {
        log_message('error', "Fichier de configuration DB non trouvé: $db_config_file");
    }
    echo "</div>";
    
    echo "<div class='section'>";
    echo "<h2>Actions recommandées</h2>";
    echo "<ol>";
    echo "<li>Vérifiez et corrigez tous les chemins dans les fichiers de configuration</li>";
    echo "<li>Assurez-vous que la base de données est correctement configurée</li>";
    echo "<li>Vérifiez que les extensions PHP nécessaires sont activées</li>";
    echo "<li>Configurez correctement les droits d'accès aux fichiers</li>";
    echo "<li>Assurez-vous que le fichier .htaccess est correctement configuré</li>";
    echo "</ol>";
    echo "</div>";
    ?>
</body>
</html>
