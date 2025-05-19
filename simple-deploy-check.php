
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification Simple de Déploiement</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: #15803d; font-weight: 600; }
        .error { color: #b91c1c; font-weight: 600; }
        .section { margin-bottom: 20px; background-color: #f8fafc; padding: 15px; border-radius: 8px; }
        table { border-collapse: collapse; width: 100%; margin: 15px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
        th { background-color: #f1f5f9; }
    </style>
</head>
<body>
    <h1>Vérification Simple de Déploiement</h1>
    
    <div class="section">
        <h2>1. Fichiers Critiques</h2>
        <?php
        $critical_files = [
            'index.html' => 'Page principale',
            '.htaccess' => 'Configuration Apache principale',
            'api/index.php' => 'Point d\'entrée API',
            'api/.htaccess' => 'Configuration Apache API'
        ];
        
        echo "<table>";
        echo "<tr><th>Fichier</th><th>Description</th><th>Statut</th><th>Taille</th><th>Date</th></tr>";
        
        foreach ($critical_files as $file => $description) {
            echo "<tr>";
            echo "<td>{$file}</td>";
            echo "<td>{$description}</td>";
            
            if (file_exists($file)) {
                echo "<td class='success'>EXISTE</td>";
                echo "<td>" . filesize($file) . " octets</td>";
                echo "<td>" . date('Y-m-d H:i:s', filemtime($file)) . "</td>";
            } else {
                echo "<td class='error'>MANQUANT</td>";
                echo "<td>-</td>";
                echo "<td>-</td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>2. Contenu du fichier API/.htaccess</h2>
        <?php
        $htaccess_path = 'api/.htaccess';
        if (file_exists($htaccess_path)) {
            echo "<pre>" . htmlspecialchars(file_get_contents($htaccess_path)) . "</pre>";
        } else {
            echo "<p class='error'>Fichier api/.htaccess introuvable</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>3. Test simple de l'API</h2>
        <?php
        $api_url = 'http://' . $_SERVER['HTTP_HOST'] . '/api/';
        echo "<p>Test de l'URL: <strong>{$api_url}</strong></p>";
        
        $context = stream_context_create([
            'http' => [
                'timeout' => 5,
                'ignore_errors' => true
            ]
        ]);
        
        $response = @file_get_contents($api_url, false, $context);
        $http_response_header = isset($http_response_header) ? $http_response_header : [];
        
        if ($response !== false) {
            echo "<p class='success'>L'API répond!</p>";
            $status_line = isset($http_response_header[0]) ? $http_response_header[0] : 'Inconnu';
            echo "<p>Statut: {$status_line}</p>";
            echo "<p>Réponse:</p>";
            echo "<pre>" . htmlspecialchars(substr($response, 0, 500)) . "</pre>";
        } else {
            echo "<p class='error'>Impossible de contacter l'API!</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>4. Vérification des assets</h2>
        <?php
        $assets_dir = 'assets';
        
        if (is_dir($assets_dir)) {
            $js_files = glob($assets_dir . '/*.js');
            $css_files = glob($assets_dir . '/*.css');
            
            echo "<p>Fichiers JavaScript: " . count($js_files) . " trouvé(s)</p>";
            echo "<p>Fichiers CSS: " . count($css_files) . " trouvé(s)</p>";
            
            echo "<table>";
            echo "<tr><th>Fichier</th><th>Taille</th><th>Date</th></tr>";
            
            foreach (array_merge($js_files, $css_files) as $file) {
                echo "<tr>";
                echo "<td>" . basename($file) . "</td>";
                echo "<td>" . filesize($file) . " octets</td>";
                echo "<td>" . date('Y-m-d H:i:s', filemtime($file)) . "</td>";
                echo "</tr>";
            }
            
            echo "</table>";
        } else {
            echo "<p class='error'>Dossier assets introuvable!</p>";
        }
        ?>
    </div>
</body>
</html>
