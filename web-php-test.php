
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test d'exécution PHP via Web</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Test d'exécution PHP via Web</h1>
    
    <div>
        <h2>Informations PHP</h2>
        <?php
        echo "<p><span class='success'>PHP fonctionne!</span></p>";
        echo "<p>Version PHP: " . phpversion() . "</p>";
        echo "<p>Date et heure du serveur: " . date('Y-m-d H:i:s') . "</p>";
        echo "<p>Serveur: " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
        
        // Vérifier si nous sommes sur Infomaniak
        $isInfomaniak = strpos($_SERVER['DOCUMENT_ROOT'] ?? '', '/home/clients') !== false;
        echo "<p>Détecté comme Infomaniak: " . ($isInfomaniak ? "Oui" : "Non") . "</p>";
        
        // Vérifier les chemins
        echo "<p>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
        echo "<p>Chemin du script: " . $_SERVER['SCRIPT_FILENAME'] . "</p>";
        
        // Tester l'accès au fichier de configuration
        $configFile = __DIR__ . '/api/config/db_config.json';
        echo "<p>Test d'accès au fichier de configuration: ";
        if (file_exists($configFile)) {
            echo "<span class='success'>Le fichier existe</span>";
        } else {
            echo "<span class='error'>Le fichier n'existe pas</span>";
        }
        echo "</p>";
        
        // Extensions chargées
        echo "<h3>Extensions PHP chargées:</h3>";
        echo "<pre>" . implode(", ", get_loaded_extensions()) . "</pre>";
        ?>
    </div>
    
    <div>
        <h2>Configuration PHP (.user.ini)</h2>
        <?php
        $userIniFile = __DIR__ . '/.user.ini';
        if (file_exists($userIniFile)) {
            echo "<p><span class='success'>Fichier .user.ini trouvé</span></p>";
            echo "<pre>" . htmlspecialchars(file_get_contents($userIniFile)) . "</pre>";
        } else {
            echo "<p><span class='error'>Fichier .user.ini non trouvé</span></p>";
        }
        ?>
    </div>
    
    <div>
        <h2>Liens de diagnostic</h2>
        <ul>
            <li><a href="phpinfo.php">phpinfo()</a> - Informations PHP détaillées</li>
            <li><a href="api/phpinfo.php">api/phpinfo.php</a> - Informations PHP dans le dossier API</li>
            <li><a href="api/db-test.php">api/db-test.php</a> - Test de connexion à la base de données</li>
            <li><a href="user-diagnostic.php">user-diagnostic.php</a> - Diagnostic utilisateur</li>
        </ul>
    </div>
</body>
</html>
