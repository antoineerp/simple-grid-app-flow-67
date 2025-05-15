
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic Utilisateur FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Diagnostic Utilisateur FormaCert</h1>
    
    <div class="section">
        <h2>Accès aux outils de diagnostics</h2>
        <ul>
            <li><a href="deploy-check.php">Vérification du déploiement</a></li>
            <li><a href="diagnose-infomaniak.php">Diagnostic Infomaniak</a></li>
            <li><a href="verify-deploy.php">Vérification alternative</a></li>
            <li><a href="fix-infomaniak-assets.php">Correction des chemins d'assets</a></li>
            <li><a href="deploy-on-infomaniak.php">Déploiement manuel</a></li>
        </ul>
    </div>

    <div class="section">
        <h2>Informations Système</h2>
        <?php
        echo "<p>PHP Version: " . phpversion() . "</p>";
        echo "<p>Serveur Web: " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
        echo "<p>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
        echo "<p>Chemin actuel: " . getcwd() . "</p>";
        echo "<p>URL actuelle: " . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] . "</p>";
        ?>
    </div>
    
    <div class="section">
        <h2>Configuration des chemins Infomaniak</h2>
        <?php
        $expected_paths = [
            '/home/customers/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch',
            '/sites/qualiopi.ch'
        ];
        
        echo "<p>Vérification des chemins critiques:</p>";
        echo "<ul>";
        foreach ($expected_paths as $path) {
            echo "<li>$path: ";
            if (file_exists($path)) {
                echo "<span class='success'>Existe</span>";
            } else {
                echo "<span class='error'>N'existe pas</span>";
            }
            echo "</li>";
        }
        echo "</ul>";
        ?>
    </div>
    
    <div class="section">
        <h2>Contrôle des fichiers essentiels</h2>
        <?php
        $essential_files = [
            '.htaccess' => 'Configuration Apache',
            'index.html' => 'Page principale',
            'api/index.php' => 'Point d\'entrée API',
            'api/login-test.php' => 'Test de connexion',
            'api/config/db_config.json' => 'Configuration base de données'
        ];
        
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
        echo "<tr><th>Fichier</th><th>Description</th><th>Statut</th></tr>";
        
        foreach ($essential_files as $file => $desc) {
            echo "<tr>";
            echo "<td>$file</td>";
            echo "<td>$desc</td>";
            echo "<td>";
            
            if (file_exists($file)) {
                echo "<span class='success'>Existe</span> (" . filesize($file) . " octets)";
            } else {
                echo "<span class='error'>Manquant</span>";
            }
            
            echo "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>Structure des dossiers</h2>
        <?php
        $directories = [
            '.' => 'Racine',
            './api' => 'API',
            './assets' => 'Assets',
            './public' => 'Public',
            './public/lovable-uploads' => 'Uploads'
        ];
        
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
        echo "<tr><th>Dossier</th><th>Description</th><th>Statut</th><th>Contenu</th></tr>";
        
        foreach ($directories as $dir => $desc) {
            echo "<tr>";
            echo "<td>$dir</td>";
            echo "<td>$desc</td>";
            
            if (is_dir($dir)) {
                $files = scandir($dir);
                $count = count($files) - 2; // Moins . et ..
                echo "<td><span class='success'>Existe</span></td>";
                echo "<td>$count fichiers/dossiers</td>";
            } else {
                echo "<td><span class='error'>N'existe pas</span></td>";
                echo "<td>N/A</td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>Actions disponibles</h2>
        <p>
            <a href="fix-infomaniak-assets.php" style="display:inline-block; background:#4CAF50; color:white; padding:10px 15px; text-decoration:none; border-radius:5px; margin-right:10px;">Réparer les assets</a>
            <a href="deploy-on-infomaniak.php" style="display:inline-block; background:#2196F3; color:white; padding:10px 15px; text-decoration:none; border-radius:5px; margin-right:10px;">Déploiement manuel</a>
            <a href="index.html" style="display:inline-block; background:#607D8B; color:white; padding:10px 15px; text-decoration:none; border-radius:5px;">Page d'accueil</a>
        </p>
    </div>
</body>
</html>
