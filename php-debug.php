
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic PHP - FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .section { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
    </style>
</head>
<body>
    <h1>Diagnostic PHP - FormaCert</h1>
    <p>Date d'exécution: <?php echo date('Y-m-d H:i:s'); ?></p>
    
    <div class="section">
        <h2>Informations PHP</h2>
        <p>Version PHP: <strong><?php echo phpversion(); ?></strong></p>
        <p>Interface SAPI: <strong><?php echo php_sapi_name(); ?></strong></p>
        <p>Système d'exploitation: <strong><?php echo PHP_OS; ?></strong></p>
        <p>Répertoire actuel: <strong><?php echo getcwd(); ?></strong></p>
    </div>
    
    <div class="section">
        <h2>Chemins importants</h2>
        <table>
            <tr>
                <th>Variable</th>
                <th>Valeur</th>
            </tr>
            <tr>
                <td>Document Root</td>
                <td><?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Non défini'; ?></td>
            </tr>
            <tr>
                <td>Script Filename</td>
                <td><?php echo $_SERVER['SCRIPT_FILENAME'] ?? 'Non défini'; ?></td>
            </tr>
            <tr>
                <td>PHP_SELF</td>
                <td><?php echo $_SERVER['PHP_SELF'] ?? 'Non défini'; ?></td>
            </tr>
            <tr>
                <td>REQUEST_URI</td>
                <td><?php echo $_SERVER['REQUEST_URI'] ?? 'Non défini'; ?></td>
            </tr>
            <tr>
                <td>HTTP_HOST</td>
                <td><?php echo $_SERVER['HTTP_HOST'] ?? 'Non défini'; ?></td>
            </tr>
            <tr>
                <td>include_path</td>
                <td><?php echo get_include_path(); ?></td>
            </tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Configuration PHP</h2>
        <?php
        $important_settings = [
            'display_errors', 'error_reporting', 'log_errors', 'error_log',
            'max_execution_time', 'memory_limit', 'post_max_size', 'upload_max_filesize',
            'date.timezone', 'default_charset', 'allow_url_fopen', 'allow_url_include',
            'opcache.enable'
        ];
        
        echo '<table>';
        echo '<tr><th>Directive</th><th>Valeur</th></tr>';
        
        foreach ($important_settings as $setting) {
            echo '<tr>';
            echo '<td>' . $setting . '</td>';
            echo '<td>' . ini_get($setting) . '</td>';
            echo '</tr>';
        }
        
        echo '</table>';
        ?>
    </div>
    
    <div class="section">
        <h2>Extensions PHP</h2>
        <?php
        $required_extensions = [
            'mysqli' => 'MySQL Improved', 
            'pdo' => 'PDO', 
            'pdo_mysql' => 'PDO MySQL',
            'json' => 'JSON', 
            'curl' => 'cURL',
            'mbstring' => 'Multibyte String'
        ];
        
        echo '<table>';
        echo '<tr><th>Extension</th><th>Description</th><th>Statut</th></tr>';
        
        foreach ($required_extensions as $ext => $desc) {
            echo '<tr>';
            echo '<td>' . $ext . '</td>';
            echo '<td>' . $desc . '</td>';
            if (extension_loaded($ext)) {
                echo '<td class="success">Chargée</td>';
            } else {
                echo '<td class="error">Non chargée</td>';
            }
            echo '</tr>';
        }
        
        echo '</table>';
        ?>
    </div>
    
    <div class="section">
        <h2>Test des chemins sur le serveur</h2>
        <?php
        $paths_to_check = [
            '.' => 'Répertoire courant',
            './api' => 'Dossier API',
            './api/config' => 'Configuration API',
            './assets' => 'Assets',
            './public' => 'Dossier public'
        ];
        
        echo '<table>';
        echo '<tr><th>Chemin</th><th>Description</th><th>Existe</th><th>Permissions</th></tr>';
        
        foreach ($paths_to_check as $path => $desc) {
            echo '<tr>';
            echo '<td>' . $path . '</td>';
            echo '<td>' . $desc . '</td>';
            
            if (file_exists($path)) {
                echo '<td class="success">Oui</td>';
                $perms = substr(sprintf('%o', fileperms($path)), -4);
                $owner = function_exists('posix_getpwuid') ? posix_getpwuid(fileowner($path))['name'] : 'N/A';
                $group = function_exists('posix_getgrgid') ? posix_getgrgid(filegroup($path))['name'] : 'N/A';
                echo '<td>' . $perms . ' (owner: ' . $owner . ', group: ' . $group . ')</td>';
            } else {
                echo '<td class="error">Non</td>';
                echo '<td>N/A</td>';
            }
            
            echo '</tr>';
        }
        
        echo '</table>';
        ?>
    </div>
    
    <div class="section">
        <h2>Test de la base de données</h2>
        <?php
        $db_config_file = './api/config/db_config.json';
        
        if (file_exists($db_config_file)) {
            $db_config = json_decode(file_get_contents($db_config_file), true);
            
            if ($db_config) {
                echo '<p>Configuration trouvée:</p>';
                echo '<ul>';
                echo '<li>Host: ' . $db_config['host'] . '</li>';
                echo '<li>DB Name: ' . $db_config['db_name'] . '</li>';
                echo '<li>Username: ' . $db_config['username'] . '</li>';
                echo '<li>Password: ' . (empty($db_config['password']) ? '<span class="error">Manquant</span>' : '<span class="success">Défini</span>') . '</li>';
                echo '</ul>';
                
                // Test de connexion
                try {
                    $dsn = "mysql:host={$db_config['host']};dbname={$db_config['db_name']}";
                    $options = [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_TIMEOUT => 5,
                    ];
                    
                    echo '<p>Tentative de connexion...</p>';
                    
                    $pdo = new PDO($dsn, $db_config['username'], $db_config['password'], $options);
                    echo '<p class="success">Connexion réussie!</p>';
                    
                    // Test de requête simple
                    $stmt = $pdo->query("SELECT VERSION() as version");
                    $result = $stmt->fetch();
                    
                    echo '<p>Version MySQL: ' . $result['version'] . '</p>';
                    
                    // Liste des tables
                    $stmt = $pdo->query("SHOW TABLES");
                    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                    
                    echo '<p>Tables dans la base de données:</p>';
                    echo '<ul>';
                    foreach ($tables as $table) {
                        echo '<li>' . $table . '</li>';
                    }
                    echo '</ul>';
                    
                } catch (PDOException $e) {
                    echo '<p class="error">Erreur de connexion: ' . $e->getMessage() . '</p>';
                }
            } else {
                echo '<p class="error">Erreur de lecture du fichier de configuration.</p>';
            }
        } else {
            echo '<p class="error">Fichier de configuration non trouvé: ' . $db_config_file . '</p>';
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Outils de diagnostic</h2>
        <p>Liens vers d'autres outils de diagnostic:</p>
        <ul>
            <li><a href="phpinfo.php">phpinfo()</a> - Informations détaillées sur PHP</li>
            <li><a href="deploy-check.php">deploy-check.php</a> - Vérification du déploiement</li>
            <li><a href="infomaniak-paths-check.php">infomaniak-paths-check.php</a> - Vérification des chemins spécifiques à Infomaniak</li>
            <li><a href="diagnose-infomaniak.php">diagnose-infomaniak.php</a> - Diagnostic complet pour Infomaniak</li>
            <li><a href="check-installation.php">check-installation.php</a> - Vérification de l'installation</li>
        </ul>
    </div>
</body>
</html>
