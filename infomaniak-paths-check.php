
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic des Chemins Infomaniak</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2 { color: #334155; }
        .section { margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #f8fafc; }
        .success { color: #15803d; font-weight: 600; }
        .error { color: #b91c1c; font-weight: 600; }
        .warning { color: #b45309; font-weight: 600; }
        .monospace { font-family: monospace; background-color: #f1f5f9; padding: 2px 4px; border-radius: 4px; }
        pre { background-color: #f1f5f9; padding: 10px; border-radius: 4px; overflow: auto; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        table, th, td { border: 1px solid #e2e8f0; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f1f5f9; }
        .code-block { background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 10px 0; white-space: pre-wrap; font-family: monospace; }
    </style>
</head>
<body>
    <h1>Diagnostic des Chemins Infomaniak</h1>
    <p>Cet outil vérifie la configuration des chemins spécifiques à Infomaniak sur votre installation.</p>
    
    <div class="section">
        <h2>Informations Serveur</h2>
        <?php
        echo "<table>";
        echo "<tr><th>Variable</th><th>Valeur</th></tr>";
        echo "<tr><td>Serveur Web</td><td>" . ($_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible') . "</td></tr>";
        echo "<tr><td>Document Root</td><td>" . ($_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible') . "</td></tr>";
        echo "<tr><td>Script Filename</td><td>" . ($_SERVER['SCRIPT_FILENAME'] ?? 'Non disponible') . "</td></tr>";
        echo "<tr><td>Request URI</td><td>" . ($_SERVER['REQUEST_URI'] ?? 'Non disponible') . "</td></tr>";
        echo "<tr><td>Host</td><td>" . ($_SERVER['HTTP_HOST'] ?? 'Non disponible') . "</td></tr>";
        echo "</table>";
        
        // Vérifier si nous sommes sur Infomaniak
        $isInfomaniak = strpos($_SERVER['DOCUMENT_ROOT'] ?? '', '/sites/') !== false;
        echo "<p>Détection Infomaniak: <strong>" . ($isInfomaniak ? '<span class="success">Oui</span>' : '<span class="warning">Non</span>') . "</strong></p>";
        
        // Tester les chemins courants
        $currentDir = getcwd();
        echo "<p>Répertoire courant: <span class='monospace'>$currentDir</span></p>";
        
        // Vérifier l'existence du répertoire /sites/
        $sitesDir = '/sites/';
        $sitesDirExists = is_dir($sitesDir);
        echo "<p>Répertoire /sites/: " . ($sitesDirExists ? '<span class="success">Existe</span>' : '<span class="error">N\'existe pas</span>') . "</p>";
        
        // Vérifier l'existence du répertoire spécifique au domaine
        $domainDir = '/sites/qualiopi.ch';
        $domainDirExists = is_dir($domainDir);
        echo "<p>Répertoire du domaine (/sites/qualiopi.ch): " . ($domainDirExists ? '<span class="success">Existe</span>' : '<span class="error">N\'existe pas</span>') . "</p>";
        
        // Tester la présence de répertoires spécifiques à Infomaniak
        $infomaniakDirs = [
            '/home/clients' => 'Répertoire clients',
            '/home/clients/df8dceff557ccc0605d45e1581aa661b' => 'Répertoire client spécifique',
            '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites' => 'Répertoire sites',
            '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch' => 'Répertoire domaine principal',
            '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/test.qualiopi.ch' => 'Répertoire sous-domaine'
        ];
        
        echo "<h3>Test des chemins Infomaniak spécifiques:</h3>";
        echo "<table>";
        echo "<tr><th>Chemin</th><th>Description</th><th>Existe</th></tr>";
        
        foreach ($infomaniakDirs as $dir => $desc) {
            $exists = is_dir($dir);
            echo "<tr>";
            echo "<td class='monospace'>$dir</td>";
            echo "<td>$desc</td>";
            echo "<td>" . ($exists ? '<span class="success">Oui</span>' : '<span class="error">Non</span>') . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>Test des API endpoints</h2>
        <?php
        // Vérification des endpoints API
        $apiEndpoints = [
            '/api/' => 'API racine',
            '/api/index.php' => 'Point d\'entrée principal API',
            '/api/users.php' => 'API Utilisateurs',
            '/api/operations/' => 'Dossier opérations API',
            '/api/operations/users/' => 'Dossier opérations utilisateurs',
            '/api/operations/users/DeleteOperations.php' => 'Opérations de suppression utilisateur',
            '/api/models/' => 'Dossier modèles',
            '/api/models/User.php' => 'Modèle utilisateur',
            '/api/db-info.php' => 'Informations base de données',
            '/api/db-connection-test.php' => 'Test de connexion base de données',
            '/api/check-users.php' => 'Vérification des utilisateurs'
        ];
        
        echo "<table>";
        echo "<tr><th>Endpoint</th><th>Description</th><th>Existe</th></tr>";
        
        foreach ($apiEndpoints as $endpoint => $desc) {
            $fullPath = $_SERVER['DOCUMENT_ROOT'] . $endpoint;
            $exists = file_exists($fullPath);
            echo "<tr>";
            echo "<td class='monospace'>$endpoint</td>";
            echo "<td>$desc</td>";
            echo "<td>" . ($exists ? '<span class="success">Oui</span>' : '<span class="error">Non</span>') . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>Test de connexion à la base de données</h2>
        <?php
        // Configuration de la base de données
        $dbConfig = [
            'host' => 'p71x6d.myd.infomaniak.com',
            'dbname' => 'p71x6d_system',
            'username' => 'p71x6d_system',
            'password' => 'Trottinette43!'
        ];
        
        // Test de connexion PDO direct
        echo "<h3>Test de connexion PDO direct</h3>";
        try {
            $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $options);
            
            echo "<p class='success'>Connexion PDO réussie!</p>";
            
            // Compter les tables
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $tableCount = count($tables);
            
            echo "<p>Nombre de tables dans la base de données: <strong>{$tableCount}</strong></p>";
            
            // Liste des tables
            echo "<h4>Tables disponibles:</h4>";
            echo "<ul>";
            foreach ($tables as $table) {
                echo "<li>{$table}</li>";
            }
            echo "</ul>";
            
        } catch (PDOException $e) {
            echo "<p class='error'>Erreur de connexion PDO: " . $e->getMessage() . "</p>";
        }
        
        // Test de l'API db-connection-test.php
        echo "<h3>Test de l'API db-connection-test.php</h3>";
        
        $apiUrl = "/api/db-connection-test.php";
        $fullApiUrl = "http://" . $_SERVER['HTTP_HOST'] . $apiUrl;
        
        try {
            // Configuration de la requête
            $options = [
                'http' => [
                    'header'  => "Content-type: application/json\r\nAccept: application/json\r\n",
                    'method'  => 'GET',
                    'timeout' => 30
                ]
            ];
            $context = stream_context_create($options);
            
            // Exécuter la requête API
            $response = @file_get_contents($fullApiUrl, false, $context);
            
            if ($response === false) {
                echo "<p class='error'>Erreur lors de l'appel de l'API: " . error_get_last()['message'] . "</p>";
            } else {
                // Tenter de parser la réponse JSON
                $jsonError = "";
                try {
                    $responseData = json_decode($response, true, 512, JSON_THROW_ON_ERROR);
                    
                    echo "<p class='success'>Appel API réussi et réponse JSON valide</p>";
                    
                    // Afficher le statut de la réponse
                    if (isset($responseData['status'])) {
                        $statusClass = $responseData['status'] === 'success' ? 'success' : 'error';
                        echo "<p class='{$statusClass}'>Statut de la réponse: {$responseData['status']}</p>";
                    }
                    
                    // Afficher le message
                    if (isset($responseData['message'])) {
                        echo "<p>Message: {$responseData['message']}</p>";
                    }
                    
                    // Afficher les informations de connexion si disponibles
                    if (isset($responseData['connection_info'])) {
                        echo "<h4>Informations de connexion:</h4>";
                        echo "<table>";
                        foreach ($responseData['connection_info'] as $key => $value) {
                            if ($key !== 'password' && !is_array($value)) {
                                echo "<tr><td>{$key}</td><td>{$value}</td></tr>";
                            }
                        }
                        echo "</table>";
                    }
                    
                    // Afficher le contenu complet de la réponse
                    echo "<h4>Réponse JSON complète:</h4>";
                    echo "<div class='code-block'>" . htmlspecialchars(json_encode($responseData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . "</div>";
                    
                } catch (Exception $e) {
                    $jsonError = $e->getMessage();
                    echo "<p class='error'>Erreur dans le parsing JSON: {$jsonError}</p>";
                    echo "<p>Voici les 200 premiers caractères de la réponse brute:</p>";
                    echo "<div class='code-block'>" . htmlspecialchars(substr($response, 0, 200)) . "...</div>";
                }
            }
        } catch (Exception $e) {
            echo "<p class='error'>Exception lors de l'appel API: " . $e->getMessage() . "</p>";
        }
        
        // Test de l'API check-users.php
        echo "<h3>Test de l'API check-users.php</h3>";
        
        $apiUrl = "/api/check-users.php";
        $fullApiUrl = "http://" . $_SERVER['HTTP_HOST'] . $apiUrl;
        
        try {
            // Configuration de la requête
            $options = [
                'http' => [
                    'header'  => "Content-type: application/json\r\nAccept: application/json\r\n",
                    'method'  => 'GET',
                    'timeout' => 30
                ]
            ];
            $context = stream_context_create($options);
            
            // Exécuter la requête API
            $response = @file_get_contents($fullApiUrl, false, $context);
            
            if ($response === false) {
                echo "<p class='error'>Erreur lors de l'appel de check-users.php: " . error_get_last()['message'] . "</p>";
            } else {
                // Tenter de parser la réponse JSON
                $jsonError = "";
                try {
                    $responseData = json_decode($response, true, 512, JSON_THROW_ON_ERROR);
                    
                    echo "<p class='success'>Appel à check-users.php réussi et réponse JSON valide</p>";
                    
                    // Afficher le statut de la réponse
                    if (isset($responseData['status'])) {
                        $statusClass = $responseData['status'] === 'success' ? 'success' : 'error';
                        echo "<p class='{$statusClass}'>Statut de la réponse: {$responseData['status']}</p>";
                    }
                    
                    // Afficher le nombre d'utilisateurs
                    if (isset($responseData['count'])) {
                        echo "<p>Nombre d'utilisateurs: {$responseData['count']}</p>";
                    }
                    
                    // Afficher les utilisateurs trouvés s'ils sont disponibles
                    if (isset($responseData['records']) && is_array($responseData['records'])) {
                        echo "<h4>Utilisateurs trouvés:</h4>";
                        echo "<table>";
                        echo "<tr><th>ID</th><th>Nom</th><th>Prénom</th><th>Email</th><th>Rôle</th></tr>";
                        
                        foreach ($responseData['records'] as $user) {
                            echo "<tr>";
                            echo "<td>" . ($user['id'] ?? 'N/A') . "</td>";
                            echo "<td>" . ($user['nom'] ?? 'N/A') . "</td>";
                            echo "<td>" . ($user['prenom'] ?? 'N/A') . "</td>";
                            echo "<td>" . ($user['email'] ?? 'N/A') . "</td>";
                            echo "<td>" . ($user['role'] ?? 'N/A') . "</td>";
                            echo "</tr>";
                        }
                        
                        echo "</table>";
                    }
                } catch (Exception $e) {
                    $jsonError = $e->getMessage();
                    echo "<p class='error'>Erreur dans le parsing JSON (check-users.php): {$jsonError}</p>";
                    echo "<p>Voici les 200 premiers caractères de la réponse brute:</p>";
                    echo "<div class='code-block'>" . htmlspecialchars(substr($response, 0, 200)) . "...</div>";
                }
            }
        } catch (Exception $e) {
            echo "<p class='error'>Exception lors de l'appel API check-users.php: " . $e->getMessage() . "</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Test d'accès aux fichiers statiques</h2>
        <?php
        $staticFiles = [
            '/assets/index.js' => 'JavaScript principal (chemin standard)',
            '/sites/qualiopi.ch/assets/index.js' => 'JavaScript principal (chemin Infomaniak)',
            '/lovable-uploads/formacert-logo.png' => 'Logo (chemin standard)',
            '/sites/qualiopi.ch/public/lovable-uploads/formacert-logo.png' => 'Logo (chemin Infomaniak)'
        ];
        
        echo "<table>";
        echo "<tr><th>Fichier</th><th>Description</th><th>Accessible</th><th>Détails</th></tr>";
        
        // Trouver les fichiers JS et CSS réels avec hachage dans le nom
        $assetsDir = 'assets';
        $infomaniakAssetsDir = '/sites/qualiopi.ch/assets';
        
        if (is_dir($assetsDir)) {
            $jsFiles = glob("$assetsDir/*.js");
            $cssFiles = glob("$assetsDir/*.css");
            
            if (!empty($jsFiles)) {
                echo "<tr>";
                echo "<td class='monospace'>" . $jsFiles[0] . "</td>";
                echo "<td>Fichier JS trouvé (chemin standard)</td>";
                echo "<td class='success'>Oui</td>";
                echo "<td>" . filesize($jsFiles[0]) . " octets</td>";
                echo "</tr>";
            }
            
            if (!empty($cssFiles)) {
                echo "<tr>";
                echo "<td class='monospace'>" . $cssFiles[0] . "</td>";
                echo "<td>Fichier CSS trouvé (chemin standard)</td>";
                echo "<td class='success'>Oui</td>";
                echo "<td>" . filesize($cssFiles[0]) . " octets</td>";
                echo "</tr>";
            }
        }
        
        if (is_dir($infomaniakAssetsDir)) {
            $jsFiles = glob("$infomaniakAssetsDir/*.js");
            $cssFiles = glob("$infomaniakAssetsDir/*.css");
            
            if (!empty($jsFiles)) {
                echo "<tr>";
                echo "<td class='monospace'>" . $jsFiles[0] . "</td>";
                echo "<td>Fichier JS trouvé (chemin Infomaniak)</td>";
                echo "<td class='success'>Oui</td>";
                echo "<td>" . filesize($jsFiles[0]) . " octets</td>";
                echo "</tr>";
            }
            
            if (!empty($cssFiles)) {
                echo "<tr>";
                echo "<td class='monospace'>" . $cssFiles[0] . "</td>";
                echo "<td>Fichier CSS trouvé (chemin Infomaniak)</td>";
                echo "<td class='success'>Oui</td>";
                echo "<td>" . filesize($cssFiles[0]) . " octets</td>";
                echo "</tr>";
            }
        }
        
        foreach ($staticFiles as $file => $desc) {
            echo "<tr>";
            echo "<td class='monospace'>$file</td>";
            echo "<td>$desc</td>";
            
            if (file_exists($_SERVER['DOCUMENT_ROOT'] . $file)) {
                echo "<td class='success'>Oui</td>";
                echo "<td>" . filesize($_SERVER['DOCUMENT_ROOT'] . $file) . " octets</td>";
            } else {
                echo "<td class='error'>Non</td>";
                echo "<td>Fichier non trouvé</td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>Vérification de la structure des fichiers</h2>
        <?php
        // Vérification de la structure des fichiers critiques
        $criticalFiles = [
            "/api/middleware/ResponseHandler.php" => "Gestionnaire de réponse",
            "/api/utils/ResponseHandler.php" => "Utilitaire de réponse",
            "/api/config/database.php" => "Configuration base de données",
            "/api/config/db_config.json" => "Fichier JSON de configuration BD",
            "/api/users.php" => "API utilisateurs",
            "/api/check-users.php" => "Vérification des utilisateurs",
            "/api/models/User.php" => "Modèle utilisateur"
        ];
        
        echo "<h3>Fichiers critiques</h3>";
        echo "<table>";
        echo "<tr><th>Fichier</th><th>Description</th><th>Existe</th><th>Taille</th><th>Date de modification</th></tr>";
        
        foreach ($criticalFiles as $file => $desc) {
            $fullPath = $_SERVER['DOCUMENT_ROOT'] . $file;
            $exists = file_exists($fullPath);
            
            echo "<tr>";
            echo "<td class='monospace'>$file</td>";
            echo "<td>$desc</td>";
            
            if ($exists) {
                $size = filesize($fullPath);
                $mtime = filemtime($fullPath);
                echo "<td class='success'>Oui</td>";
                echo "<td>" . $size . " octets</td>";
                echo "<td>" . date("Y-m-d H:i:s", $mtime) . "</td>";
            } else {
                echo "<td class='error'>Non</td>";
                echo "<td colspan='2'>Fichier non trouvé</td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        
        // Vérification approfondie des fichiers ResponseHandler
        echo "<h3>Analyse des fichiers ResponseHandler</h3>";
        
        $responseHandlerPaths = [
            "/api/middleware/ResponseHandler.php",
            "/api/utils/ResponseHandler.php"
        ];
        
        foreach ($responseHandlerPaths as $filePath) {
            $fullPath = $_SERVER['DOCUMENT_ROOT'] . $filePath;
            
            if (file_exists($fullPath)) {
                echo "<h4>$filePath <span class='success'>(Trouvé)</span></h4>";
                
                // Lire le contenu du fichier
                $content = file_get_contents($fullPath);
                $contentLength = strlen($content);
                
                echo "<p>Taille du fichier: $contentLength octets</p>";
                
                // Vérifier les fonctions clés
                $hasSuccessFunction = strpos($content, "function success") !== false;
                $hasErrorFunction = strpos($content, "function error") !== false;
                
                echo "<p>Contient fonction success: " . ($hasSuccessFunction ? '<span class="success">Oui</span>' : '<span class="error">Non</span>') . "</p>";
                echo "<p>Contient fonction error: " . ($hasErrorFunction ? '<span class="success">Oui</span>' : '<span class="error">Non</span>') . "</p>";
                
                // Afficher un extrait du fichier
                echo "<p>Extrait du contenu:</p>";
                echo "<div class='code-block'>" . htmlspecialchars(substr($content, 0, 300)) . "...</div>";
            } else {
                echo "<h4>$filePath <span class='error'>(Non trouvé)</span></h4>";
                echo "<p class='error'>Ce fichier est manquant, ce qui peut causer des problèmes avec les réponses API.</p>";
            }
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Recommandations</h2>
        <p>Basé sur les résultats ci-dessus, voici les recommandations:</p>
        
        <ol>
            <li>Assurez-vous que votre fichier .htaccess contient des règles de réécriture spécifiques pour Infomaniak.</li>
            <li>Vérifiez que le fichier env.php dans api/config/ est correctement configuré avec les chemins Infomaniak.</li>
            <li>Si le répertoire /sites/ n'est pas accessible, contactez le support Infomaniak pour vérifier la configuration.</li>
            <li>Assurez-vous que le workflow GitHub Actions déploie tous les fichiers nécessaires dans la structure correcte.</li>
        </ol>
        
        <p>
            <a href="deploy-check.php" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-right: 10px;">Lancer le diagnostic complet</a>
            <a href="index.html" style="display: inline-block; background-color: #4b5563; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Retour à l'accueil</a>
        </p>
    </div>
</body>
</html>
