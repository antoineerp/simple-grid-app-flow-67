
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test des réponses API</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Test des réponses API</h1>
        
        <div class="card">
            <h2>Test direct d'endpoints API</h2>
            
            <?php
            function test_endpoint($url, $method = 'GET', $postData = null) {
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                curl_setopt($ch, CURLOPT_HEADER, true);
                
                if ($method === 'POST' && $postData) {
                    curl_setopt($ch, CURLOPT_POST, true);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
                }
                
                $response = curl_exec($ch);
                $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
                $headers = substr($response, 0, $header_size);
                $body = substr($response, $header_size);
                $info = curl_getinfo($ch);
                $error = curl_error($ch);
                
                curl_close($ch);
                
                return [
                    'url' => $url,
                    'status' => $info['http_code'],
                    'content_type' => $info['content_type'],
                    'headers' => $headers,
                    'body' => $body,
                    'error' => $error
                ];
            }
            
            $base_url = "http" . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "s" : "") . "://" . $_SERVER['HTTP_HOST'];
            
            $endpoints = [
                '/api/test.php' => 'Test API simple',
                '/api/info.php' => 'Information API',
                '/api/login.php' => 'Test de login',
                '/api/users.php' => 'Test des utilisateurs'
            ];
            
            echo "<table>";
            echo "<tr><th>Endpoint</th><th>Description</th><th>Status</th><th>Type de contenu</th><th>Réponse</th></tr>";
            
            foreach ($endpoints as $endpoint => $description) {
                $url = $base_url . $endpoint;
                $result = test_endpoint($url);
                
                echo "<tr>";
                echo "<td>{$endpoint}</td>";
                echo "<td>{$description}</td>";
                echo "<td>" . ($result['status'] >= 200 && $result['status'] < 300 ? 
                      "<span class='success'>{$result['status']}</span>" : 
                      "<span class='error'>{$result['status']}</span>") . "</td>";
                echo "<td>" . ($result['content_type'] ? $result['content_type'] : "Non défini") . "</td>";
                echo "<td><pre style='max-height: 150px; overflow-y: auto;'>" . htmlspecialchars(substr($result['body'], 0, 500)) . 
                      (strlen($result['body']) > 500 ? "..." : "") . "</pre></td>";
                echo "</tr>";
            }
            
            echo "</table>";
            
            // Test de login avec POST
            if (isset($_POST['test_login'])) {
                echo "<h3>Test de login avec credentials</h3>";
                $login_url = $base_url . "/api/login.php";
                $login_data = [
                    'username' => $_POST['username'],
                    'password' => $_POST['password']
                ];
                
                $login_result = test_endpoint($login_url, 'POST', $login_data);
                
                echo "<div><strong>URL:</strong> {$login_url}</div>";
                echo "<div><strong>Méthode:</strong> POST</div>";
                echo "<div><strong>Status:</strong> " . ($login_result['status'] >= 200 && $login_result['status'] < 300 ? 
                      "<span class='success'>{$login_result['status']}</span>" : 
                      "<span class='error'>{$login_result['status']}</span>") . "</div>";
                echo "<div><strong>Type de contenu:</strong> {$login_result['content_type']}</div>";
                echo "<div><strong>Headers:</strong><pre>" . htmlspecialchars($login_result['headers']) . "</pre></div>";
                echo "<div><strong>Corps de la réponse:</strong><pre>" . htmlspecialchars($login_result['body']) . "</pre></div>";
            }
            ?>
            
            <h3>Tester le login</h3>
            <form method="post">
                <div>
                    <label for="username">Nom d'utilisateur:</label>
                    <input type="text" id="username" name="username" value="admin">
                </div>
                <div style="margin-top: 10px;">
                    <label for="password">Mot de passe:</label>
                    <input type="password" id="password" name="password" value="admin123">
                </div>
                <div style="margin-top: 10px;">
                    <button type="submit" name="test_login" style="background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">
                        Tester le login
                    </button>
                </div>
            </form>
        </div>
        
        <div class="card">
            <h2>Installation du web-php-test.php</h2>
            
            <?php if (isset($_POST['create_test_file'])): ?>
                <?php
                $test_file = "web-php-test.php";
                $test_content = <<<EOT
<?php
header('Content-Type: text/html; charset=utf-8');
echo "<h1>Test PHP</h1>";
echo "<p>PHP fonctionne correctement sur ce serveur.</p>";
echo "<p>Version PHP: " . phpversion() . "</p>";
echo "<p>Date et heure du serveur: " . date("Y-m-d H:i:s") . "</p>";
echo "<h2>Variables d'environnement</h2>";
echo "<pre>";
print_r($_SERVER);
echo "</pre>";
EOT;

                if (file_put_contents($test_file, $test_content)) {
                    echo "<p><span class='success'>Le fichier web-php-test.php a été créé avec succès.</span></p>";
                    echo "<p><a href='web-php-test.php' target='_blank'>Cliquez ici pour tester le fichier PHP</a></p>";
                } else {
                    echo "<p><span class='error'>Échec de la création du fichier web-php-test.php</span></p>";
                }
                ?>
            <?php else: ?>
                <p>Ce bouton va créer un fichier PHP de test pour vérifier que l'exécution PHP fonctionne correctement sur le serveur.</p>
                <form method="post">
                    <button type="submit" name="create_test_file" style="background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">
                        Créer le fichier web-php-test.php
                    </button>
                </form>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
