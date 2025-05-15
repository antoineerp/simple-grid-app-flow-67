
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Synchronisation depuis Infomaniak</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        h1, h2 {
            color: #333;
        }
        .card {
            background: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .button {
            background: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 10px;
        }
        .button.blue { background: #2196F3; }
        pre {
            background: #f0f0f0;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
        }
        .file-list {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #ddd;
            padding: 10px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <h1>Synchronisation depuis Infomaniak</h1>
    
    <div class="card">
        <h2>État actuel</h2>
        <?php
        $document_root = $_SERVER['DOCUMENT_ROOT'];
        echo "<p><strong>Document Root:</strong> " . htmlspecialchars($document_root) . "</p>";
        echo "<p><strong>Script Path:</strong> " . htmlspecialchars($_SERVER['SCRIPT_FILENAME']) . "</p>";
        
        // Vérifier si nous sommes sur Infomaniak
        $is_infomaniak = strpos($document_root, '/sites/qualiopi.ch') !== false || 
                        strpos($document_root, '/home/clients') !== false;
        
        if ($is_infomaniak) {
            echo "<p class='success'>✓ Détecté comme environnement Infomaniak</p>";
        } else {
            echo "<p class='error'>✗ Non détecté comme environnement Infomaniak</p>";
        }
        
        // Vérifier les dossiers critiques
        $critical_dirs = ['api', 'assets', 'public', 'dist'];
        echo "<h3>Dossiers critiques:</h3><ul>";
        
        foreach ($critical_dirs as $dir) {
            if (is_dir($dir)) {
                $files_count = count(glob("$dir/*"));
                echo "<li><strong>$dir/</strong>: <span class='success'>Existe</span> ($files_count fichiers/dossiers)</li>";
            } else {
                echo "<li><strong>$dir/</strong>: <span class='error'>N'existe pas</span></li>";
            }
        }
        echo "</ul>";
        ?>
    </div>
    
    <div class="card">
        <h2>Options de synchronisation</h2>
        
        <form method="post" action="">
            <p>Sélectionnez les dossiers à examiner:</p>
            <div>
                <label><input type="checkbox" name="dirs[]" value="api" checked> API</label><br>
                <label><input type="checkbox" name="dirs[]" value="assets" checked> Assets</label><br>
                <label><input type="checkbox" name="dirs[]" value="public"> Public</label><br>
                <label><input type="checkbox" name="dirs[]" value="dist"> Dist</label><br>
            </div>
            
            <p><button type="submit" name="analyze" class="button">Analyser les fichiers</button></p>
        </form>
        
        <?php
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['analyze'])) {
            if (!empty($_POST['dirs'])) {
                echo "<h3>Analyse des fichiers:</h3>";
                
                foreach ($_POST['dirs'] as $dir) {
                    $dir = basename($dir); // Sécurité
                    
                    if (is_dir($dir)) {
                        echo "<h4>Dossier: $dir/</h4>";
                        echo "<div class='file-list'>";
                        
                        // Récursivité pour lister tous les fichiers
                        $files = new RecursiveIteratorIterator(
                            new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS)
                        );
                        
                        $file_count = 0;
                        $file_list = [];
                        
                        foreach ($files as $file) {
                            if ($file->isFile()) {
                                $file_count++;
                                $relative_path = str_replace($document_root . '/', '', $file->getPathname());
                                $file_list[] = $relative_path . ' (' . round($file->getSize() / 1024, 2) . ' KB)';
                            }
                        }
                        
                        // Limiter l'affichage pour les performances
                        sort($file_list);
                        $max_display = 100;
                        
                        if ($file_count > 0) {
                            echo "<p>Total: $file_count fichiers trouvés";
                            if ($file_count > $max_display) {
                                echo " (affichage limité aux $max_display premiers)";
                            }
                            echo "</p><ul>";
                            
                            foreach (array_slice($file_list, 0, $max_display) as $file) {
                                echo "<li>" . htmlspecialchars($file) . "</li>";
                            }
                            
                            echo "</ul>";
                        } else {
                            echo "<p>Aucun fichier trouvé dans ce dossier.</p>";
                        }
                        
                        echo "</div>";
                    } else {
                        echo "<p><strong>$dir/</strong>: <span class='error'>Ce dossier n'existe pas</span></p>";
                    }
                }
                
                // Ajouter des instructions pour télécharger les fichiers
                echo "<h3>Comment synchroniser:</h3>";
                echo "<ol>";
                echo "<li>Utilisez un client FTP (comme FileZilla) pour vous connecter à votre serveur Infomaniak</li>";
                echo "<li>Téléchargez les dossiers listés ci-dessus vers votre environnement local</li>";
                echo "<li>Pour le dossier API, assurez-vous de préserver les fichiers de configuration importants (env.php, db_config.json, etc.)</li>";
                echo "</ol>";
                
                // Ajouter des commandes SSH si l'utilisateur a accès SSH
                echo "<h3>Pour les utilisateurs ayant accès SSH à Infomaniak:</h3>";
                echo "<pre>";
                echo "# Se connecter à votre serveur Infomaniak\n";
                echo "ssh utilisateur@votre-serveur.infomaniak.ch\n\n";
                echo "# Créer une archive des fichiers\n";
                echo "cd /sites/qualiopi.ch/\n";
                foreach ($_POST['dirs'] as $dir) {
                    $dir = basename($dir); // Sécurité
                    echo "tar -czvf $dir.tar.gz $dir/\n";
                }
                echo "\n# Télécharger les archives (depuis votre ordinateur local)\n";
                foreach ($_POST['dirs'] as $dir) {
                    $dir = basename($dir); // Sécurité
                    echo "scp utilisateur@votre-serveur.infomaniak.ch:/sites/qualiopi.ch/$dir.tar.gz .\n";
                }
                echo "</pre>";
            } else {
                echo "<p class='error'>Veuillez sélectionner au moins un dossier à analyser.</p>";
            }
        }
        ?>
    </div>
    
    <div class="card">
        <h2>Diagnostic Base de Données</h2>
        <?php
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['check_db'])) {
            echo "<h3>Informations de configuration DB:</h3>";
            
            $db_config_file = 'api/config/db_config.json';
            $env_php_file = 'api/config/env.php';
            
            if (file_exists($db_config_file)) {
                echo "<p class='success'>✓ Fichier db_config.json trouvé</p>";
                $db_config = json_decode(file_get_contents($db_config_file), true);
                if ($db_config) {
                    echo "<pre>";
                    echo "Host: " . htmlspecialchars($db_config['host']) . "\n";
                    echo "DB Name: " . htmlspecialchars($db_config['db_name']) . "\n";
                    echo "Username: " . htmlspecialchars($db_config['username']) . "\n";
                    echo "Password: " . (isset($db_config['password']) ? '********' : 'Non défini') . "\n";
                    echo "</pre>";
                } else {
                    echo "<p class='error'>Impossible de parser le fichier db_config.json</p>";
                }
            } else {
                echo "<p class='error'>✗ Fichier db_config.json non trouvé</p>";
            }
            
            if (file_exists($env_php_file)) {
                echo "<p class='success'>✓ Fichier env.php trouvé</p>";
                // Ne pas afficher le contenu pour des raisons de sécurité
                echo "<p>Le fichier env.php existe mais son contenu n'est pas affiché pour des raisons de sécurité.</p>";
            } else {
                echo "<p class='error'>✗ Fichier env.php non trouvé</p>";
            }
        }
        ?>
        
        <form method="post" action="">
            <p><button type="submit" name="check_db" class="button blue">Vérifier la configuration DB</button></p>
        </form>
    </div>
    
    <div class="card">
        <h2>Récupération de Fichiers Spécifiques</h2>
        <form method="post" action="">
            <p>Entrez le chemin du fichier à examiner:</p>
            <input type="text" name="custom_file" placeholder="api/config/db_config.json" style="width: 300px; padding: 8px;">
            <button type="submit" name="examine_file" class="button">Examiner le fichier</button>
        </form>
        
        <?php
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['examine_file']) && !empty($_POST['custom_file'])) {
            $file_path = $_POST['custom_file'];
            // Sécuriser le chemin pour éviter la traversée de répertoire
            $file_path = str_replace(['../', '..\\', '~'], '', $file_path);
            
            echo "<h3>Examen du fichier: " . htmlspecialchars($file_path) . "</h3>";
            
            if (file_exists($file_path)) {
                echo "<p class='success'>✓ Le fichier existe</p>";
                echo "<p>Taille: " . round(filesize($file_path) / 1024, 2) . " KB</p>";
                echo "<p>Dernière modification: " . date("Y-m-d H:i:s", filemtime($file_path)) . "</p>";
                
                $extension = pathinfo($file_path, PATHINFO_EXTENSION);
                if (in_array($extension, ['txt', 'log', 'htaccess', 'html', 'css', 'js', 'json', 'xml', 'md'])) {
                    echo "<h4>Contenu du fichier:</h4>";
                    echo "<pre>" . htmlspecialchars(file_get_contents($file_path)) . "</pre>";
                } elseif ($extension === 'php') {
                    echo "<p>Fichier PHP - le contenu n'est pas affiché pour des raisons de sécurité.</p>";
                } else {
                    echo "<p>Type de fichier non affichable.</p>";
                }
            } else {
                echo "<p class='error'>✗ Le fichier n'existe pas</p>";
            }
        }
        ?>
    </div>
</body>
</html>
