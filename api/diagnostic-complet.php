
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic Complet FormaCert</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2 { color: #334155; }
        .section { margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #f8fafc; }
        .success { color: #15803d; font-weight: 600; }
        .error { color: #b91c1c; font-weight: 600; }
        .warning { color: #b45309; font-weight: 600; }
        .monospace { font-family: monospace; background-color: #f1f5f9; padding: 2px 4px; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        table, th, td { border: 1px solid #e2e8f0; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f1f5f9; }
        .actions { background-color: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 10px; border-left: 4px solid #3b82f6; }
    </style>
</head>
<body>
    <h1>Diagnostic Complet FormaCert</h1>
    <p>Cet outil permet de diagnostiquer l'état du déploiement de l'application FormaCert et de son API.</p>
    
    <div class="section">
        <h2>1. Informations Serveur</h2>
        <table>
            <tr><th>Information</th><th>Valeur</th></tr>
            <tr><td>Serveur</td><td><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'; ?></td></tr>
            <tr><td>PHP Version</td><td><?php echo phpversion(); ?></td></tr>
            <tr><td>Système d'exploitation</td><td><?php echo PHP_OS; ?></td></tr>
            <tr><td>Document Root</td><td><?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible'; ?></td></tr>
            <tr><td>Répertoire Courant</td><td><?php echo getcwd(); ?></td></tr>
            <tr><td>Hôte</td><td><?php echo $_SERVER['HTTP_HOST'] ?? 'Non disponible'; ?></td></tr>
            <tr><td>URI Demandée</td><td><?php echo $_SERVER['REQUEST_URI'] ?? 'Non disponible'; ?></td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>2. Structure des Fichiers</h2>
        <table>
            <tr><th>Chemin</th><th>Description</th><th>Statut</th><th>Détails</th></tr>
            <?php
            $paths = [
                '../index.html' => 'Page d\'accueil',
                '../.htaccess' => 'Configuration Apache principale',
                './.htaccess' => 'Configuration Apache API',
                './index.php' => 'Point d\'entrée API',
                './config/env.php' => 'Configuration d\'environnement',
                './config/app_config.json' => 'Configuration application',
                '../assets' => 'Dossier des assets compilés',
                '../public/lovable-uploads' => 'Dossier des uploads'
            ];
            
            foreach ($paths as $path => $description) {
                echo "<tr>";
                echo "<td class='monospace'>$path</td>";
                echo "<td>$description</td>";
                
                if (file_exists($path)) {
                    if (is_dir($path)) {
                        $items = scandir($path);
                        $count = count($items) - 2; // Moins . et ..
                        echo "<td class='success'>Existe (dossier)</td>";
                        echo "<td>Contient $count éléments</td>";
                    } else {
                        $size = filesize($path);
                        $readable = is_readable($path) ? 'Lisible' : 'Non lisible';
                        $writable = is_writable($path) ? 'Modifiable' : 'Non modifiable';
                        echo "<td class='success'>Existe (fichier)</td>";
                        echo "<td>$size octets - $readable - $writable</td>";
                    }
                } else {
                    echo "<td class='error'>N'existe pas</td>";
                    echo "<td>Fichier manquant</td>";
                }
                
                echo "</tr>";
            }
            ?>
        </table>
    </div>
    
    <div class="section">
        <h2>3. Configuration Environment</h2>
        <?php
        if (file_exists('./config/env.php')) {
            echo "<p class='success'>Fichier de configuration trouvé</p>";
            
            // Inclure le fichier de configuration en toute sécurité
            try {
                include_once './config/env.php';
                
                echo "<table>";
                echo "<tr><th>Variable</th><th>Valeur</th></tr>";
                
                // Afficher les variables d'environnement principales
                $env_vars = [
                    'APP_ENV' => env('APP_ENV', 'non défini'),
                    'API_URL_DEV' => env('API_URL_DEV', 'non défini'),
                    'API_URL_PROD' => env('API_URL_PROD', 'non défini'),
                    'ALLOWED_ORIGIN_DEV' => env('ALLOWED_ORIGIN_DEV', 'non défini'),
                    'ALLOWED_ORIGIN_PROD' => env('ALLOWED_ORIGIN_PROD', 'non défini')
                ];
                
                foreach ($env_vars as $key => $value) {
                    echo "<tr><td>$key</td><td>$value</td></tr>";
                }
                
                echo "</table>";
                
            } catch (Exception $e) {
                echo "<p class='error'>Erreur lors du chargement de la configuration: " . $e->getMessage() . "</p>";
            }
        } else {
            echo "<p class='error'>Fichier de configuration non trouvé!</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>4. Test API</h2>
        <?php
        // Tester l'API
        $api_endpoint = '../api/';
        $api_status = false;
        $api_response = null;
        
        try {
            // Utiliser file_get_contents avec un contexte pour capturer les erreurs
            $context = stream_context_create(['http' => ['ignore_errors' => true]]);
            $api_output = @file_get_contents($api_endpoint, false, $context);
            
            if ($api_output !== false) {
                $api_status = true;
                $api_response = json_decode($api_output, true);
            }
            
            // Vérifier si nous avons des informations d'erreur HTTP
            if (isset($http_response_header)) {
                foreach ($http_response_header as $header) {
                    if (preg_match('/^HTTP\/\d\.\d\s+(\d+)/', $header, $matches)) {
                        $status_code = intval($matches[1]);
                        if ($status_code !== 200) {
                            $api_status = false;
                        }
                    }
                }
            }
        } catch (Exception $e) {
            $api_status = false;
            $api_response = $e->getMessage();
        }
        
        if ($api_status) {
            echo "<p class='success'>L'API est accessible</p>";
            echo "<pre class='monospace'>" . print_r($api_response, true) . "</pre>";
        } else {
            echo "<p class='error'>L'API n'est pas accessible</p>";
            if ($api_response) {
                echo "<pre class='monospace'>" . print_r($api_response, true) . "</pre>";
            }
        }
        ?>
        
        <div class="actions">
            <h3>Actions recommandées</h3>
            <ul>
                <li>Vérifiez la configuration CORS dans le fichier .htaccess et env.php</li>
                <li>Assurez-vous que l'API peut être contactée à l'URL: <?php echo $_SERVER['HTTP_HOST'] ?? 'qualiopi.ch'; ?>/api/</li>
                <li>Validez que les chemins sont corrects dans les fichiers de configuration</li>
                <li>Vérifiez les logs d'erreur Apache pour plus de détails</li>
            </ul>
        </div>
    </div>
    
    <div class="section">
        <h2>5. Test de Chargement des Assets</h2>
        <?php
        // Vérifier si les assets sont accessibles
        $asset_paths = [
            '../assets/index.js',
            '../assets/vendor.js',
            '../lovable-uploads/formacert-logo.png'
        ];
        
        echo "<table>";
        echo "<tr><th>Asset</th><th>Status</th><th>Détails</th></tr>";
        
        foreach ($asset_paths as $asset) {
            echo "<tr>";
            echo "<td class='monospace'>$asset</td>";
            
            if (file_exists($asset)) {
                $size = filesize($asset);
                echo "<td class='success'>Existe</td>";
                echo "<td>$size octets</td>";
            } else {
                echo "<td class='error'>Manquant</td>";
                echo "<td>Fichier non trouvé</td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
        
        <div class="actions">
            <h3>Recommandations pour les assets</h3>
            <ul>
                <li>Assurez-vous que tous les fichiers compilés (JS, CSS) sont présents dans le dossier /assets</li>
                <li>Vérifiez que les images et autres ressources sont correctement déployées</li>
                <li>Confirmez que le chemin vers le logo est correct: /lovable-uploads/formacert-logo.png</li>
            </ul>
        </div>
    </div>
    
    <div class="section">
        <h2>6. Actions de Correction</h2>
        <p>Sur la base du diagnostic ci-dessus, voici les actions recommandées pour résoudre les problèmes courants:</p>
        
        <ol>
            <li>Vérifiez la présence du double slash dans les URLs (//) qui peut causer des problèmes</li>
            <li>Validez la configuration CORS dans le fichier api/.htaccess</li>
            <li>Assurez-vous que les chemins relatifs sont corrects dans tous les fichiers de configuration</li>
            <li>Vérifiez que l'URL de l'API dans le front-end pointe vers le bon endpoint</li>
            <li>Consultez les logs d'erreur du serveur pour obtenir plus de détails sur les erreurs 500</li>
        </ol>
        
        <p>Pour corriger l'erreur de chargement du logo:</p>
        <ol>
            <li>Vérifiez que le fichier logo existe dans le dossier public/lovable-uploads/</li>
            <li>Assurez-vous que le chemin d'accès est correct et qu'il n'y a pas de double slash</li>
            <li>Validez que les permissions de fichier permettent la lecture par le serveur web</li>
        </ol>
    </div>
</body>
</html>
