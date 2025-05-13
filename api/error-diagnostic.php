
<?php
header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic d'erreur PHP</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2 { color: #e11d48; }
        .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
        pre { background: #f1f5f9; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .error { color: #e11d48; font-weight: 600; }
        .success { color: #16a34a; font-weight: 600; }
        .code { font-family: monospace; background-color: #f1f5f9; padding: 2px 4px; border-radius: 2px; }
    </style>
</head>
<body>
    <h1>Diagnostic d'erreur PHP</h1>
    
    <div class="card">
        <h2>⚠️ Une erreur PHP s'est produite</h2>
        <p>Cette page s'affiche lorsqu'une erreur interne du serveur (erreur 500) se produit.</p>
        
        <?php if (function_exists('error_get_last')): ?>
            <?php $error = error_get_last(); ?>
            <?php if ($error): ?>
                <h3>Dernière erreur enregistrée:</h3>
                <pre><?php print_r($error); ?></pre>
            <?php endif; ?>
        <?php endif; ?>
    </div>
    
    <div class="card">
        <h2>🔍 Diagnostic du serveur</h2>
        <ul>
            <li>Version PHP: <span class="code"><?php echo phpversion(); ?></span></li>
            <li>Serveur web: <span class="code"><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'; ?></span></li>
            <li>Document Root: <span class="code"><?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible'; ?></span></li>
            <li>URI demandée: <span class="code"><?php echo $_SERVER['REQUEST_URI'] ?? 'Non disponible'; ?></span></li>
            <li>Méthode de requête: <span class="code"><?php echo $_SERVER['REQUEST_METHOD'] ?? 'Non disponible'; ?></span></li>
            <li>Extensions PHP chargées: 
                <span class="code"><?php echo implode(', ', get_loaded_extensions()); ?></span>
            </li>
        </ul>
    </div>
    
    <div class="card">
        <h2>🛠️ Solutions possibles</h2>
        <ol>
            <li>Vérifiez les journaux d'erreur PHP pour plus de détails</li>
            <li>Assurez-vous que la configuration PHP sur votre serveur est correcte</li>
            <li>Contactez votre hébergeur (Infomaniak) si le problème persiste</li>
            <li>Essayez d'accéder à <a href="/api/phpinfo.php">phpinfo.php</a> pour vérifier votre configuration PHP</li>
            <li>Vérifiez que <span class="code">.htaccess</span> est correctement configuré</li>
        </ol>
    </div>
    
    <div class="card">
        <h2>🧪 Tests de base</h2>
        
        <h3>Test PHP simple:</h3>
        <?php
            $working = true;
            echo "<p class='success'>✅ PHP fonctionne - ce texte est généré par PHP</p>";
        ?>
        
        <h3>Test de fonction:</h3>
        <?php 
            function testFunction() {
                return "La fonction fonctionne!";
            }
            echo "<p class='success'>✅ " . testFunction() . "</p>";
        ?>
        
        <h3>Test d'accès aux fichiers:</h3>
        <?php
            $test_file = __DIR__ . '/php_errors.log';
            if (file_exists($test_file)) {
                echo "<p>Le fichier existe: " . $test_file . "</p>";
                if (is_readable($test_file)) {
                    echo "<p class='success'>✅ Le fichier est lisible</p>";
                } else {
                    echo "<p class='error'>❌ Le fichier n'est pas lisible</p>";
                }
            } else {
                echo "<p>Le fichier n'existe pas: " . $test_file . "</p>";
            }
        ?>
    </div>
</body>
</html>
