
<?php
header("Content-Type: text/html; charset=utf-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test d'exécution PHP</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { background: #f4f4f4; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Test d'exécution PHP</h1>
    
    <div class="success">
        <p>PHP fonctionne correctement !</p>
        <p>Date et heure: <?php echo date("Y-m-d H:i:s"); ?></p>
    </div>
    
    <div class="info">
        <h2>Informations sur l'environnement</h2>
        <p>Version PHP: <?php echo phpversion(); ?></p>
        <p>SAPI: <?php echo php_sapi_name(); ?></p>
        <p>Serveur: <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'; ?></p>
        <p>Document Root: <?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible'; ?></p>
    </div>
    
    <h2>Extensions PHP chargées</h2>
    <ul>
        <?php 
        $extensions = get_loaded_extensions();
        sort($extensions);
        foreach (array_slice($extensions, 0, 20) as $ext) {
            echo "<li>$ext</li>";
        }
        if (count($extensions) > 20) {
            echo "<li>... et " . (count($extensions) - 20) . " autres</li>";
        }
        ?>
    </ul>
    
    <?php if (function_exists('mysqli_connect')): ?>
        <p class="success">L'extension mysqli est chargée (nécessaire pour MySQL)</p>
    <?php else: ?>
        <p class="error">L'extension mysqli n'est PAS chargée (problèmes potentiels avec MySQL)</p>
    <?php endif; ?>
    
    <?php if (function_exists('pdo_drivers')): ?>
        <p class="success">PDO est disponible avec les drivers: <?php echo implode(', ', pdo_drivers()); ?></p>
    <?php else: ?>
        <p class="error">PDO n'est pas disponible (problèmes potentiels avec les connexions à la base de données)</p>
    <?php endif; ?>
</body>
</html>
