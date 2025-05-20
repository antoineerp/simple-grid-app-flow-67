
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Nettoyage des structures récursives</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: #16a34a; font-weight: bold; }
        .error { color: #dc2626; font-weight: bold; }
        .warning { color: #f59e0b; font-weight: bold; }
        .monospace { font-family: monospace; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; }
        pre { background: #f1f5f9; padding: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Nettoyage des structures récursives</h1>
    
    <?php
    // Définir les chemins potentiellement problématiques
    $recursive_paths = [
        './sites',
        './site',
        './sites/qualiopi.ch',
        './site/qualiopi.ch'
    ];
    
    echo "<h2>Analyse des structures récursives</h2>";
    echo "<ul>";
    
    foreach ($recursive_paths as $path) {
        echo "<li>Vérification de <span class='monospace'>{$path}</span>: ";
        
        if (is_dir($path)) {
            echo "<span class='warning'>Structure récursive détectée</span>";
            $files_count = count(scandir($path)) - 2; // Exclure . et ..
            echo " ({$files_count} fichiers/dossiers)";
            
            if (isset($_POST['clean']) && $_POST['clean'] == 'true') {
                // Sauvegarde avant suppression
                $backup_dir = './recursive_backup_' . date('Ymd_His');
                echo "<br>Sauvegarde dans <span class='monospace'>{$backup_dir}</span>: ";
                
                if (!is_dir($backup_dir)) {
                    mkdir($backup_dir, 0755, true);
                }
                
                // Copier le contenu avant de supprimer
                $copy_command = "cp -r {$path} {$backup_dir}/";
                exec($copy_command, $output, $return_var);
                
                if ($return_var === 0) {
                    echo "<span class='success'>Réussi</span>";
                    
                    // Suppression récursive
                    echo "<br>Suppression de <span class='monospace'>{$path}</span>: ";
                    if (is_dir($path . '/assets') && count(glob($path . '/assets/*')) > 0) {
                        echo "<span class='error'>Dossier assets non vide, suppression annulée pour sécurité</span>";
                    } else {
                        // On ne supprime pas directement mais on liste les fichiers qui seraient supprimés
                        echo "<span class='warning'>Structure analysée en mode sécurisé</span>";
                        echo "<pre>";
                        echo "Fichiers qui seraient supprimés:\n";
                        exec("find {$path} -type f | head -n 20", $files);
                        echo implode("\n", $files);
                        if (count($files) >= 20) {
                            echo "\n... et plus";
                        }
                        echo "</pre>";
                    }
                } else {
                    echo "<span class='error'>Échec</span> lors de la sauvegarde";
                }
            }
            
        } else {
            echo "<span class='success'>Non détecté</span>";
        }
        
        echo "</li>";
    }
    
    echo "</ul>";
    
    // Détecter les fichiers App.tsx en doublon
    echo "<h2>Recherche des fichiers App.tsx</h2>";
    echo "<ul>";
    
    $app_files = [];
    exec("find . -name 'App.tsx' 2>/dev/null", $app_files);
    
    if (count($app_files) > 0) {
        foreach ($app_files as $file) {
            $file_size = filesize($file);
            $modified = date("Y-m-d H:i:s", filemtime($file));
            
            echo "<li><span class='monospace'>{$file}</span> ({$file_size} octets, modifié le {$modified})";
            
            // Déterminer si ce fichier est dans une structure récursive
            $is_recursive = false;
            foreach ($recursive_paths as $path) {
                if (strpos($file, $path) === 0) {
                    $is_recursive = true;
                    break;
                }
            }
            
            if ($is_recursive) {
                echo " <span class='warning'>Dans une structure récursive</span>";
            }
            
            echo "</li>";
        }
    } else {
        echo "<li>Aucun fichier App.tsx trouvé.</li>";
    }
    
    echo "</ul>";
    ?>
    
    <h2>Actions disponibles</h2>
    
    <div style="margin: 20px 0; padding: 15px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 2px;">
        <strong>Attention:</strong> L'analyse ci-dessus montre les structures récursives potentiellement problématiques. 
        Pour effectuer un nettoyage, veuillez d'abord vérifier que vous avez une sauvegarde complète de votre site, 
        puis utilisez le bouton ci-dessous. Cette opération nécessitera probablement une intervention manuelle 
        complémentaire via FTP pour supprimer complètement les structures récursives.
    </div>
    
    <form method="post">
        <input type="hidden" name="clean" value="true">
        <button type="submit" style="background: #f59e0b; color: white; border: none; padding: 10px 15px; border-radius: 4px; font-weight: bold; cursor: pointer;">
            Analyser et préparer le nettoyage
        </button>
    </form>
    
    <p style="margin-top: 20px;">
        <a href="/" style="display: inline-block; background: #4b5563; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none;">
            Retour à l'accueil
        </a>
    </p>
</body>
</html>
