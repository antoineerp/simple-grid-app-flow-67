
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test PHP Web</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { background-color: #f5f5f5; padding: 10px; border-left: 4px solid #2196F3; }
        .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Test d'exécution PHP via Web</h1>
    
    <div class="section">
        <h2>Informations PHP</h2>
        <p>Date et heure: <?php echo date('Y-m-d H:i:s'); ?></p>
        <p>Version PHP: <?php echo phpversion(); ?></p>
        <p>Serveur: <?php echo $_SERVER['SERVER_SOFTWARE']; ?></p>
        <p>Document Root: <?php echo $_SERVER['DOCUMENT_ROOT']; ?></p>
    </div>
    
    <div class="section">
        <h2>Test des fichiers de configuration</h2>
        <?php
        // Vérifier si .user.ini existe
        $user_ini = './.user.ini';
        if (file_exists($user_ini)) {
            echo "<p class='success'>.user.ini existe et a été trouvé</p>";
            echo "<pre>" . htmlspecialchars(file_get_contents($user_ini)) . "</pre>";
        } else {
            echo "<p class='error'>.user.ini n'existe pas à l'emplacement actuel</p>";
        }
        
        // Vérifier si .htaccess existe
        $htaccess = './.htaccess';
        if (file_exists($htaccess)) {
            echo "<p class='success'>.htaccess existe et a été trouvé</p>";
            echo "<p>Taille: " . filesize($htaccess) . " octets</p>";
        } else {
            echo "<p class='error'>.htaccess n'existe pas à l'emplacement actuel</p>";
        }
        
        // Vérifier la structure des dossiers
        echo "<h3>Structure des dossiers:</h3>";
        $directories = [
            './api' => 'API',
            './assets' => 'Assets',
            './public' => 'Public'
        ];
        
        foreach ($directories as $dir => $name) {
            echo "<p>$name ($dir): ";
            if (is_dir($dir)) {
                echo "<span class='success'>OK</span>";
            } else {
                echo "<span class='error'>NON TROUVÉ</span>";
            }
            echo "</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Vérification des types MIME</h2>
        <p>Le serveur doit être configuré pour servir les fichiers CSS et JavaScript avec les types MIME corrects.</p>
        <?php
        echo "<p>Contenu de .htaccess lié aux types MIME:</p>";
        if (file_exists($htaccess)) {
            $content = file_get_contents($htaccess);
            if (preg_match_all('/AddType\s+([^\s]+)\s+([^\s]+)/', $content, $matches)) {
                echo "<ul>";
                for ($i = 0; $i < count($matches[0]); $i++) {
                    echo "<li>" . htmlspecialchars($matches[0][$i]) . "</li>";
                }
                echo "</ul>";
                
                if (strpos($content, 'AddType text/css .css') !== false) {
                    echo "<p class='success'>Le type MIME pour CSS est correctement configuré</p>";
                } else {
                    echo "<p class='error'>Le type MIME pour CSS n'est PAS configuré correctement</p>";
                }
            } else {
                echo "<p class='error'>Aucune directive AddType trouvée dans .htaccess</p>";
            }
        }
        ?>
    </div>
    
    <p class="info">Si vous voyez cette page, cela signifie que PHP fonctionne correctement sur votre serveur web.</p>
</body>
</html>
