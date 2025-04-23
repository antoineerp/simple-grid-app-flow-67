
<?php
// Fichier horodaté pour vérifier facilement le déploiement
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification de Déploiement</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Vérification de Déploiement FormaCert</h1>
    
    <div class="section">
        <h2>1. Exécution PHP</h2>
        <p>PHP fonctionne: <span class="success">OUI</span></p>
        <p>Version PHP: <?php echo phpversion(); ?></p>
        <p>Serveur: <?php echo $_SERVER['SERVER_SOFTWARE']; ?></p>
        <p>Date et heure: <?php echo date('Y-m-d H:i:s'); ?></p>
    </div>
    
    <div class="section">
        <h2>2. Tests et Diagnostics</h2>
        <ul>
            <li><a href="/index-fixer.php">Vérifier/corriger les références d'assets</a></li>
            <li><a href="/api/infomaniak-check.php">Vérifier l'API</a></li>
            <li><a href="/deploy-check.php">Diagnostic complet</a></li>
        </ul>
    </div>
    
    <div class="section">
        <h2>3. Accès à l'Application</h2>
        <p><a href="/" style="padding: 10px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Accéder à l'application</a></p>
    </div>
</body>
</html>
