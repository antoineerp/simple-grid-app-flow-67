
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification Chemins Infomaniak</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f9; padding: 10px; border-radius: 4px; overflow: auto; }
        .section { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Vérification des Chemins Infomaniak</h1>
    
    <div class="section">
        <h2>Structure des chemins</h2>
        <?php
        // Informations sur le serveur
        echo "<p>Document Root: <code>" . $_SERVER['DOCUMENT_ROOT'] . "</code></p>";
        echo "<p>Script Path: <code>" . $_SERVER['SCRIPT_FILENAME'] . "</code></p>";
        echo "<p>Répertoire courant: <code>" . getcwd() . "</code></p>";
        
        // Vérification des chemins spécifiques à Infomaniak
        $paths_to_check = [
            '/home/clients/df8dceff557ccc0605d45e1581aa661b' => 'Chemin client Infomaniak',
            '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch' => 'Chemin site complet',
            '/sites/qualiopi.ch' => 'Chemin raccourci du site',
            'sites/qualiopi.ch' => 'Chemin relatif du site'
        ];
        
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
        echo "<tr><th>Chemin</th><th>Description</th><th>Existe</th></tr>";
        
        foreach ($paths_to_check as $path => $desc) {
            echo "<tr>";
            echo "<td><code>$path</code></td>";
            echo "<td>$desc</td>";
            if (is_dir($path)) {
                echo "<td class='success'>Oui</td>";
            } else {
                echo "<td class='error'>Non</td>";
            }
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>Auto Prepend File</h2>
        <?php
        $auto_prepend = ini_get('auto_prepend_file');
        echo "<p>Auto Prepend File: <code>" . ($auto_prepend ?: "Non défini") . "</code></p>";
        
        // Vérifier si le fichier existe
        if ($auto_prepend && file_exists($auto_prepend)) {
            echo "<p class='success'>Le fichier Auto Prepend existe</p>";
            echo "<pre>" . htmlspecialchars(file_get_contents($auto_prepend)) . "</pre>";
        } elseif ($auto_prepend) {
            echo "<p class='error'>Le fichier Auto Prepend n'existe pas: $auto_prepend</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Analyse du fichier .htaccess</h2>
        <?php
        if (file_exists('.htaccess')) {
            echo "<p class='success'>Le fichier .htaccess existe</p>";
            $content = file_get_contents('.htaccess');
            
            // Vérifier les chemins incorrects
            $incorrect_paths = [
                '/sites/qualiopi.ch',
                'sites/qualiopi.ch',
                '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch'
            ];
            
            $found = false;
            foreach ($incorrect_paths as $path) {
                if (strpos($content, $path) !== false) {
                    $found = true;
                    echo "<p class='warning'>Le fichier .htaccess contient le chemin $path qui pourrait causer des problèmes</p>";
                }
            }
            
            if (!$found) {
                echo "<p>Aucun chemin problématique trouvé dans .htaccess</p>";
            }
            
            echo "<pre>" . htmlspecialchars($content) . "</pre>";
        } else {
            echo "<p class='error'>Le fichier .htaccess n'existe pas</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Vérification PHP</h2>
        <?php
        echo "<p>PHP version: " . phpversion() . "</p>";
        
        // Vérifier s'il y a des erreurs PHP
        $error_log_paths = [
            './php_errors.log',
            './api/php_errors.log',
            '/tmp/php-errors.log',
            error_log()
        ];
        
        $found_log = false;
        foreach ($error_log_paths as $log) {
            if ($log && file_exists($log)) {
                $found_log = true;
                echo "<p class='warning'>Log d'erreurs trouvé: $log</p>";
                echo "<pre>" . htmlspecialchars(file_get_contents($log)) . "</pre>";
            }
        }
        
        if (!$found_log) {
            echo "<p>Aucun fichier de log d'erreurs trouvé</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Actions recommandées</h2>
        <?php
        // Proposer de corriger les chemins dans le fichier htaccess
        if (file_exists('.htaccess')) {
            echo "<p><a href='fix-htaccess.php' style='display:inline-block; background:#4CAF50; color:white; padding:10px 15px; text-decoration:none; border-radius:5px;'>Corriger les chemins dans .htaccess</a></p>";
        }
        
        // Proposer d'accéder à l'index.html directement
        echo "<p><a href='index.html' style='display:inline-block; background:#2196F3; color:white; padding:10px 15px; text-decoration:none; border-radius:5px;'>Accéder à l'application</a></p>";
        ?>
    </div>
</body>
</html>
