
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification du Déploiement</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .action-button { 
            background-color: #4CAF50; 
            color: white; 
            padding: 10px 15px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Vérification du Déploiement sur Infomaniak</h1>
        
        <div class="card">
            <h2>Informations Serveur</h2>
            <table>
                <tr><th>Variable</th><th>Valeur</th></tr>
                <tr><td>PHP Version</td><td><?php echo phpversion(); ?></td></tr>
                <tr><td>Document Root</td><td><?php echo $_SERVER['DOCUMENT_ROOT']; ?></td></tr>
                <tr><td>Current Path</td><td><?php echo getcwd(); ?></td></tr>
                <tr><td>Server Software</td><td><?php echo $_SERVER['SERVER_SOFTWARE']; ?></td></tr>
                <tr><td>HTTP Host</td><td><?php echo $_SERVER['HTTP_HOST']; ?></td></tr>
                <tr><td>Script Name</td><td><?php echo $_SERVER['SCRIPT_NAME']; ?></td></tr>
            </table>
        </div>
        
        <div class="card">
            <h2>Structure des Fichiers</h2>
            
            <?php
            // Vérification des dossiers principaux
            $directories = [
                '.' => 'Racine',
                './api' => 'API',
                './assets' => 'Assets',
                './public' => 'Public',
                './public/lovable-uploads' => 'Uploads'
            ];
            
            echo "<h3>Dossiers principaux</h3>";
            echo "<table>";
            echo "<tr><th>Chemin</th><th>Description</th><th>Statut</th><th>Droits</th><th>Contenu</th></tr>";
            
            foreach ($directories as $dir => $desc) {
                echo "<tr>";
                echo "<td>$dir</td>";
                echo "<td>$desc</td>";
                
                if (is_dir($dir)) {
                    echo "<td><span class='success'>Existe</span></td>";
                    $perms = substr(sprintf('%o', fileperms($dir)), -4);
                    echo "<td>$perms</td>";
                    
                    $files = scandir($dir);
                    $fileCount = count($files) - 2; // Moins . et ..
                    echo "<td>$fileCount fichiers</td>";
                } else {
                    echo "<td><span class='error'>N'existe pas</span></td>";
                    echo "<td>-</td><td>-</td>";
                }
                
                echo "</tr>";
            }
            
            echo "</table>";
            
            // Vérification des fichiers critiques
            $criticalFiles = [
                'index.php' => 'Redirection PHP',
                'index.html' => 'Page principale',
                '.htaccess' => 'Configuration Apache',
                'api/index.php' => 'API Endpoint',
                'api/.htaccess' => 'Configuration API',
                'api/config/db_config.json' => 'Configuration BDD',
                'api/config/env.php' => 'Variables d\'environnement',
                'diagnose-infomaniak.sh' => 'Script diagnostic',
                'user-diagnostic.php' => 'Diagnostic utilisateur',
                'deploy-on-infomaniak.php' => 'Déploiement manuel'
            ];
            
            echo "<h3>Fichiers critiques</h3>";
            echo "<table>";
            echo "<tr><th>Fichier</th><th>Description</th><th>Statut</th><th>Taille</th><th>Date modification</th></tr>";
            
            foreach ($criticalFiles as $file => $desc) {
                echo "<tr>";
                echo "<td>$file</td>";
                echo "<td>$desc</td>";
                
                if (file_exists($file)) {
                    echo "<td><span class='success'>Existe</span></td>";
                    echo "<td>" . filesize($file) . " octets</td>";
                    echo "<td>" . date("Y-m-d H:i:s", filemtime($file)) . "</td>";
                } else {
                    echo "<td><span class='error'>N'existe pas</span></td>";
                    echo "<td>-</td><td>-</td>";
                }
                
                echo "</tr>";
            }
            
            echo "</table>";
            
            // Vérification des assets
            echo "<h3>Fichiers Assets</h3>";
            $assetsDir = './assets';
            if (is_dir($assetsDir)) {
                $assets = scandir($assetsDir);
                
                echo "<table>";
                echo "<tr><th>Fichier</th><th>Taille</th><th>Type</th></tr>";
                
                foreach ($assets as $asset) {
                    if ($asset == '.' || $asset == '..') continue;
                    
                    $file = "$assetsDir/$asset";
                    $filesize = filesize($file);
                    $extension = pathinfo($file, PATHINFO_EXTENSION);
                    
                    echo "<tr>";
                    echo "<td>$asset</td>";
                    echo "<td>$filesize octets</td>";
                    echo "<td>$extension</td>";
                    echo "</tr>";
                }
                
                echo "</table>";
            } else {
                echo "<p><span class='error'>Le dossier assets n'existe pas!</span></p>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Actions disponibles</h2>
            <p>Voici les actions que vous pouvez effectuer pour résoudre les problèmes de déploiement:</p>
            
            <form method="post" action="fix-infomaniak-assets.php">
                <p><button type="submit" class="action-button">Réparer les assets</button> - Copie les assets de dist/ vers assets/ si nécessaire</p>
            </form>
            
            <p><a href="diagnose-infomaniak.php" class="action-button" style="display: inline-block; text-decoration: none;">Diagnostic complet</a> - Effectue un diagnostic approfondi du serveur</p>
            
            <p><a href="user-diagnostic.php" class="action-button" style="display: inline-block; text-decoration: none;">Diagnostic utilisateur</a> - Interface utilisateur pour le diagnostic</p>
            
            <p><a href="deploy-on-infomaniak.php" class="action-button" style="display: inline-block; text-decoration: none;">Déploiement manuel</a> - Assistant de déploiement manuel</p>
            
            <p><a href="check-github-workflow.php" class="action-button" style="display: inline-block; text-decoration: none;">Vérifier le workflow GitHub</a> - Analyse le fichier de workflow</p>
            
            <p><a href="fix-workflow-yaml.php" class="action-button" style="display: inline-block; text-decoration: none;">Réparer le workflow YAML</a> - Corrige les problèmes de syntaxe YAML dans le workflow</p>
        </div>
        
        <div class="card">
            <h2>Exécuter un script de création de dossiers</h2>
            
            <?php
            if (isset($_POST['create_directories'])) {
                echo "<h3>Création des dossiers...</h3>";
                echo "<pre>";
                
                $dirs = [
                    'api',
                    'api/config',
                    'api/controllers',
                    'api/models',
                    'api/services',
                    'assets',
                    'public',
                    'public/lovable-uploads'
                ];
                
                foreach ($dirs as $dir) {
                    if (!is_dir($dir)) {
                        if (mkdir($dir, 0755, true)) {
                            echo "✅ Dossier créé: $dir\n";
                        } else {
                            echo "❌ Erreur lors de la création du dossier: $dir\n";
                        }
                    } else {
                        echo "ℹ️ Le dossier existe déjà: $dir\n";
                    }
                }
                
                echo "</pre>";
            } else {
                ?>
                <form method="post">
                    <p>Si les dossiers nécessaires n'existent pas, vous pouvez les créer automatiquement:</p>
                    <button type="submit" name="create_directories" class="action-button">Créer les dossiers manquants</button>
                </form>
                <?php
            }
            ?>
        </div>
    </div>
</body>
</html>
