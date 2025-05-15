
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>JavaScript MIME Type Checker</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>JavaScript MIME Type Checker</h1>
    
    <div class="test-section">
        <h2>Test de chargement des modules</h2>
        <div id="module-test-result">Test en cours...</div>
        
        <script type="module">
            document.getElementById('module-test-result').innerHTML = '<span class="success">✓ Module JavaScript chargé avec succès!</span>';
        </script>
    </div>
    
    <div class="test-section">
        <h2>Vérification des en-têtes</h2>
        <div id="headers-result">Chargement des résultats...</div>
        
        <script>
            // Fonction pour tester les en-têtes HTTP
            async function checkHeaders() {
                try {
                    const response = await fetch('/assets/index.js?t=' + new Date().getTime());
                    const contentType = response.headers.get('content-type');
                    const status = response.status;
                    
                    let result = `<p>Status: ${status}</p>`;
                    result += `<p>Content-Type: <span class="${contentType && contentType.includes('javascript') ? 'success' : 'error'}">${contentType || 'Non défini'}</span></p>`;
                    
                    document.getElementById('headers-result').innerHTML = result;
                } catch (error) {
                    document.getElementById('headers-result').innerHTML = `<p class="error">Erreur lors du test: ${error.message}</p>`;
                }
            }
            
            // Exécuter le test des en-têtes
            checkHeaders();
        </script>
    </div>
    
    <div class="test-section">
        <h2>Information du serveur</h2>
        <?php
        echo "<p>PHP version: " . phpversion() . "</p>";
        echo "<p>Serveur web: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible') . "</p>";
        
        // Vérifier si le fichier .htaccess est correctement appliqué
        echo "<p>Vérification des fichiers de configuration:</p>";
        echo "<ul>";
        echo "<li>.htaccess racine: " . (file_exists('.htaccess') ? '<span class="success">Existe</span>' : '<span class="error">Manquant</span>') . "</li>";
        echo "<li>assets/.htaccess: " . (file_exists('assets/.htaccess') ? '<span class="success">Existe</span>' : '<span class="error">Manquant</span>') . "</li>";
        echo "</ul>";
        ?>
    </div>
    
    <div class="test-section">
        <h2>Que faire si le problème persiste</h2>
        <ol>
            <li>Vérifiez que le module <code>mod_headers</code> est activé sur votre serveur Apache</li>
            <li>Assurez-vous que les fichiers .htaccess ne sont pas ignorés (AllowOverride All doit être configuré)</li>
            <li>Si vous utilisez un CDN ou un proxy, vérifiez qu'il ne modifie pas les en-têtes HTTP</li>
            <li>Essayez de forcer le type MIME dans les balises script: <code>&lt;script type="application/javascript" src="..."&gt;&lt;/script&gt;</code></li>
            <li>Contactez votre hébergeur (Infomaniak) pour vérifier la configuration du serveur</li>
        </ol>
    </div>
</body>
</html>
