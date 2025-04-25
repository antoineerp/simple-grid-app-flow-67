
<?php
// Page d'accueil pour les diagnostics
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic du site</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        .diagnostic-tools { background-color: #f5f5f5; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .diagnostic-tools a { display: block; margin-bottom: 10px; color: #2980b9; text-decoration: none; }
        .diagnostic-tools a:hover { text-decoration: underline; }
        .section { margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>Diagnostic du site FormaCert</h1>
    
    <div class="section">
        <h2>Outils de diagnostic disponibles</h2>
        <div class="diagnostic-tools">
            <a href="/api/system-check.php">Diagnostic système complet</a>
            <a href="/api/assets-check.php">Vérification des assets</a>
            <a href="/api/php-execution-test.php">Test d'exécution PHP</a>
            <a href="/api/cors-test.php">Test CORS</a>
            <a href="/fix-assets-runtime.php">Correction des références aux assets</a>
            <a href="/fix-index-references.php">Correction des références dans index.html</a>
        </div>
    </div>
    
    <div class="section">
        <h2>Informations système</h2>
        <ul>
            <li>Date du diagnostic: <?php echo date('Y-m-d H:i:s'); ?></li>
            <li>Version PHP: <?php echo phpversion(); ?></li>
            <li>Serveur: <?php echo $_SERVER['SERVER_SOFTWARE']; ?></li>
            <li>Domaine: <?php echo $_SERVER['HTTP_HOST']; ?></li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Actions recommandées</h2>
        <ol>
            <li>Exécutez le <a href="/api/system-check.php">diagnostic système complet</a> pour vérifier la configuration.</li>
            <li>Vérifiez les <a href="/api/assets-check.php">assets</a> pour vous assurer qu'ils sont correctement chargés.</li>
            <li>Utilisez l'outil de <a href="/fix-assets-runtime.php">correction des références aux assets</a> si nécessaire.</li>
        </ol>
    </div>
</body>
</html>
