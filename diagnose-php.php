
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic PHP et Serveur</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
        table { border-collapse: collapse; width: 100%; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 8px; text-align: left; }
        .test-button { background: #4CAF50; color: white; border: none; padding: 8px 16px; cursor: pointer; border-radius: 4px; }
        .test-button:hover { background: #45a049; }
    </style>
</head>
<body>
    <h1>Diagnostic PHP et Serveur</h1>
    
    <div class="section">
        <h2>1. Informations PHP</h2>
        <?php 
        echo "<p>Version PHP: " . phpversion() . "</p>";
        echo "<p>Interface SAPI: " . php_sapi_name() . "</p>";
        echo "<p>Extensions chargées: " . count(get_loaded_extensions()) . "</p>";
        ?>
        
        <h3>Extensions critiques:</h3>
        <table>
            <tr><th>Extension</th><th>Statut</th></tr>
            <?php
            $critical_extensions = ['json', 'pdo', 'pdo_mysql', 'mysqli', 'curl'];
            foreach($critical_extensions as $ext) {
                echo "<tr>";
                echo "<td>$ext</td>";
                echo "<td>" . (extension_loaded($ext) ? "<span class='success'>Activée</span>" : "<span class='error'>Non activée</span>") . "</td>";
                echo "</tr>";
            }
            ?>
        </table>
    </div>
    
    <div class="section">
        <h2>2. Vérification des Chemins et Fichiers</h2>
        <?php
        $important_paths = [
            '/.htaccess' => 'Fichier .htaccess racine',
            '/api/.htaccess' => 'Fichier .htaccess API',
            '/api/php-test.php' => 'Script de test PHP',
            '/api/index.php' => 'Index API',
            '/api/config.php' => 'Configuration API'
        ];
        
        echo "<table>";
        echo "<tr><th>Chemin</th><th>Description</th><th>Statut</th></tr>";
        
        foreach($important_paths as $path => $desc) {
            $full_path = $_SERVER['DOCUMENT_ROOT'] . $path;
            $exists = file_exists($full_path);
            $readable = $exists && is_readable($full_path);
            
            echo "<tr>";
            echo "<td>$path</td>";
            echo "<td>$desc</td>";
            echo "<td>";
            
            if($exists) {
                echo "<span class='success'>Existe</span>";
                if(!$readable) echo " <span class='warning'>(non lisible)</span>";
            } else {
                echo "<span class='error'>Introuvable</span>";
            }
            
            echo "</td></tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>3. Test d'Exécution PHP</h2>
        <p>Cette section teste si PHP peut générer correctement du JSON.</p>
        
        <div id="php-execution-result">
            <p>Cliquez sur le bouton pour tester l'exécution PHP:</p>
            <button class="test-button" onclick="testPhpExecution()">Tester l'exécution PHP</button>
            <div id="test-result" style="margin-top: 10px;"></div>
        </div>
        
        <script>
            function testPhpExecution() {
                const resultDiv = document.getElementById('test-result');
                resultDiv.innerHTML = '<p>Chargement en cours...</p>';
                
                fetch('api/php-execution-test.php?' + new Date().getTime())
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Erreur HTTP: ${response.status}`);
                        }
                        return response.text();
                    })
                    .then(text => {
                        // Vérifier si la réponse est du PHP brut
                        if (text.trim().startsWith('<?php')) {
                            resultDiv.innerHTML = `
                                <p class="error">ÉCHEC: PHP non exécuté!</p>
                                <p>Le serveur renvoie le code PHP au lieu de l'exécuter:</p>
                                <pre>${escapeHtml(text.substring(0, 200))}...</pre>
                                <p>Consultez <a href="api/server-fix.php">server-fix.php</a> pour résoudre ce problème.</p>
                            `;
                            return;
                        }
                        
                        // Essayer de parser le JSON
                        try {
                            const data = JSON.parse(text);
                            resultDiv.innerHTML = `
                                <p class="success">SUCCÈS: PHP s'exécute correctement!</p>
                                <p>Le serveur a renvoyé un JSON valide:</p>
                                <pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>
                            `;
                        } catch(e) {
                            resultDiv.innerHTML = `
                                <p class="error">ÉCHEC: Réponse non valide!</p>
                                <p>La réponse n'est pas un JSON valide:</p>
                                <pre>${escapeHtml(text.substring(0, 200))}...</pre>
                                <p>Erreur: ${e.message}</p>
                            `;
                        }
                    })
                    .catch(error => {
                        resultDiv.innerHTML = `
                            <p class="error">ÉCHEC: Erreur réseau!</p>
                            <p>${error.message}</p>
                        `;
                    });
            }
            
            function escapeHtml(text) {
                return text
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            }
        </script>
    </div>
    
    <div class="section">
        <h2>4. Informations Serveur</h2>
        <?php
        echo "<p>Serveur: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu') . "</p>";
        echo "<p>Protocole: " . ($_SERVER['SERVER_PROTOCOL'] ?? 'Inconnu') . "</p>";
        echo "<p>Méthode: " . ($_SERVER['REQUEST_METHOD'] ?? 'Inconnue') . "</p>";
        echo "<p>Adresse IP du serveur: " . ($_SERVER['SERVER_ADDR'] ?? 'Inconnue') . "</p>";
        echo "<p>Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Inconnu') . "</p>";
        ?>
    </div>
    
    <div class="section">
        <h2>5. Étapes pour résoudre les problèmes</h2>
        <ol>
            <li>Vérifiez que PHP est installé et correctement configuré sur votre serveur</li>
            <li>Assurez-vous que les fichiers .htaccess sont correctement configurés pour exécuter PHP</li>
            <li>Vérifiez les permissions des fichiers PHP (644 ou 755)</li>
            <li>Testez l'exécution PHP avec différents scripts</li>
            <li>Essayez d'accéder à <a href="api/php-execution-test.php">api/php-execution-test.php</a> directement</li>
            <li>Consultez <a href="api/server-fix.php">api/server-fix.php</a> pour des corrections automatiques</li>
        </ol>
    </div>
    
    <p><a href="index.html">Retour à l'application</a></p>
</body>
</html>
