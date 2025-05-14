
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
        
        // Vérifier tous les chemins possibles pour le site
        $possiblePaths = [
            '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch',
            '/sites/qualiopi.ch',
            '/home/clients/df8dceff557ccc0605d45e1581aa661b/qualiopi.ch',
            '/home/clients/df8dceff557ccc0605d45e1581aa661b/web/qualiopi.ch'
        ];
        
        echo "<h3>Chemins possibles pour le site:</h3>";
        echo "<table>";
        echo "<tr><th>Chemin</th><th>Existe</th></tr>";
        
        foreach ($possiblePaths as $path) {
            echo "<tr>";
            echo "<td class='monospace'>$path</td>";
            echo "<td>" . (is_dir($path) ? '<span class="success">Oui</span>' : '<span class="error">Non</span>') . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
        
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
            <li>Utilisez les URLs absolues pour le déploiement sur Infomaniak.</li>
            <li>Si vous avez des problèmes avec les chemins, utilisez les chemins relatifs.</li>
            <li>Si le PHP ne s'exécute pas, vérifiez les permissions des fichiers et le fonctionnement PHP sur votre hébergement.</li>
            <li>Vérifiez la configuration de la base de données pour vous assurer qu'elle utilise les bons paramètres Infomaniak.</li>
        </ol>
        
        <p>
            <a href="php-test.php" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-right: 10px;">Tester PHP</a>
            <a href="phpinfo.php" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-right: 10px;">phpinfo()</a>
            <a href="api/db-test.php" style="display: inline-block; background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-right: 10px;">Tester DB</a>
            <a href="index.html" style="display: inline-block; background-color: #4b5563; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Retour à l'accueil</a>
        </p>
    </div>
</body>
</html>
