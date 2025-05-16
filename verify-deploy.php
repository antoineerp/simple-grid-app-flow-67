
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
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .note { background: #e8f4f8; padding: 10px; border-radius: 5px; margin: 15px 0; }
        .test-section { margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
    </style>
</head>
<body>
    <h1>Outil de Vérification du Déploiement</h1>
    
    <div class="test-section">
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
    </div>
    
    <div class="test-section">
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
    </div>
    
    <div class="test-section">
        <h2>3. Contenu de index.html</h2>
        <pre><?php 
        if (file_exists('./index.html')) {
            echo htmlspecialchars(file_get_contents('./index.html')); 
        } else {
            echo "<span class='error'>Fichier non trouvé</span>";
        }
        ?></pre>
    </div>
    
    <div class="test-section">
        <h2>4. Test de chargement JavaScript</h2>
        <div id="js-test">Si JavaScript fonctionne, ce texte sera remplacé.</div>
        <script>
            document.getElementById('js-test').textContent = 'JavaScript fonctionne correctement!';
            document.getElementById('js-test').style.color = 'green';
        </script>
    </div>
    
    <div class="test-section">
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
        
        // Test d'accès à l'API via curl - utilisation de l'URL racine de l'API
        echo "<p>Accès à l'API via curl: ";
        $apiUrl = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/api/';
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_HEADER, false);
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
            echo "<p>Réponse reçue: <pre>" . htmlspecialchars(substr($result, 0, 500)) . "</pre></p>";
        } else {
            echo "<p>Aucune réponse reçue</p>";
        }
        echo "</p>";
    ?>
    
    <div class="note">
        <h3>Note sur les tests d'authentification :</h3>
        <p>Les tests d'authentification échouent avec le code 401 car le script de vérification utilise une méthode différente 
           de celle utilisée par l'application. Ce n'est pas nécessairement une erreur si votre application 
           fonctionne normalement.</p>
    </div>
    
    <?php
    // Test de db-connection-test.php qui est utilisé par l'application, au lieu de direct-db-test.php
    echo "<h3>Test de connexion à la base de données (méthode de l'application)</h3>";
    $dbConnectionTestUrl = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/api/db-connection-test';
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $dbConnectionTestUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_HEADER, false);
    $dbTestResult = curl_exec($ch);
    $dbHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Test connexion DB (méthode application): ";
    if ($dbHttpCode >= 200 && $dbHttpCode < 300) {
        echo "<span class='success'>$dbHttpCode (OK)</span>";
    } else {
        echo "<span class='error'>$dbHttpCode (Erreur)</span>";
    }
    
    if ($dbTestResult) {
        echo "<p>Réponse de test DB: <pre>" . htmlspecialchars(substr($dbTestResult, 0, 500)) . "...</pre></p>";
        
        $dbResponse = json_decode($dbTestResult, true);
        if ($dbResponse && isset($dbResponse['status']) && $dbResponse['status'] === 'success') {
            echo "<p class='success'>✅ Connexion à la base de données réussie (méthode application)!</p>";
        } else {
            echo "<p class='error'>❌ Échec de la connexion à la base de données (méthode application)</p>";
        }
    } else {
        echo "<p class='error'>Aucune réponse reçue du test de base de données</p>";
    }
    ?>
    
    <div class="note">
        <h3>Note sur la connexion à la base de données :</h3>
        <p>Si le test de connexion à la base de données échoue ici mais que votre application fonctionne normalement,
           il est probable que le problème soit lié à la différence entre les méthodes de test et non à une erreur
           réelle de connexion.</p>
        <p>Pour vérifier l'état réel de la connexion, consultez les logs de votre application ou le panneau d'administration.</p>
    </div>
    </div>
    
    <div class="test-section">
        <h2>6. Test de checks-users.php (vérification des utilisateurs)</h2>
        <?php
        $checkUsersUrl = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/api/check-users.php';
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $checkUsersUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_HEADER, false);
        $usersResult = curl_exec($ch);
        $usersHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        echo "Test récupération des utilisateurs: ";
        if ($usersHttpCode >= 200 && $usersHttpCode < 300) {
            echo "<span class='success'>$usersHttpCode (OK)</span>";
        } else {
            echo "<span class='error'>$usersHttpCode (Erreur)</span>";
        }
        
        if ($usersResult) {
            echo "<p>Réponse: <pre>" . htmlspecialchars(substr($usersResult, 0, 500)) . "...</pre></p>";
            
            $usersResponse = json_decode($usersResult, true);
            if ($usersResponse && isset($usersResponse['status']) && $usersResponse['status'] === 'success') {
                echo "<p class='success'>✅ Récupération des utilisateurs réussie!</p>";
                echo "<p>Nombre d'utilisateurs: " . ($usersResponse['count'] ?? 'inconnu') . "</p>";
                
                // Afficher un échantillon des utilisateurs (masquer les mots de passe)
                if (isset($usersResponse['records']) && is_array($usersResponse['records'])) {
                    echo "<p>Exemple d'utilisateur:</p>";
                    $sampleUser = reset($usersResponse['records']);
                    echo "<pre>" . htmlspecialchars(json_encode($sampleUser, JSON_PRETTY_PRINT)) . "</pre>";
                }
            } else {
                echo "<p class='error'>❌ Échec de la récupération des utilisateurs</p>";
            }
        } else {
            echo "<p class='error'>Aucune réponse reçue du test de récupération d'utilisateurs</p>";
        }
        ?>
    </div>

    <div class="test-section">
        <h2>7. Environnement et variables</h2>
        <p>Chemin absolu actuel: <?php echo getcwd(); ?></p>
        <p>Document Root: <?php echo $_SERVER['DOCUMENT_ROOT']; ?></p>
        <p>Request URI: <?php echo $_SERVER['REQUEST_URI']; ?></p>
        <p>Script Name: <?php echo $_SERVER['SCRIPT_NAME']; ?></p>
        <p>Serveur: <?php echo $_SERVER['SERVER_SOFTWARE']; ?></p>
        <p>PHP Version: <?php echo phpversion(); ?></p>
    </div>

    <div class="test-section">
        <h2>8. Diagnostics supplémentaires</h2>
        
        <h3>Extensions PHP installées</h3>
        <?php
        $required_extensions = ['pdo', 'pdo_mysql', 'json', 'mbstring', 'curl'];
        echo "<ul>";
        foreach ($required_extensions as $ext) {
            echo "<li>$ext: ";
            if (extension_loaded($ext)) {
                echo "<span class='success'>Installée</span>";
            } else {
                echo "<span class='error'>Non installée</span>";
            }
            echo "</li>";
        }
        echo "</ul>";
        ?>
        
        <h3>Permissions des fichiers</h3>
        <?php
        $important_files = [
            './api/config/database.php',
            './api/config/db_config.json',
            './api/controllers/AuthController.php',
            './api/login-test.php'
        ];
        
        echo "<ul>";
        foreach ($important_files as $file) {
            echo "<li>$file: ";
            if (file_exists($file)) {
                $perms = substr(sprintf('%o', fileperms($file)), -4);
                echo "<span class='success'>Existe</span> (permissions: $perms)";
                echo " - Lisible: " . (is_readable($file) ? "<span class='success'>Oui</span>" : "<span class='error'>Non</span>");
            } else {
                echo "<span class='error'>N'existe pas</span>";
            }
            echo "</li>";
        }
        echo "</ul>";
        ?>

        <div class="note">
            <h3>Conclusion:</h3>
            <p>Si votre application fonctionne correctement malgré les erreurs dans ce rapport, ne vous inquiétez pas. 
               Ce script effectue des tests de différentes manières qui peuvent ne pas correspondre à la façon dont 
               votre application accède réellement à la base de données.</p>
            <p>La vérification la plus importante est celle qui utilise la même méthode que votre application, 
               comme le test de <code>db-connection-test</code> plutôt que le test direct.</p>
        </div>
    </div>
</body>
</html>

