
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic .htaccess</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Diagnostic du fichier .htaccess</h1>
    
    <?php
    // Vérifier si le fichier .htaccess existe
    if (file_exists('.htaccess')) {
        echo "<p class='success'>Le fichier .htaccess existe.</p>";
        
        // Afficher le contenu du fichier
        echo "<h2>Contenu du fichier .htaccess :</h2>";
        echo "<pre>" . htmlspecialchars(file_get_contents('.htaccess')) . "</pre>";
        
        // Vérifier le module de réécriture
        echo "<h2>Vérification de la configuration :</h2>";
        echo "<p>RewriteEngine: " . (function_exists('apache_get_modules') && in_array('mod_rewrite', apache_get_modules()) ? 
            "<span class='success'>Activé</span>" : "<span class='error'>Statut inconnu</span>") . "</p>";
        
        // Vérifier le chemin actuel
        echo "<p>Chemin de la requête: <code>" . htmlspecialchars($_SERVER['REQUEST_URI']) . "</code></p>";
        
        // Afficher quelques variables d'environnement importantes
        echo "<h2>Variables d'environnement :</h2>";
        echo "<p>REDIRECT_STATUS: <code>" . (isset($_SERVER['REDIRECT_STATUS']) ? htmlspecialchars($_SERVER['REDIRECT_STATUS']) : 'Non défini') . "</code></p>";
        echo "<p>REQUEST_METHOD: <code>" . htmlspecialchars($_SERVER['REQUEST_METHOD']) . "</code></p>";
        echo "<p>DOCUMENT_ROOT: <code>" . htmlspecialchars($_SERVER['DOCUMENT_ROOT']) . "</code></p>";
    } else {
        echo "<p class='error'>Le fichier .htaccess n'existe pas dans le répertoire actuel.</p>";
    }
    ?>
    
    <h2>Recommandations :</h2>
    <ul>
        <li>Assurez-vous que <code>mod_rewrite</code> est activé sur votre serveur Apache</li>
        <li>Vérifiez que <code>AllowOverride All</code> est défini dans la configuration de votre serveur</li>
        <li>Pour résoudre les problèmes de redirections infinies, utilisez la condition <code>RewriteCond %{ENV:REDIRECT_STATUS} ^$</code></li>
        <li>Évitez les règles qui pourraient entrer en conflit ou créer des boucles</li>
    </ul>
</body>
</html>
