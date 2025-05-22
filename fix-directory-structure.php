
<?php
header('Content-Type: text/html; charset=utf-8');
require_once 'utils-directory.php';
require_once 'utils-assets.php';
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction de la Structure des Dossiers</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Correction de la Structure des Dossiers</h1>
    
    <div class="section">
        <h2>État actuel</h2>
        <?php
        $directories = [
            './' => 'Répertoire racine',
            './dist' => 'Dossier dist',
            './dist/assets' => 'Dossier dist/assets',
            './assets' => 'Dossier assets'
        ];
        
        foreach ($directories as $dir => $label) {
            $files_count = check_directory($dir);
            echo "<p>$label ($dir): ";
            if ($files_count !== false) {
                echo "<span class='success'>EXISTE</span> ($files_count fichiers/dossiers)";
            } else {
                echo "<span class='error'>N'EXISTE PAS</span>";
            }
            echo "</p>";
        }
        
        $fixes_needed = [];
        
        // Vérifier si le dossier assets existe à la racine
        if (!is_dir('./assets') && is_dir('./dist/assets')) {
            $fixes_needed[] = [
                'type' => 'copy_directory',
                'src' => './dist/assets',
                'dst' => './assets',
                'description' => 'Créer le dossier assets à la racine et y copier les fichiers depuis dist/assets'
            ];
        }
        
        // Vérifier si index.html existe
        if (!file_exists('./index.html') && file_exists('./dist/index.html')) {
            $fixes_needed[] = [
                'type' => 'copy_file',
                'src' => './dist/index.html',
                'dst' => './index.html',
                'description' => 'Copier index.html depuis dist/ vers la racine'
            ];
        }
        ?>
    </div>
    
    <?php if (!empty($fixes_needed)): ?>
    <div class="section">
        <h2>Corrections nécessaires</h2>
        <ul>
            <?php foreach ($fixes_needed as $fix): ?>
                <li><?php echo $fix['description']; ?></li>
            <?php endforeach; ?>
        </ul>
        
        <?php if (isset($_POST['fix_structure'])): ?>
            <h3>Application des corrections...</h3>
            <?php
            foreach ($fixes_needed as $fix) {
                echo "<p>• {$fix['description']}: ";
                
                if ($fix['type'] === 'copy_directory') {
                    if (move_directory_contents($fix['src'], $fix['dst'])) {
                        echo "<span class='success'>RÉUSSI</span>";
                    } else {
                        echo "<span class='error'>ÉCHEC</span>";
                    }
                } else if ($fix['type'] === 'copy_file') {
                    if (copy($fix['src'], $fix['dst'])) {
                        echo "<span class='success'>RÉUSSI</span>";
                    } else {
                        echo "<span class='error'>ÉCHEC</span>";
                    }
                }
                
                echo "</p>";
            }
            ?>
            <p>Corrections terminées. <a href="check-assets-deployment.php">Vérifier le déploiement</a></p>
        <?php else: ?>
            <form method="post">
                <input type="hidden" name="fix_structure" value="1">
                <button type="submit" class="fix-button">Appliquer les corrections</button>
            </form>
        <?php endif; ?>
    </div>
    <?php else: ?>
    <div class="section">
        <h2>Aucune correction nécessaire</h2>
        <p><span class='success'>La structure des dossiers semble correcte.</span></p>
        <p>Si vous rencontrez toujours des problèmes, vérifiez les références dans index.html avec <a href="fix-index-references.php">l'outil de correction des références</a>.</p>
    </div>
    <?php endif; ?>
    
    <div class="section">
        <h2>Étapes suivantes</h2>
        <ol>
            <li>Vérifiez que les fichiers dans <code>assets/</code> sont correctement référencés dans <code>index.html</code></li>
            <li>Si nécessaire, utilisez <a href="fix-index-references.php">l'outil de correction des références</a> pour mettre à jour index.html</li>
            <li>Videz le cache de votre navigateur et testez à nouveau l'application</li>
            <li>Si des problèmes persistent, utilisez <a href="check-assets-deployment.php">l'outil de diagnostic complet</a></li>
        </ol>
    </div>
</body>
</html>
