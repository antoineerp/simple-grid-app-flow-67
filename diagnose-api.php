
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic d'API PHP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .test-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Diagnostic d'API PHP</h1>
    
    <div class="section">
        <h2>Tests de base</h2>
        
        <?php
        // Tester PHP
        echo "<p>Version PHP: <span class='success'>" . phpversion() . "</span></p>";
        
        // Tester les chemins
        echo "<p>Chemin du script: <span class='success'>" . __FILE__ . "</span></p>";
        echo "<p>Répertoire racine: <span class='success'>" . dirname(__FILE__) . "</span></p>";
        
        // Tester si l'API est accessible
        echo "<p>Dossier API: ";
        if (is_dir('./api')) {
            echo "<span class='success'>TROUVÉ</span>";
        } else {
            echo "<span class='error'>NON TROUVÉ</span>";
        }
        echo "</p>";
        
        // Tester les fichiers API essentiels
        $api_files = [
            './api/http-test.php' => 'Test HTTP',
            './api/diagnose-paths.php' => 'Diagnostic des chemins',
            './api/db-connection-simple.php' => 'Test de base de données',
            './api/.htaccess' => 'Configuration .htaccess API'
        ];
        
        echo "<p>Fichiers API essentiels:</p><ul>";
        foreach ($api_files as $file => $description) {
            echo "<li>$description: ";
            if (file_exists($file)) {
                echo "<span class='success'>TROUVÉ</span>";
            } else {
                echo "<span class='error'>NON TROUVÉ</span>";
            }
            echo "</li>";
        }
        echo "</ul>";
        ?>
    </div>
    
    <div class="section">
        <h2>Tests HTTP</h2>
        
        <?php
        function test_http_endpoint($url, $description) {
            echo "<h3>Test de $description</h3>";
            echo "<p>URL: <code>$url</code></p>";
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HEADER, false);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            
            $response = curl_exec($ch);
            $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            echo "<p>Statut HTTP: ";
            if ($status >= 200 && $status < 300) {
                echo "<span class='success'>$status</span>";
            } else {
                echo "<span class='error'>$status</span>";
            }
            echo "</p>";
            
            if ($error) {
                echo "<p>Erreur: <span class='error'>$error</span></p>";
            }
            
            echo "<p>Réponse:</p>";
            echo "<pre>" . htmlspecialchars(substr($response, 0, 1000)) . (strlen($response) > 1000 ? '...' : '') . "</pre>";
            
            // Essayer de parser en JSON
            $json = json_decode($response, true);
            if ($json !== null) {
                echo "<p>Réponse JSON: <span class='success'>VALIDE</span></p>";
            } else {
                echo "<p>Réponse JSON: <span class='error'>INVALIDE</span></p>";
            }
            
            return [
                'status' => $status,
                'response' => $response,
                'error' => $error,
                'json_valid' => ($json !== null)
            ];
        }
        
        $base_url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'];
        
        if (isset($_GET['test_http'])) {
            $result = test_http_endpoint("$base_url/api/http-test.php", "Test HTTP de base");
            
            if ($result['json_valid']) {
                echo "<h3>Test réussi 🎉</h3>";
                echo "<p>Le serveur HTTP et PHP semblent fonctionner correctement.</p>";
            }
        } else {
            echo "<form method='get'>";
            echo "<input type='hidden' name='test_http' value='1'>";
            echo "<button type='submit' class='test-button'>Lancer le test HTTP</button>";
            echo "</form>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Tests des chemins</h2>
        
        <?php
        if (isset($_GET['test_paths'])) {
            $result = test_http_endpoint("$base_url/api/diagnose-paths.php", "Test des chemins de fichiers");
            
            if ($result['json_valid']) {
                echo "<h3>Test réussi 🎉</h3>";
                echo "<p>Le système de fichiers semble correctement configuré.</p>";
            }
        } else {
            echo "<form method='get'>";
            echo "<input type='hidden' name='test_paths' value='1'>";
            echo "<button type='submit' class='test-button'>Lancer le test des chemins</button>";
            echo "</form>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Test de base de données</h2>
        
        <?php
        if (isset($_GET['test_db'])) {
            $result = test_http_endpoint("$base_url/api/db-connection-simple.php", "Test de connexion à la base de données");
            
            if ($result['json_valid']) {
                $json = json_decode($result['response'], true);
                if (isset($json['status']) && $json['status'] === 'success') {
                    echo "<h3>Test réussi 🎉</h3>";
                    echo "<p>La connexion à la base de données fonctionne correctement.</p>";
                } else {
                    echo "<h3>Problème de connexion à la base de données</h3>";
                    echo "<p>Le test a échoué. Vérifiez les identifiants de connexion dans <code>api/db-connection-simple.php</code>.</p>";
                }
            }
        } else {
            echo "<form method='get'>";
            echo "<input type='hidden' name='test_db' value='1'>";
            echo "<button type='submit' class='test-button'>Lancer le test de base de données</button>";
            echo "</form>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Solutions possibles</h2>
        
        <h3>Si aucun test ne fonctionne</h3>
        <ul>
            <li>Vérifiez que PHP est correctement installé sur le serveur</li>
            <li>Assurez-vous que les fichiers .htaccess sont pris en compte (AllowOverride All)</li>
            <li>Vérifiez les droits d'accès aux fichiers PHP</li>
        </ul>
        
        <h3>Si le test HTTP fonctionne mais pas les autres</h3>
        <ul>
            <li>Vérifiez que tous les fichiers de test existent bien dans le dossier api/</li>
            <li>Assurez-vous que le dossier api/ est accessible et a les droits d'écriture pour les logs</li>
        </ul>
        
        <h3>Si seul le test de base de données échoue</h3>
        <ul>
            <li>Vérifiez les identifiants de connexion dans le fichier db-connection-simple.php</li>
            <li>Assurez-vous que l'utilisateur MySQL a les droits d'accès</li>
            <li>Vérifiez que la base de données existe</li>
        </ul>
    </div>
</body>
</html>
