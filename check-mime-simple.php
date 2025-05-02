
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test Simple des Types MIME</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Test Simple des Types MIME JavaScript</h1>
    
    <h2>Test avec script standard</h2>
    <div id="test-standard">Test en cours...</div>
    
    <script>
        document.getElementById('test-standard').textContent = 'JavaScript standard fonctionne!';
        document.getElementById('test-standard').className = 'success';
    </script>
    
    <h2>Test avec script de type module</h2>
    <div id="test-module">Test en cours...</div>
    
    <script type="module">
        document.getElementById('test-module').textContent = 'JavaScript module fonctionne!';
        document.getElementById('test-module').className = 'success';
    </script>
    
    <h2>Test avec script externe</h2>
    <div id="test-external">Test en cours...</div>
    
    <script src="assets/check-mime.js"></script>
    
    <script>
        setTimeout(function() {
            if (window.console && window.console.logs && window.console.logs.includes('MIME type check passed successfully!')) {
                document.getElementById('test-external').textContent = 'Script externe chargé avec succès!';
                document.getElementById('test-external').className = 'success';
            } else {
                document.getElementById('test-external').textContent = 'Échec du chargement du script externe.';
                document.getElementById('test-external').className = 'error';
            }
        }, 1000);
    </script>
    
    <h2>Info Serveur</h2>
    <pre>
    <?php
    echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
    echo "PHP Version: " . phpversion() . "\n";
    
    // Vérifier les modules Apache chargés
    if (function_exists('apache_get_modules')) {
        echo "\nModules Apache chargés:\n";
        $modules = apache_get_modules();
        foreach (['mod_headers', 'mod_mime', 'mod_rewrite'] as $mod) {
            echo "- $mod: " . (in_array($mod, $modules) ? "OUI" : "NON") . "\n";
        }
    }
    ?>
    </pre>
    
    <p><a href="fix-mime-types.php">Exécuter l'outil de diagnostic complet</a></p>
</body>
</html>
