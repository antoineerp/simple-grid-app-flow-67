
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test PHP Simple</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    </style>
</head>
<body>
    <h1>Test d'exécution PHP</h1>
    
    <?php
    echo "<p>PHP fonctionne correctement!</p>";
    echo "<p>Version PHP: " . phpversion() . "</p>";
    echo "<p>Date et heure du serveur: " . date('Y-m-d H:i:s') . "</p>";
    echo "<p>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
    ?>
    
    <p><a href="check-infomaniak.php">Retour à la vérification</a></p>
</body>
</html>
