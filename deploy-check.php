
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification Technique FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Vérification Technique FormaCert</h1>
    
    <div class="section">
        <h2>1. Informations Serveur</h2>
        <p>Serveur Web: <?php echo $_SERVER['SERVER_SOFTWARE']; ?></p>
        <p>PHP Version: <?php echo phpversion(); ?></p>
        <p>Document Root: <?php echo $_SERVER['DOCUMENT_ROOT']; ?></p>
        <p>Chemin Actuel: <?php echo getcwd(); ?></p>
        <p>Request URI: <?php echo $_SERVER['REQUEST_URI']; ?></p>
    </div>
    
    <div class="section">
        <h2>2. Vérification des Fichiers Critiques</h2>
        <?php
        $critical_files = [
            'index.html' => 'Page principale',
            '.htaccess' => 'Configuration Apache principale',
            'api/index.php' => 'Point d\'entrée API',
            'api/.htaccess' => 'Configuration Apache API',
            'api/login-test.php' => 'Test de connexion API'
        ];
        
        foreach ($critical_files as $file => $description) {
            echo "<p>$description ($file): ";
            if (file_exists($file)) {
                echo "<span class='success'>EXISTE</span>";
                echo " (" . filesize($file) . " octets)";
            } else {
                echo "<span class='error'>MANQUANT</span>";
            }
            echo "</p>";
        }
        
        // Trouver les fichiers JS et CSS
        $js_files = glob('./assets/*.js');
        if (!empty($js_files)) {
            echo "<p>Fichier JavaScript principal: <span class='success'>" . basename($js_files[0]) . "</span> (" . filesize($js_files[0]) . " octets)</p>";
        } else {
            echo "<p>Fichier JavaScript principal: <span class='error'>INTROUVABLE</span></p>";
        }
        
        $css_files = glob('./assets/*.css');
        if (!empty($css_files)) {
            echo "<p>Fichier CSS principal: <span class='success'>" . basename($css_files[0]) . "</span> (" . filesize($css_files[0]) . " octets)</p>";
        } else {
            echo "<p>Fichier CSS principal: <span class='error'>INTROUVABLE</span></p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>3. Test de l'API</h2>
        <?php
        // Utiliser file_get_contents pour lire l'API interne
        echo "<h3>Test de l'API avec file_get_contents</h3>";
        echo "<p>Requête à http://" . $_SERVER['HTTP_HOST'] . "/api/</p>";
        
        $api_response = @file_get_contents("http://" . $_SERVER['HTTP_HOST'] . "/api/");
        if ($api_response !== false) {
            echo "<p>Statut: <span class='success'>OK</span></p>";
            echo "<pre>" . htmlspecialchars(substr($api_response, 0, 500)) . "</pre>";
        } else {
            echo "<p>Statut: <span class='error'>ÉCHEC</span> (file_get_contents a échoué)</p>";
            
            // Essayer avec include directement
            echo "<h3>Test de l'API avec include</h3>";
            echo "<p>Inclusion directe du fichier api/index.php</p>";
            
            ob_start();
            $include_result = @include_once("api/index.php");
            $include_output = ob_get_clean();
            
            if ($include_result !== false) {
                echo "<p>Statut: <span class='success'>OK</span></p>";
                echo "<pre>" . htmlspecialchars(substr($include_output, 0, 500)) . "</pre>";
            } else {
                echo "<p>Statut: <span class='error'>ÉCHEC</span> (include a échoué)</p>";
            }
        }
        
        // Test avec curl
        echo "<h3>Test de l'API avec CURL</h3>";
        if (function_exists('curl_init')) {
            $ch = curl_init("http://" . $_SERVER['HTTP_HOST'] . "/api/");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_HEADER, true);
            $curl_response = curl_exec($ch);
            $curl_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($curl_response !== false) {
                echo "<p>Statut CURL: <span class='success'>$curl_status</span></p>";
                
                // Séparer headers et body
                list($headers, $body) = explode("\r\n\r\n", $curl_response, 2);
                echo "<p>En-têtes:</p><pre>" . htmlspecialchars($headers) . "</pre>";
                echo "<p>Corps:</p><pre>" . htmlspecialchars(substr($body, 0, 500)) . "</pre>";
            } else {
                echo "<p>Statut CURL: <span class='error'>ÉCHEC</span></p>";
            }
        } else {
            echo "<p>CURL n'est pas disponible sur ce serveur</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>4. Test du login-test.php</h2>
        <?php
        // Test de login-test.php avec curl
        if (function_exists('curl_init')) {
            $login_url = "http://" . $_SERVER['HTTP_HOST'] . "/api/login-test.php";
            $post_data = json_encode(['username' => 'admin', 'password' => 'admin123']);
            
            $ch = curl_init($login_url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            $login_response = curl_exec($ch);
            $login_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            echo "<p>URL: $login_url</p>";
            echo "<p>Données: $post_data</p>";
            
            if ($login_response !== false) {
                echo "<p>Statut: <span class='success'>$login_status</span></p>";
                echo "<pre>" . htmlspecialchars($login_response) . "</pre>";
                
                // Analyser la réponse JSON
                $json_response = json_decode($login_response, true);
                if ($json_response !== null) {
                    echo "<p>Structure JSON: <span class='success'>Valide</span></p>";
                    echo "<p>Message: " . ($json_response['message'] ?? 'Non disponible') . "</p>";
                    if (isset($json_response['token'])) {
                        echo "<p>Token: <span class='success'>Présent</span></p>";
                    } else {
                        echo "<p>Token: <span class='warning'>Absent</span></p>";
                    }
                } else {
                    echo "<p>Structure JSON: <span class='error'>Invalide</span></p>";
                }
            } else {
                echo "<p>Statut: <span class='error'>ÉCHEC</span></p>";
            }
        } else {
            echo "<p>CURL n'est pas disponible sur ce serveur</p>";
        }
        ?>
    </div>
</body>
</html>
