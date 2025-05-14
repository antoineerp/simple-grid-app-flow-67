
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
        .section { background-color: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        pre { background: #eee; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Test d'exécution PHP via navigateur</h1>
    
    <div class="section">
        <h2>Informations PHP</h2>
        <p>Date et heure: <strong><?php echo date('Y-m-d H:i:s'); ?></strong></p>
        <p>Version PHP: <strong><?php echo phpversion(); ?></strong></p>
        <p>Interface SAPI: <strong><?php echo php_sapi_name(); ?></strong></p>
        <p>Extensions chargées: <?php echo count(get_loaded_extensions()); ?> extensions</p>
    </div>
    
    <div class="section">
        <h2>Chemins du système</h2>
        <p>Document Root: <strong><?php echo $_SERVER['DOCUMENT_ROOT']; ?></strong></p>
        <p>Script Filename: <strong><?php echo $_SERVER['SCRIPT_FILENAME']; ?></strong></p>
        <p>Répertoire actuel: <strong><?php echo getcwd(); ?></strong></p>
        <p>Chemin du fichier: <strong><?php echo __FILE__; ?></strong></p>
    </div>
    
    <div class="section">
        <h2>Fichiers importants</h2>
        <?php
        $important_files = [
            '.htaccess' => 'Configuration Apache',
            'index.html' => 'Page principale',
            'index.php' => 'Point d\'entrée PHP',
            '.user.ini' => 'Configuration PHP',
            'users.ini' => 'Fichier utilisateurs',
            'api/index.php' => 'Point d\'entrée API'
        ];
        
        echo "<ul>";
        foreach ($important_files as $file => $desc) {
            echo "<li>$file: ";
            if (file_exists($file)) {
                echo "<span class='success'>Existe</span>";
            } else {
                echo "<span class='error'>N'existe pas</span>";
            }
            echo " - $desc</li>";
        }
        echo "</ul>";
        ?>
    </div>
    
    <div class="section">
        <h2>Vérification des MIME types</h2>
        <?php
        // Tester la configuration MIME pour les fichiers CSS et JS
        $mime_types = [
            '.css' => 'text/css',
            '.js' => 'application/javascript'
        ];
        
        echo "<p>Configuration des types MIME dans le .htaccess:</p>";
        if (file_exists('.htaccess')) {
            $htaccess = file_get_contents('.htaccess');
            echo "<pre>" . htmlspecialchars(preg_grep('/AddType|ForceType/', file('.htaccess'))) . "</pre>";
        } else {
            echo "<p class='error'>Fichier .htaccess non trouvé</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Test de génération de JSON</h2>
        <?php
        $test_array = [
            'success' => true,
            'message' => 'Test JSON réussi',
            'timestamp' => time(),
            'php_version' => phpversion()
        ];
        
        echo "<p>Voici un exemple de JSON généré par PHP:</p>";
        echo "<pre>" . htmlspecialchars(json_encode($test_array, JSON_PRETTY_PRINT)) . "</pre>";
        ?>
    </div>
    
    <p>Ce test confirme que PHP fonctionne correctement sur votre serveur via le web.</p>
    
    <p>
        <a href="/" style="display:inline-block; background:#607D8B; color:white; padding:10px 15px; text-decoration:none; border-radius:5px;">Retour à la page d'accueil</a>
    </p>
</body>
</html>
