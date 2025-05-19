
<?php
// Script de création des dossiers requis après déploiement
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Création de la structure de dossiers</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 3px solid green; margin-bottom: 10px; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 3px solid red; margin-bottom: 10px; }
        .warning { color: orange; background-color: #fffbf0; padding: 10px; border-left: 3px solid orange; margin-bottom: 10px; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Création de la structure de dossiers</h1>
    
    <?php
    // Liste des dossiers à créer
    $directories = [
        './api',
        './api/config',
        './api/utils',
        './api/documentation',
        './api/admin',
        './api/logs',
        './assets',
        './public',
        './public/lovable-uploads'
    ];
    
    // Créer les dossiers
    foreach ($directories as $dir) {
        if (!is_dir($dir)) {
            if (mkdir($dir, 0755, true)) {
                echo "<div class='success'>✅ Dossier créé avec succès : $dir</div>";
            } else {
                echo "<div class='error'>❌ Impossible de créer le dossier : $dir</div>";
            }
        } else {
            echo "<div class='warning'>⚠️ Le dossier existe déjà : $dir</div>";
        }
    }
    
    // Créer des fichiers essentiels
    $files = [
        './api/admin/.htaccess' => '# Fichier htaccess pour admin',
        './api/documentation/README.md' => "# Documentation API\n\nCe dossier contient la documentation de l'API FormaCert."
    ];
    
    foreach ($files as $file => $content) {
        if (!file_exists($file)) {
            if (file_put_contents($file, $content)) {
                echo "<div class='success'>✅ Fichier créé avec succès : $file</div>";
            } else {
                echo "<div class='error'>❌ Impossible de créer le fichier : $file</div>";
            }
        } else {
            echo "<div class='warning'>⚠️ Le fichier existe déjà : $file</div>";
        }
    }
    ?>
    
    <h2>Structure actuelle</h2>
    <pre><?php
    function list_directories($path = '.', $indent = 0) {
        $files = scandir($path);
        $output = '';
        
        foreach ($files as $file) {
            if ($file != '.' && $file != '..') {
                $full_path = $path . '/' . $file;
                
                if (is_dir($full_path)) {
                    $output .= str_repeat('  ', $indent) . '📁 ' . $file . "\n";
                    $output .= list_directories($full_path, $indent + 1);
                }
            }
        }
        
        return $output;
    }
    
    echo list_directories('.');
    ?></pre>
    
    <p>
        <a href="/" style="display: inline-block; background: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Retour à l'accueil</a>
    </p>
</body>
</html>
