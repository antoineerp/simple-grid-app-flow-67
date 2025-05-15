
<?php
header("Content-Type: text/html; charset=utf-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test d'exécution PHP - Directives .htaccess</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .code { background: #f4f4f4; padding: 10px; border-radius: 5px; font-family: monospace; }
    </style>
</head>
<body>
    <h1>Test d'exécution PHP après correction des directives .htaccess</h1>
    
    <div class="success">
        <p>✓ PHP s'exécute correctement!</p>
        <p>Date et heure du serveur: <?php echo date("Y-m-d H:i:s"); ?></p>
        <p>Version PHP: <?php echo phpversion(); ?></p>
    </div>
    
    <h2>En-têtes HTTP</h2>
    <div class="code">
        <p>Content-Type: <?php echo $_SERVER['CONTENT_TYPE'] ?? 'Non défini'; ?></p>
        <p>PHP_SELF: <?php echo $_SERVER['PHP_SELF']; ?></p>
        <p>SCRIPT_NAME: <?php echo $_SERVER['SCRIPT_NAME']; ?></p>
    </div>
    
    <h2>Configuration du serveur</h2>
    <div class="code">
        <p>SERVER_SOFTWARE: <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Non défini'; ?></p>
        <p>DOCUMENT_ROOT: <?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Non défini'; ?></p>
        <p>SCRIPT_FILENAME: <?php echo $_SERVER['SCRIPT_FILENAME'] ?? 'Non défini'; ?></p>
    </div>
    
    <h2>Test de configuration PHP</h2>
    <?php
    // Vérifier configuration PHP
    if (function_exists('apache_get_modules')) {
        echo "<p>Modules Apache disponibles: " . implode(", ", array_slice(apache_get_modules(), 0, 5)) . "...</p>";
    } else {
        echo "<p class='error'>La fonction apache_get_modules() n'est pas disponible. PHP fonctionne probablement en mode CGI/FastCGI.</p>";
    }
    ?>
    
    <p><a href="/">Retour à l'accueil</a></p>
</body>
</html>
