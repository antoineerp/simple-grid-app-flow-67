
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Création des dossiers manquants</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: #16a34a; font-weight: bold; }
        .error { color: #dc2626; font-weight: bold; }
        .monospace { font-family: monospace; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; }
        pre { background: #f1f5f9; padding: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Création des dossiers manquants</h1>
    
    <?php
    // Définir les dossiers à créer
    $directories = [
        '/sites/qualiopi.ch/api/admin',
        '/sites/qualiopi.ch/api-tools',
        '/sites/qualiopi.ch/api/documentation'
    ];
    
    echo "<h2>Tentative de création des dossiers</h2>";
    echo "<ul>";
    
    foreach ($directories as $dir) {
        echo "<li>Création de <span class='monospace'>{$dir}</span>: ";
        
        if (is_dir($dir)) {
            echo "<span class='success'>Le dossier existe déjà</span>";
        } else {
            $success = @mkdir($dir, 0755, true);
            if ($success) {
                echo "<span class='success'>Réussi</span>";
            } else {
                echo "<span class='error'>Échec</span> - " . error_get_last()['message'];
                
                // Essayer avec une méthode alternative
                echo "<br>Tentative alternative: ";
                $dirPath = $_SERVER['DOCUMENT_ROOT'] . $dir;
                $success = @mkdir($dirPath, 0755, true);
                if ($success) {
                    echo "<span class='success'>Réussi avec le chemin absolu</span>";
                } else {
                    echo "<span class='error'>Échec</span> - " . error_get_last()['message'];
                }
            }
        }
        
        echo "</li>";
    }
    
    echo "</ul>";
    
    // Vérifier si les dossiers existent maintenant
    echo "<h2>Vérification après création</h2>";
    echo "<ul>";
    
    foreach ($directories as $dir) {
        echo "<li>Vérification de <span class='monospace'>{$dir}</span>: ";
        if (is_dir($dir)) {
            echo "<span class='success'>Le dossier existe</span>";
        } else {
            // Vérifier avec le chemin absolu
            $dirPath = $_SERVER['DOCUMENT_ROOT'] . $dir;
            if (is_dir($dirPath)) {
                echo "<span class='success'>Le dossier existe (chemin absolu)</span>";
            } else {
                echo "<span class='error'>Le dossier n'existe pas</span>";
            }
        }
        echo "</li>";
    }
    
    echo "</ul>";
    
    // Vérifier les permissions
    echo "<h2>Information sur le serveur</h2>";
    echo "<pre>";
    echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
    echo "Script Filename: " . $_SERVER['SCRIPT_FILENAME'] . "\n";
    echo "Current working directory: " . getcwd() . "\n";
    echo "PHP Version: " . phpversion() . "\n";
    echo "</pre>";
    
    echo "<p>Si les dossiers n'ont pas pu être créés automatiquement, veuillez les créer manuellement via FTP.</p>";
    ?>

    <h2>Actions supplémentaires</h2>
    <p>
        <a href="verify-paths.php" style="display: inline-block; background: #2563eb; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; margin-right: 10px;">
            Vérifier les chemins
        </a>
        <a href="/" style="display: inline-block; background: #4b5563; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none;">
            Retour à l'accueil
        </a>
    </p>
</body>
</html>

