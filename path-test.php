
<?php
// Script simple pour tester les chemins et les requêtes
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test de chemins et requêtes</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { background: #f5f5f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        h2 { margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; }
        table td, table th { border: 1px solid #ddd; padding: 8px; text-align: left; }
        pre { background: #f1f1f1; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Test de chemins et requêtes</h1>
    
    <div class="info">
        <p><strong>Objectif:</strong> Ce script teste les chemins et l'exécution des requêtes PHP et API pour diagnostiquer les problèmes de déploiement.</p>
        <p><strong>Serveur:</strong> <?php echo $_SERVER['SERVER_SOFTWARE']; ?></p>
        <p><strong>PHP Version:</strong> <?php echo phpversion(); ?></p>
        <p><strong>Document Root:</strong> <?php echo $_SERVER['DOCUMENT_ROOT']; ?></p>
        <p><strong>Script Path:</strong> <?php echo $_SERVER['SCRIPT_FILENAME']; ?></p>
        <p><strong>Request URI:</strong> <?php echo $_SERVER['REQUEST_URI']; ?></p>
    </div>
    
    <h2>Structure des chemins</h2>
    
    <table>
        <tr>
            <th>Type</th>
            <th>Chemin</th>
            <th>Statut</th>
        </tr>
        <?php
        $paths = [
            'Document Root' => $_SERVER['DOCUMENT_ROOT'],
            'Script Directory' => dirname($_SERVER['SCRIPT_FILENAME']),
            'API Directory' => dirname($_SERVER['SCRIPT_FILENAME']) . '/api',
            'Assets Directory' => dirname($_SERVER['SCRIPT_FILENAME']) . '/assets',
            'Public Directory' => dirname($_SERVER['SCRIPT_FILENAME']) . '/public',
        ];
        
        foreach ($paths as $name => $path) {
            echo "<tr>";
            echo "<td>$name</td>";
            echo "<td>$path</td>";
            
            if (is_dir($path)) {
                echo "<td class='success'>Existe</td>";
            } else {
                echo "<td class='error'>N'existe pas</td>";
            }
            
            echo "</tr>";
        }
        ?>
    </table>
    
    <h2>Test des requêtes API</h2>
    
    <?php
    $apiEndpoints = [
        '/api/' => 'Racine API',
        '/api/test.php' => 'Test simple',
        '/api/phpinfo.php' => 'PHP Info',
    ];
    
    echo "<table>";
    echo "<tr><th>Endpoint</th><th>Description</th><th>Méthode</th><th>Résultat</th></tr>";
    
    foreach ($apiEndpoints as $endpoint => $description) {
        $url = 'http://' . $_SERVER['HTTP_HOST'] . $endpoint;
        
        echo "<tr>";
        echo "<td>$endpoint</td>";
        echo "<td>$description</td>";
        echo "<td>GET</td>";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            echo "<td class='success'>OK ($httpCode)</td>";
        } else {
            echo "<td class='error'>Erreur ($httpCode) : $error</td>";
        }
        
        echo "</tr>";
    }
    
    echo "</table>";
    ?>
    
    <h2>Vérification des fichiers importants</h2>
    
    <table>
        <tr>
            <th>Fichier</th>
            <th>Statut</th>
            <th>Taille</th>
            <th>Permissions</th>
        </tr>
        <?php
        $files = [
            'index.php' => 'Point d\'entrée principal',
            '.htaccess' => 'Configuration Apache',
            'api/index.php' => 'Point d\'entrée API',
            'api/.htaccess' => 'Configuration Apache API',
            'api/config/db_config.json' => 'Configuration BDD',
            'mkdir_script.sh' => 'Script de création des dossiers',
        ];
        
        foreach ($files as $file => $description) {
            echo "<tr>";
            echo "<td>$file ($description)</td>";
            
            if (file_exists($file)) {
                echo "<td class='success'>Existe</td>";
                echo "<td>" . filesize($file) . " octets</td>";
                echo "<td>" . substr(sprintf('%o', fileperms($file)), -4) . "</td>";
            } else {
                echo "<td class='error'>N'existe pas</td>";
                echo "<td>-</td>";
                echo "<td>-</td>";
            }
            
            echo "</tr>";
        }
        ?>
    </table>
    
    <h2>Actions possibles</h2>
    
    <p>Utilisez les scripts suivants pour résoudre les problèmes de déploiement :</p>
    
    <ul>
        <li><a href="mkdir_script.sh">Télécharger le script mkdir_script.sh</a></li>
        <li><a href="deploy-manual.sh">Télécharger le script deploy-manual.sh</a></li>
    </ul>
    
    <p>Pour exécuter ces scripts via SSH :</p>
    <pre>
chmod +x mkdir_script.sh deploy-manual.sh
./mkdir_script.sh
./deploy-manual.sh
    </pre>
</body>
</html>
