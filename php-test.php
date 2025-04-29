
<?php
// Fichier de test simple pour vérifier l'exécution PHP
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test d'exécution PHP</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; }
        .error { color: red; }
    </style>
</head>
<body>
    <h1>Test d'exécution PHP</h1>
    
    <?php if(function_exists('phpversion')): ?>
        <div class="success">
            <h2>✅ PHP fonctionne correctement !</h2>
            <p>Version PHP: <?php echo phpversion(); ?></p>
            <p>Serveur: <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu'; ?></p>
            <p>Date et heure: <?php echo date('Y-m-d H:i:s'); ?></p>
        </div>
        
        <h3>Variables de serveur:</h3>
        <pre><?php print_r($_SERVER); ?></pre>
    <?php else: ?>
        <div class="error">
            <h2>❌ PHP ne fonctionne pas</h2>
            <p>Ce message s'affiche car le code PHP n'est pas interprété.</p>
        </div>
    <?php endif; ?>
    
    <p><a href="/api/test.php">Tester l'API</a> | <a href="/api/phpinfo.php">Voir phpinfo()</a></p>
</body>
</html>
