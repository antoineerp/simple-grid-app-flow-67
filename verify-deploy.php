
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification Déploiement FormaCert</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Outil de Vérification du Déploiement</h1>
    
    <h2>1. Structure des fichiers</h2>
    <?php
    // Vérification des répertoires essentiels
    $directories = [
        '.' => 'Répertoire racine',
        './assets' => 'Répertoire assets',
        './api' => 'Répertoire API',
        './public' => 'Répertoire public',
        './public/lovable-uploads' => 'Répertoire uploads'
    ];
    
    foreach ($directories as $dir => $name) {
        echo "<p>$name: ";
        if (is_dir($dir)) {
            echo "<span class='success'>OK</span>";
            // Liste des fichiers
            $files = scandir($dir);
            $fileCount = count($files) - 2; // Moins . et ..
            echo " ($fileCount fichiers)";
        } else {
            echo "<span class='error'>MANQUANT</span>";
        }
        echo "</p>";
    }
    ?>
    
    <h2>2. Fichiers clés</h2>
    <?php
    // Vérification des fichiers essentiels
    $files = [
        './index.html' => 'Page principale',
        './.htaccess' => 'Configuration Apache'
    ];
    
    // Trouver les fichiers JS et CSS dans le dossier assets
    $js_files = glob('./assets/*.js');
    $css_files = glob('./assets/*.css');
    
    if (!empty($js_files)) {
        $files[$js_files[0]] = 'JavaScript principal';
    } else {
        $files['./assets/index.js'] = 'JavaScript principal (introuvable)';
    }
    
    if (!empty($css_files)) {
        $files[$css_files[0]] = 'CSS principal';
    } else {
        $files['./assets/index.css'] = 'CSS principal (introuvable)';
    }
    
    foreach ($files as $file => $name) {
        echo "<p>$name ($file): ";
        if (file_exists($file)) {
            echo "<span class='success'>OK</span>";
        } else {
            echo "<span class='error'>MANQUANT</span>";
        }
        echo "</p>";
    }
    ?>
    
    <h2>3. Contenu de index.html</h2>
    <pre><?php 
    if (file_exists('./index.html')) {
        echo htmlspecialchars(file_get_contents('./index.html')); 
    } else {
        echo "<span class='error'>Fichier non trouvé</span>";
    }
    ?></pre>
    
    <h2>4. Test de chargement JavaScript</h2>
    <div id="js-test">Si JavaScript fonctionne, ce texte sera remplacé.</div>
    <script>
        document.getElementById('js-test').textContent = 'JavaScript fonctionne correctement!';
        document.getElementById('js-test').style.color = 'green';
    </script>
    
    <h2>5. Test d'accès à l'API</h2>
    <?php
    // Test direct de l'existence du fichier index.php de l'API
    echo "<p>Fichier API principal: ";
    if (file_exists('./api/index.php')) {
        echo "<span class='success'>EXISTE</span>";
    } else {
        echo "<span class='error'>MANQUANT</span>";
    }
    echo "</p>";
    
    // Test de l'existence du fichier login-test.php
    echo "<p>Fichier de test d'authentification: ";
    if (file_exists('./api/login-test.php')) {
        echo "<span class='success'>EXISTE</span>";
    } else {
        echo "<span class='error'>MANQUANT</span>";
    }
    echo "</p>";
    
    // Test d'accès à l'API via curl
    echo "<p>Accès à l'API via curl: ";
    $apiUrl = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/api/';
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_HEADER, true);
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Code HTTP: ";
    if ($httpCode >= 200 && $httpCode < 300) {
        echo "<span class='success'>$httpCode (OK)</span>";
    } else {
        echo "<span class='error'>$httpCode (Erreur)</span>";
    }
    
    if ($result) {
        // Séparer l'en-tête de la réponse
        list($headers, $body) = explode("\r\n\r\n", $result, 2);
        echo "<p>Réponse reçue: <pre>" . htmlspecialchars(substr($body, 0, 500)) . "</pre></p>";
    } else {
        echo "<p>Aucune réponse reçue</p>";
    }
    echo "</p>";

    // Test complet login-test.php avec les identifiants corrects
    echo "<h3>Test du fichier login-test.php</h3>";
    $testApiUrl = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/api/login-test.php';
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $testApiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_POST, true);
    // Utiliser les identifiants corrects pour l'authentification: admin/admin123
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['username' => 'admin', 'password' => 'admin123']));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $testResult = curl_exec($ch);
    $testHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Test login-test.php (POST): ";
    if ($testHttpCode >= 200 && $testHttpCode < 300) {
        echo "<span class='success'>$testHttpCode (OK)</span>";
    } else {
        echo "<span class='error'>$testHttpCode (Erreur)</span>";
    }
    
    if ($testResult) {
        echo "<p>Réponse reçue: <pre>" . htmlspecialchars(substr($testResult, 0, 500)) . "</pre></p>";
    } else {
        echo "<p>Aucune réponse reçue de login-test.php</p>";
    }
    ?>

    <h2>6. Environnement et variables</h2>
    <p>Chemin absolu actuel: <?php echo getcwd(); ?></p>
    <p>Document Root: <?php echo $_SERVER['DOCUMENT_ROOT']; ?></p>
    <p>Request URI: <?php echo $_SERVER['REQUEST_URI']; ?></p>
    <p>Script Name: <?php echo $_SERVER['SCRIPT_NAME']; ?></p>

    <h2>7. Tests d'authentification supplémentaires</h2>
    <?php
    // Tester avec les différentes combinaisons d'identifiants
    $testUsers = [
        ['username' => 'admin', 'password' => 'admin123'],
        ['username' => 'p71x6d_system', 'password' => 'Trottinette43!'],
        ['username' => 'antcirier@gmail.com', 'password' => 'password123']
    ];
    
    echo "<h3>Tests des différents utilisateurs:</h3>";
    echo "<ul>";
    
    foreach ($testUsers as $user) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $testApiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($user));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        $testResult = curl_exec($ch);
        $testHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        echo "<li>Test utilisateur <strong>{$user['username']}</strong>: ";
        if ($testHttpCode >= 200 && $testHttpCode < 300) {
            echo "<span class='success'>$testHttpCode (Connexion réussie)</span>";
        } else {
            echo "<span class='error'>$testHttpCode (Échec)</span>";
        }
        
        $response = json_decode($testResult, true);
        if ($response) {
            echo " - Message: " . htmlspecialchars($response['message'] ?? 'Aucun message');
        }
        echo "</li>";
    }
    
    echo "</ul>";
    
    // Test de la connexion directe à la base de données
    echo "<h3>Test direct de la connexion à la base de données:</h3>";
    $dbTestUrl = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/api/direct-db-test.php';
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $dbTestUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $dbTestResult = curl_exec($ch);
    $dbHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Test connexion DB: ";
    if ($dbHttpCode >= 200 && $dbHttpCode < 300) {
        echo "<span class='success'>$dbHttpCode (OK)</span>";
    } else {
        echo "<span class='error'>$dbHttpCode (Erreur)</span>";
    }
    
    if ($dbTestResult) {
        echo "<p>Réponse de test DB: <pre>" . htmlspecialchars(substr($dbTestResult, 0, 500)) . "...</pre></p>";
        
        $dbResponse = json_decode($dbTestResult, true);
        if ($dbResponse && isset($dbResponse['status']) && $dbResponse['status'] === 'success') {
            echo "<p class='success'>✅ Connexion directe à la base de données réussie!</p>";
        } else {
            echo "<p class='error'>❌ Échec de la connexion directe à la base de données</p>";
        }
    } else {
        echo "<p class='error'>Aucune réponse reçue du test de base de données</p>";
    }
    ?>
</body>
</html>
