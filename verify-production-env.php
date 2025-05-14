
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification de l'environnement de production</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Vérification de l'environnement de production</h1>
        
        <div class="card">
            <h2>1. Vérification des variables d'environnement</h2>
            <?php
            $env_path = 'api/config/env.php';
            if (file_exists($env_path)) {
                include($env_path);
                
                echo "<p>Fichier env.php: <span class='success'>TROUVÉ</span></p>";
                echo "<ul>";
                echo "<li>DB_HOST: " . (defined('DB_HOST') ? DB_HOST : "<span class='error'>Non défini</span>") . "</li>";
                echo "<li>DB_NAME: " . (defined('DB_NAME') ? DB_NAME : "<span class='error'>Non défini</span>") . "</li>";
                echo "<li>DB_USER: " . (defined('DB_USER') ? DB_USER : "<span class='error'>Non défini</span>") . "</li>";
                echo "<li>DB_PASS: " . (defined('DB_PASS') ? "********" : "<span class='error'>Non défini</span>") . "</li>";
                echo "<li>API_BASE_URL: " . (defined('API_BASE_URL') ? API_BASE_URL : "<span class='error'>Non défini</span>") . "</li>";
                echo "<li>APP_ENV: " . (defined('APP_ENV') ? APP_ENV : "<span class='error'>Non défini</span>") . "</li>";
                echo "</ul>";
                
                if (function_exists('get_env')) {
                    echo "<p>Fonction get_env: <span class='success'>DÉFINIE</span></p>";
                } else {
                    echo "<p>Fonction get_env: <span class='error'>NON DÉFINIE</span></p>";
                }
            } else {
                echo "<p>Fichier env.php: <span class='error'>NON TROUVÉ</span></p>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>2. Vérification de la configuration de la base de données</h2>
            <?php
            $db_config_path = 'api/config/db_config.json';
            if (file_exists($db_config_path)) {
                $db_config = json_decode(file_get_contents($db_config_path), true);
                
                echo "<p>Fichier db_config.json: <span class='success'>TROUVÉ</span></p>";
                if ($db_config) {
                    echo "<ul>";
                    echo "<li>host: " . (isset($db_config['host']) ? $db_config['host'] : "<span class='error'>Non défini</span>") . "</li>";
                    echo "<li>db_name: " . (isset($db_config['db_name']) ? $db_config['db_name'] : "<span class='error'>Non défini</span>") . "</li>";
                    echo "<li>username: " . (isset($db_config['username']) ? $db_config['username'] : "<span class='error'>Non défini</span>") . "</li>";
                    echo "<li>password: " . (isset($db_config['password']) ? "********" : "<span class='error'>Non défini</span>") . "</li>";
                    echo "</ul>";
                } else {
                    echo "<p><span class='error'>Erreur de parsing du fichier JSON</span></p>";
                }
            } else {
                echo "<p>Fichier db_config.json: <span class='error'>NON TROUVÉ</span></p>";
            }
            
            // Test de connexion à la base de données
            try {
                if (isset($db_config) && $db_config) {
                    $dsn = "mysql:host={$db_config['host']};dbname={$db_config['db_name']}";
                    $options = [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_TIMEOUT => 5,
                    ];
                    
                    $pdo = new PDO($dsn, $db_config['username'], $db_config['password'], $options);
                    echo "<p>Connexion à la base de données: <span class='success'>RÉUSSIE</span></p>";
                    
                    $stmt = $pdo->query("SELECT VERSION() as version");
                    $result = $stmt->fetch();
                    echo "<p>Version MySQL: <span class='success'>" . $result['version'] . "</span></p>";
                }
            } catch (PDOException $e) {
                echo "<p>Connexion à la base de données: <span class='error'>ÉCHEC - " . $e->getMessage() . "</span></p>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>3. Test de compilation des assets</h2>
            <?php
            $index_file = 'index.html';
            if (file_exists($index_file)) {
                $index_content = file_get_contents($index_file);
                
                // Extraire les références aux assets
                preg_match_all('/<link[^>]*href=["\'](\/[^"\']+)["\']/i', $index_content, $css_matches);
                preg_match_all('/<script[^>]*src=["\'](\/[^"\']+)["\']/i', $index_content, $js_matches);
                
                $all_assets_found = true;
                
                if (!empty($css_matches[1])) {
                    echo "<h3>Références CSS:</h3><ul>";
                    foreach ($css_matches[1] as $css_ref) {
                        $css_path = '.' . $css_ref;
                        if (file_exists($css_path)) {
                            echo "<li>$css_ref <span class='success'>(Existe)</span></li>";
                        } else {
                            echo "<li>$css_ref <span class='error'>(N'existe pas!)</span></li>";
                            $all_assets_found = false;
                        }
                    }
                    echo "</ul>";
                } else {
                    echo "<p><span class='warning'>Aucune référence CSS trouvée dans index.html</span></p>";
                }
                
                if (!empty($js_matches[1])) {
                    echo "<h3>Références JavaScript:</h3><ul>";
                    foreach ($js_matches[1] as $js_ref) {
                        if (strpos($js_ref, 'https://') === 0 || strpos($js_ref, 'http://') === 0) {
                            echo "<li>$js_ref <span class='warning'>(URL externe)</span></li>";
                            continue;
                        }
                        
                        $js_path = '.' . $js_ref;
                        if (file_exists($js_path)) {
                            echo "<li>$js_ref <span class='success'>(Existe)</span></li>";
                        } else {
                            echo "<li>$js_ref <span class='error'>(N'existe pas!)</span></li>";
                            $all_assets_found = false;
                        }
                    }
                    echo "</ul>";
                } else {
                    echo "<p><span class='warning'>Aucune référence JavaScript trouvée dans index.html</span></p>";
                }
                
                if ($all_assets_found) {
                    echo "<p>Toutes les ressources référencées existent: <span class='success'>OK</span></p>";
                } else {
                    echo "<p>Certaines ressources référencées n'existent pas: <span class='error'>ERREUR</span></p>";
                }
            } else {
                echo "<p>Fichier index.html: <span class='error'>NON TROUVÉ</span></p>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>4. Suggestions de correction</h2>
            
            <?php if ($all_assets_found ?? false): ?>
                <p><span class='success'>Tous les fichiers semblent être correctement déployés et référencés!</span></p>
            <?php else: ?>
                <p>Pour résoudre les problèmes de compilation et de déploiement:</p>
                <ol>
                    <li>Vérifiez que le fichier <code>.htaccess</code> est correctement configuré pour les types MIME</li>
                    <li>Assurez-vous que le processus de build génère correctement les fichiers dans <code>/assets/</code></li>
                    <li>Vérifiez que les chemins dans <code>index.html</code> correspondent aux fichiers générés</li>
                    <li>Utilisez <a href="check-build-status.php">check-build-status.php</a> pour diagnostiquer les problèmes de MIME types</li>
                </ol>
                
                <p><a href="check-build-status.php" style="background: #4CAF50; color: white; text-decoration: none; padding: 10px 15px; border-radius: 4px; display: inline-block;">
                    Exécuter le diagnostic de compilation
                </a></p>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
