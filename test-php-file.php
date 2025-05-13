
<!DOCTYPE html>
<html>
<head>
    <title>Test PHP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .code { background: #f5f5f5; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Test d'exécution PHP</h1>
    
    <div class="code">
    <?php
    // Ce code devrait s'exécuter si PHP fonctionne
    echo "PHP fonctionne! Heure serveur: " . date('Y-m-d H:i:s');
    ?>
    </div>
    
    <p>Si vous voyez du code PHP brut ci-dessus (commençant par &lt;?php), alors PHP n'est pas exécuté sur votre serveur.</p>
</body>
</html>
