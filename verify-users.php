
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des fichiers utilisateur</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Vérification des fichiers utilisateur</h1>
    
    <div class="section">
        <h2>Vérification de users.ini</h2>
        <?php
        $usersFile = __DIR__ . '/users.ini';
        
        if (file_exists($usersFile)) {
            echo "<p class='success'>Fichier users.ini trouvé à la racine</p>";
            
            // Afficher les permissions
            $perms = substr(sprintf('%o', fileperms($usersFile)), -4);
            echo "<p>Permissions: $perms</p>";
            
            // Vérifier si le fichier est lisible
            if (is_readable($usersFile)) {
                echo "<p class='success'>Le fichier users.ini est lisible</p>";
                
                // Compter les utilisateurs
                $users = parse_ini_file($usersFile);
                if ($users !== false) {
                    $userCount = count($users);
                    echo "<p>$userCount utilisateurs trouvés dans le fichier</p>";
                } else {
                    echo "<p class='error'>Erreur lors de la lecture du fichier users.ini</p>";
                }
            } else {
                echo "<p class='error'>Le fichier users.ini n'est pas lisible</p>";
            }
        } else {
            echo "<p class='error'>Fichier users.ini INTROUVABLE à la racine</p>";
            
            // Rechercher le fichier dans les sous-répertoires
            echo "<p>Recherche du fichier users.ini dans les sous-répertoires...</p>";
            
            $found = false;
            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator(__DIR__, RecursiveDirectoryIterator::SKIP_DOTS),
                RecursiveIteratorIterator::SELF_FIRST
            );
            
            foreach ($iterator as $path => $fileInfo) {
                if ($fileInfo->getFilename() === 'users.ini') {
                    echo "<p class='warning'>Fichier users.ini trouvé à: " . $path . "</p>";
                    $found = true;
                }
            }
            
            if (!$found) {
                echo "<p>Aucun fichier users.ini trouvé dans les sous-répertoires</p>";
            }
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Vérification des en-têtes HTTP</h2>
        <?php
        $headers = [
            'X-Content-Type-Options' => ['nosniff'],
            'Content-Type' => ['text/html; charset=utf-8'],
            'Cache-Control' => ['public, max-age=0, must-revalidate'],
            'Content-Security-Policy' => ['frame-ancestors \'self\'']
        ];
        
        echo "<p>Les en-têtes suivants devraient être configurés dans .htaccess:</p>";
        echo "<ul>";
        foreach ($headers as $header => $values) {
            echo "<li>$header: " . implode(", ", $values) . "</li>";
        }
        echo "</ul>";
        
        echo "<p>Vous pouvez utiliser des outils comme <a href='https://securityheaders.com/' target='_blank'>securityheaders.com</a> ou les outils de développement du navigateur pour vérifier les en-têtes renvoyés par votre site.</p>";
        ?>
    </div>
    
    <div class="section">
        <h2>Actions à effectuer</h2>
        <ol>
            <li>Vérifier que le fichier users.ini est bien présent à la racine</li>
            <li>S'assurer que les permissions sont correctes (600 ou 640 recommandé)</li>
            <li>Vérifier que .htaccess bloque l'accès direct au fichier users.ini</li>
            <li>Tester les en-têtes HTTP après le déploiement</li>
        </ol>
    </div>
    
    <p>
        <a href="/" style="display:inline-block; background:#607D8B; color:white; padding:10px 15px; text-decoration:none; border-radius:5px;">Retour à la page d'accueil</a>
    </p>
</body>
</html>
