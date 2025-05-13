
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic Infomaniak pour Qualiopi.ch</title>
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
    </style>
</head>
<body>
    <h1>Diagnostic Infomaniak pour Qualiopi.ch</h1>
    <p>Cet outil vérifie la configuration spécifique à l'hébergement Infomaniak.</p>
    
    <div class="section">
        <h2>1. Informations du Serveur</h2>
        <?php
        echo "<table>";
        echo "<tr><th>Variable</th><th>Valeur</th></tr>";
        echo "<tr><td>Serveur Web</td><td>" . $_SERVER['SERVER_SOFTWARE'] . "</td></tr>";
        echo "<tr><td>Document Root</td><td>" . $_SERVER['DOCUMENT_ROOT'] . "</td></tr>";
        echo "<tr><td>Script Filename</td><td>" . $_SERVER['SCRIPT_FILENAME'] . "</td></tr>";
        echo "<tr><td>Request URI</td><td>" . $_SERVER['REQUEST_URI'] . "</td></tr>";
        echo "<tr><td>Host</td><td>" . $_SERVER['HTTP_HOST'] . "</td></tr>";
        echo "<tr><td>PHP Version</td><td>" . phpversion() . "</td></tr>";
        echo "<tr><td>Répertoire courant</td><td>" . getcwd() . "</td></tr>";
        echo "</table>";
        
        // Vérifier si nous sommes sur Infomaniak
        $isInfomaniak = strpos($_SERVER['DOCUMENT_ROOT'] ?? '', '/home/clients') !== false;
        echo "<p>Détection Infomaniak: <strong>" . ($isInfomaniak ? '<span class="success">Oui</span>' : '<span class="warning">Non</span>') . "</strong></p>";
        ?>
    </div>
    
    <div class="section">
        <h2>2. Structure de Répertoires</h2>
        <?php
        // Vérifier les chemins spécifiques à Infomaniak
        $infoPath = '/home/clients/df8dceff557ccc0605d45e1581aa661b';
        $sitePath = $infoPath . '/sites/qualiopi.ch';
        
        echo "<p>Chemin Infomaniak: <span class='monospace'>{$infoPath}</span> - ";
        if (file_exists($infoPath)) {
            echo "<span class='success'>Existe</span>";
        } else {
            echo "<span class='error'>N'existe pas</span>";
        }
        echo "</p>";
        
        echo "<p>Chemin du site: <span class='monospace'>{$sitePath}</span> - ";
        if (file_exists($sitePath)) {
            echo "<span class='success'>Existe</span>";
        } else {
            echo "<span class='error'>N'existe pas</span>";
        }
        echo "</p>";
        
        // Vérifier les dossiers clés
        $folders = [
            'assets' => 'Dossier des assets',
            'api' => 'Dossier API',
            'public/lovable-uploads' => 'Dossier des uploads'
        ];
        
        echo "<h3>Dossiers importants:</h3>";
        echo "<table>";
        echo "<tr><th>Dossier</th><th>Description</th><th>Statut</th><th>Contenu</th></tr>";
        
        foreach ($folders as $folder => $desc) {
            echo "<tr>";
            echo "<td class='monospace'>{$folder}</td>";
            echo "<td>{$desc}</td>";
            
            if (is_dir($folder)) {
                echo "<td class='success'>Existe</td>";
                $files = scandir($folder);
                $fileCount = count($files) - 2; // Moins . et ..
                echo "<td>{$fileCount} fichier(s)</td>";
            } else {
                echo "<td class='error'>N'existe pas</td>";
                echo "<td>-</td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>3. Fichiers Critiques</h2>
        <?php
        $files = [
            'index.html' => 'Page principale',
            '.htaccess' => 'Configuration Apache',
            'api/index.php' => 'Point d\'entrée API',
            'api/.htaccess' => 'Configuration Apache API',
            'api/config/env.php' => 'Configuration d\'environnement'
        ];
        
        echo "<table>";
        echo "<tr><th>Fichier</th><th>Description</th><th>Statut</th><th>Taille</th></tr>";
        
        foreach ($files as $file => $desc) {
            echo "<tr>";
            echo "<td class='monospace'>{$file}</td>";
            echo "<td>{$desc}</td>";
            
            if (file_exists($file)) {
                echo "<td class='success'>Existe</td>";
                echo "<td>" . filesize($file) . " octets</td>";
            } else {
                echo "<td class='error'>N'existe pas</td>";
                echo "<td>-</td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>4. Configuration de Base de Données</h2>
        <?php
        $db_config_file = 'api/config/db_config.json';
        $env_file = 'api/config/env.php';
        
        echo "<h3>Fichier db_config.json:</h3>";
        if (file_exists($db_config_file)) {
            $db_config = json_decode(file_get_contents($db_config_file), true);
            echo "<pre>";
            print_r($db_config);
            echo "</pre>";
            
            echo "<p>Base de données configurée: <span class='success'>" . $db_config['db_name'] . "</span></p>";
            echo "<p>Utilisateur configuré: <span class='success'>" . $db_config['username'] . "</span></p>";
        } else {
            echo "<p class='error'>Fichier de configuration DB non trouvé!</p>";
        }
        
        echo "<h3>Constantes dans env.php:</h3>";
        if (file_exists($env_file)) {
            echo "<p class='success'>Fichier env.php trouvé</p>";
            
            // Essayer de charger les constantes sans inclure le fichier
            $content = file_get_contents($env_file);
            preg_match_all('/define\(\'([A-Z_]+)\',\s*\'([^\']+)\'\);/', $content, $matches);
            
            echo "<table>";
            echo "<tr><th>Constante</th><th>Valeur</th></tr>";
            
            if (!empty($matches[1])) {
                for ($i = 0; $i < count($matches[1]); $i++) {
                    $constant = $matches[1][$i];
                    $value = $matches[2][$i];
                    
                    // Masquer le mot de passe
                    if ($constant == 'DB_PASS') {
                        $value = str_repeat('*', strlen($value));
                    }
                    
                    echo "<tr><td>{$constant}</td><td>{$value}</td></tr>";
                }
            }
            
            echo "</table>";
        } else {
            echo "<p class='error'>Fichier env.php non trouvé!</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>5. Test d'Accès aux Assets</h2>
        <?php
        // Vérifier les assets JavaScript et CSS
        $assetTypes = [
            'js' => 'JavaScript',
            'css' => 'CSS'
        ];
        
        echo "<table>";
        echo "<tr><th>Type</th><th>Fichier</th><th>Accès Direct</th><th>Taille</th></tr>";
        
        foreach ($assetTypes as $ext => $type) {
            $files = glob("assets/*.{$ext}");
            
            if (!empty($files)) {
                foreach (array_slice($files, 0, 3) as $file) { // Limiter à 3 fichiers
                    $url = "/{$file}";
                    $fileSize = filesize($file);
                    
                    echo "<tr>";
                    echo "<td>{$type}</td>";
                    echo "<td class='monospace'>{$file}</td>";
                    echo "<td><a href='{$url}' target='_blank'>Tester</a></td>";
                    echo "<td>{$fileSize} octets</td>";
                    echo "</tr>";
                }
            } else {
                echo "<tr>";
                echo "<td>{$type}</td>";
                echo "<td colspan='3' class='error'>Aucun fichier {$ext} trouvé dans /assets/</td>";
                echo "</tr>";
            }
        }
        
        echo "</table>";
        
        // Vérifier les uploads
        $uploads = glob("public/lovable-uploads/*.*");
        
        echo "<h3>Fichiers téléchargés:</h3>";
        if (!empty($uploads)) {
            echo "<ul>";
            foreach (array_slice($uploads, 0, 5) as $file) { // Limiter à 5 fichiers
                $filename = basename($file);
                echo "<li><a href='/public/lovable-uploads/{$filename}' target='_blank'>{$filename}</a> (" . filesize($file) . " octets)</li>";
            }
            echo "</ul>";
        } else {
            echo "<p class='warning'>Aucun fichier trouvé dans public/lovable-uploads/</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>6. Test de Redirection API</h2>
        <?php
        // Tester un endpoint API simple
        $apiUrl = '/api/test.php';
        $ch = curl_init('http://' . $_SERVER['HTTP_HOST'] . $apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        echo "<h3>Test de l'API:</h3>";
        echo "<p>URL testée: <span class='monospace'>{$apiUrl}</span></p>";
        echo "<p>Code HTTP: <span class='" . ($httpCode == 200 ? 'success' : 'error') . "'>{$httpCode}</span></p>";
        
        if ($response) {
            // Séparer les en-têtes et le corps
            list($headers, $body) = explode("\r\n\r\n", $response, 2);
            
            echo "<h4>En-têtes de réponse:</h4>";
            echo "<pre>" . htmlspecialchars($headers) . "</pre>";
            
            echo "<h4>Corps de la réponse:</h4>";
            echo "<pre>" . htmlspecialchars(substr($body, 0, 500)) . "</pre>";
            
            // Tester si c'est du JSON valide
            $json = json_decode($body, true);
            if ($json !== null) {
                echo "<p class='success'>Réponse JSON valide</p>";
            } else {
                echo "<p class='error'>Réponse non-JSON ou invalide</p>";
            }
        } else {
            echo "<p class='error'>Aucune réponse reçue</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>7. Recommandations</h2>
        <p>Sur la base des résultats de diagnostic ci-dessus, voici quelques recommandations :</p>
        
        <ul>
            <li>Vérifiez que les règles de réécriture dans le fichier .htaccess sont correctement configurées pour Infomaniak</li>
            <li>Assurez-vous que les chemins dans votre frontend pointent vers /assets/ pour les ressources statiques</li>
            <li>Confirmez que la configuration de base de données utilise bien p71x6d_richard comme nom d'utilisateur et base de données</li>
            <li>Vérifiez les logs d'erreur Apache pour plus de détails sur les problèmes potentiels</li>
        </ul>
        
        <p>Si vous rencontrez des problèmes avec les assets, utilisez le script <a href="fix-infomaniak-assets.php">fix-infomaniak-assets.php</a> pour corriger automatiquement les chemins.</p>
    </div>
</body>
</html>
