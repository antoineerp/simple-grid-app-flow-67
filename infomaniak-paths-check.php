
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
        $isInfomaniak = strpos($_SERVER['DOCUMENT_ROOT'] ?? '', '/home/clients') !== false;
        echo "<p>Détection Infomaniak: <strong>" . ($isInfomaniak ? '<span class="success">Oui</span>' : '<span class="warning">Non</span>') . "</strong></p>";
        
        // Tester les chemins courants
        $currentDir = getcwd();
        echo "<p>Répertoire courant: <span class='monospace'>$currentDir</span></p>";
        
        // Vérifier l'existence du répertoire /home/clients/
        $clientsDir = '/home/clients';
        $clientsDirExists = is_dir($clientsDir);
        echo "<p>Répertoire $clientsDir: " . ($clientsDirExists ? '<span class="success">Existe</span>' : '<span class="error">N\'existe pas</span>') . "</p>";
        
        // Vérifier l'existence du répertoire spécifique au client
        $clientDir = '/home/clients/df8dceff557ccc0605d45e1581aa661b';
        $clientDirExists = is_dir($clientDir);
        echo "<p>Répertoire du client ($clientDir): " . ($clientDirExists ? '<span class="success">Existe</span>' : '<span class="error">N\'existe pas</span>') . "</p>";
        
        // Vérifier le répertoire des sites
        $sitesDir = '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites';
        $sitesDirExists = is_dir($sitesDir);
        echo "<p>Répertoire des sites ($sitesDir): " . ($sitesDirExists ? '<span class="success">Existe</span>' : '<span class="error">N\'existe pas</span>') . "</p>";
        
        // Vérifier le répertoire du domaine
        $domainDir = '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch';
        $domainDirExists = is_dir($domainDir);
        echo "<p>Répertoire du domaine ($domainDir): " . ($domainDirExists ? '<span class="success">Existe</span>' : '<span class="error">N\'existe pas</span>') . "</p>";
        
        // Vérifier les dossiers importants du domaine
        $importantFolders = [
            '/api' => 'Dossier API',
            '/assets' => 'Dossier assets',
            '/public' => 'Dossier public'
        ];
        
        echo "<h3>Dossiers importants:</h3>";
        echo "<table>";
        echo "<tr><th>Chemin</th><th>Description</th><th>Existe</th></tr>";
        
        foreach ($importantFolders as $folder => $desc) {
            $folderPath = $currentDir . $folder;
            $exists = is_dir($folderPath);
            echo "<tr>";
            echo "<td class='monospace'>$folderPath</td>";
            echo "<td>$desc</td>";
            echo "<td>" . ($exists ? '<span class="success">Oui</span>' : '<span class="error">Non</span>') . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>Test d'accès aux fichiers statiques</h2>
        <?php
        $staticFiles = [
            '/assets/index.js' => 'JavaScript principal',
            '/lovable-uploads/formacert-logo.png' => 'Logo (chemin standard)',
            '/public/lovable-uploads/formacert-logo.png' => 'Logo (chemin public)'
        ];
        
        echo "<table>";
        echo "<tr><th>Fichier</th><th>Description</th><th>Accessible</th><th>Détails</th></tr>";
        
        // Trouver les fichiers JS et CSS réels avec hachage dans le nom
        $assetsDir = 'assets';
        
        if (is_dir($assetsDir)) {
            $jsFiles = glob("$assetsDir/*.js");
            $cssFiles = glob("$assetsDir/*.css");
            
            if (!empty($jsFiles)) {
                echo "<tr>";
                echo "<td class='monospace'>" . $jsFiles[0] . "</td>";
                echo "<td>Fichier JS trouvé</td>";
                echo "<td class='success'>Oui</td>";
                echo "<td>" . filesize($jsFiles[0]) . " octets</td>";
                echo "</tr>";
            }
            
            if (!empty($cssFiles)) {
                echo "<tr>";
                echo "<td class='monospace'>" . $cssFiles[0] . "</td>";
                echo "<td>Fichier CSS trouvé</td>";
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
        <h2>Recommandations</h2>
        <p>Basé sur les résultats ci-dessus, voici les recommandations:</p>
        
        <ol>
            <li>Assurez-vous que votre fichier .htaccess contient des règles de réécriture spécifiques pour Infomaniak.</li>
            <li>Vérifiez que le fichier env.php dans api/config/ est correctement configuré avec les chemins Infomaniak.</li>
            <li>Si le répertoire des sites n'est pas accessible, contactez le support Infomaniak pour vérifier la configuration.</li>
            <li>Assurez-vous que le workflow GitHub Actions déploie tous les fichiers nécessaires dans la structure correcte.</li>
        </ol>
        
        <p>
            <a href="deploy-check.php" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-right: 10px;">Lancer le diagnostic complet</a>
            <a href="index.html" style="display: inline-block; background-color: #4b5563; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Retour à l'accueil</a>
        </p>
    </div>
</body>
</html>
