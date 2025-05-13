
<?php
// Utilitaire de vérification du déploiement et de la configuration
header('Content-Type: text/html; charset=UTF-8');

// Fonction pour vérifier si un fichier existe et afficher son statut
function check_file($path, $description) {
    $exists = file_exists($path);
    $size = $exists ? filesize($path) : 0;
    $status = $exists ? "OK" : "MANQUANT";
    $status_class = $exists ? "success" : "error";
    
    echo "<tr>";
    echo "<td>$description</td>";
    echo "<td>$path</td>";
    echo "<td class='$status_class'>$status</td>";
    echo "<td>" . ($exists ? "$size octets" : "N/A") . "</td>";
    echo "</tr>";
    
    return $exists;
}

// Fonction pour tester la connexion à la base de données
function test_database_connection() {
    try {
        // Lire la configuration depuis db_config.json
        $config_path = __DIR__ . '/config/db_config.json';
        if (!file_exists($config_path)) {
            throw new Exception("Fichier de configuration db_config.json introuvable");
        }
        
        $config = json_decode(file_get_contents($config_path), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Erreur dans le format JSON du fichier de configuration: " . json_last_error_msg());
        }
        
        if (!isset($config['host']) || !isset($config['db_name']) || !isset($config['username']) || !isset($config['password'])) {
            throw new Exception("Configuration incomplète dans db_config.json");
        }
        
        // Établir la connexion
        $dsn = "mysql:host={$config['host']};dbname={$config['db_name']};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 5
        ];
        
        $pdo = new PDO($dsn, $config['username'], $config['password'], $options);
        
        // Tester avec une requête simple
        $stmt = $pdo->query("SELECT DATABASE() as db_name");
        $result = $stmt->fetch();
        $current_db = $result['db_name'];
        
        return [
            'success' => true,
            'database' => $current_db,
            'host' => $config['host'],
            'user' => $config['username']
        ];
    } catch (PDOException $e) {
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'error_code' => $e->getCode()
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Tester l'exécution PHP
function test_php_execution() {
    $test_file = __DIR__ . '/temp-execution-test.php';
    $test_content = "<?php echo 'PHP_TEST_EXECUTION_SUCCESS'; ?>";
    
    try {
        // Créer un fichier PHP temporaire
        file_put_contents($test_file, $test_content);
        
        // Tenter d'exécuter le fichier avec file_get_contents
        $test_url = 'http://' . $_SERVER['HTTP_HOST'] . '/api/temp-execution-test.php';
        $result = @file_get_contents($test_url);
        
        // Supprimer le fichier temporaire
        @unlink($test_file);
        
        if ($result === false) {
            return [
                'success' => false,
                'error' => 'Impossible d\'accéder au fichier de test via HTTP'
            ];
        }
        
        if (strpos($result, 'PHP_TEST_EXECUTION_SUCCESS') !== false) {
            return [
                'success' => true,
                'result' => 'Les fichiers PHP s\'exécutent correctement'
            ];
        } else {
            return [
                'success' => false,
                'error' => 'Le fichier PHP s\'est exécuté mais n\'a pas produit le résultat attendu',
                'output' => $result
            ];
        }
    } catch (Exception $e) {
        // Tenter de nettoyer le fichier temporaire
        @unlink($test_file);
        
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Diagnostic de Déploiement FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .actions { margin-top: 20px; }
        .button { 
            display: inline-block; 
            padding: 8px 16px; 
            background-color: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
            margin-right: 10px;
        }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Diagnostic de Déploiement FormaCert</h1>
    <p>Cet outil vérifie l'état du déploiement et la configuration de l'application.</p>
    
    <div class="section">
        <h2>1. Informations Serveur</h2>
        <table>
            <tr><th>Paramètre</th><th>Valeur</th></tr>
            <tr><td>Serveur Web</td><td><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Non détecté'; ?></td></tr>
            <tr><td>PHP Version</td><td><?php echo phpversion(); ?></td></tr>
            <tr><td>Document Root</td><td><?php echo $_SERVER['DOCUMENT_ROOT']; ?></td></tr>
            <tr><td>Chemin Actuel</td><td><?php echo getcwd(); ?></td></tr>
            <tr><td>Request URI</td><td><?php echo $_SERVER['REQUEST_URI']; ?></td></tr>
            <tr><td>Exécution PHP</td><td class="success">Fonctionne (ce script s'exécute)</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>2. Vérification des Fichiers Critiques</h2>
        <table>
            <tr>
                <th>Description</th>
                <th>Chemin</th>
                <th>Statut</th>
                <th>Taille</th>
            </tr>
            <?php
            // Vérifier les fichiers principaux
            check_file('../index.html', 'Page principale HTML');
            check_file('../.htaccess', 'Configuration Apache principale');
            check_file('./.htaccess', 'Configuration Apache API');
            check_file('./config/database.php', 'Classe de connexion à la base de données');
            check_file('./config/db_config.json', 'Configuration de la base de données');
            check_file('./direct-db-test.php', 'Utilitaire de test de base de données');
            
            // Vérifier les assets principaux
            $js_files = glob('../assets/*.js');
            $css_files = glob('../assets/*.css');
            
            if (!empty($js_files)) {
                check_file($js_files[0], 'Fichier JavaScript principal');
            } else {
                echo "<tr><td>Fichier JavaScript principal</td><td>Non trouvé</td><td class='error'>MANQUANT</td><td>N/A</td></tr>";
            }
            
            if (!empty($css_files)) {
                check_file($css_files[0], 'Fichier CSS principal');
            } else {
                echo "<tr><td>Fichier CSS principal</td><td>Non trouvé</td><td class='error'>MANQUANT</td><td>N/A</td></tr>";
            }
            ?>
        </table>
    </div>
    
    <div class="section">
        <h2>3. Test de l'Exécution PHP</h2>
        <?php
        $php_test = test_php_execution();
        if ($php_test['success']) {
            echo "<p class='success'>" . $php_test['result'] . "</p>";
        } else {
            echo "<p class='error'>Erreur: " . $php_test['error'] . "</p>";
            if (isset($php_test['output'])) {
                echo "<pre>" . htmlspecialchars($php_test['output']) . "</pre>";
            }
        }
        ?>
    </div>
    
    <div class="section">
        <h2>4. Test de Connexion à la Base de Données</h2>
        <?php
        $db_test = test_database_connection();
        if ($db_test['success']) {
            echo "<p class='success'>Connexion réussie à la base de données " . $db_test['database'] . "</p>";
            echo "<table>";
            echo "<tr><th>Paramètre</th><th>Valeur</th></tr>";
            echo "<tr><td>Hôte</td><td>" . $db_test['host'] . "</td></tr>";
            echo "<tr><td>Base de données</td><td>" . $db_test['database'] . "</td></tr>";
            echo "<tr><td>Utilisateur</td><td>" . $db_test['user'] . "</td></tr>";
            echo "</table>";
        } else {
            echo "<p class='error'>Échec de la connexion à la base de données</p>";
            echo "<p>Erreur: " . $db_test['error'] . "</p>";
            if (isset($db_test['error_code'])) {
                echo "<p>Code d'erreur: " . $db_test['error_code'] . "</p>";
            }
        }
        ?>
    </div>
    
    <div class="section">
        <h2>5. Actions</h2>
        <div class="actions">
            <a href="repair-deployment.php" class="button">Réparer le déploiement</a>
            <a href="test-db-connection.php" class="button">Tester la connexion DB</a>
            <a href="fix-htaccess.php" class="button">Corriger .htaccess</a>
        </div>
    </div>
    
    <div class="section">
        <h2>6. Recommandations</h2>
        <p>Basé sur les résultats ci-dessus, voici les recommandations pour améliorer votre déploiement:</p>
        <ul>
            <?php if (!file_exists('../.htaccess')): ?>
            <li>Créez un fichier .htaccess à la racine pour assurer que les fichiers PHP s'exécutent correctement</li>
            <?php endif; ?>
            
            <?php if (!file_exists('./config/db_config.json')): ?>
            <li>Créez le fichier de configuration de base de données db_config.json</li>
            <?php endif; ?>
            
            <?php if (!$php_test['success']): ?>
            <li>Contactez votre hébergeur pour configurer correctement l'exécution PHP sur votre serveur</li>
            <?php endif; ?>
            
            <?php if (!$db_test['success']): ?>
            <li>Vérifiez les informations de connexion à la base de données dans le fichier db_config.json</li>
            <?php endif; ?>
        </ul>
    </div>
</body>
</html>
