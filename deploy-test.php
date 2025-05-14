
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test du déploiement</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f9; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .section { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Test du déploiement</h1>
    
    <div class="section">
        <h2>1. Informations sur le serveur</h2>
        <?php
        echo "<table>";
        echo "<tr><th>Variable</th><th>Valeur</th></tr>";
        echo "<tr><td>Serveur</td><td>" . $_SERVER['SERVER_NAME'] . "</td></tr>";
        echo "<tr><td>Document Root</td><td>" . $_SERVER['DOCUMENT_ROOT'] . "</td></tr>";
        echo "<tr><td>Script</td><td>" . $_SERVER['PHP_SELF'] . "</td></tr>";
        echo "<tr><td>PHP Version</td><td>" . phpversion() . "</td></tr>";
        echo "<tr><td>Répertoire courant</td><td>" . getcwd() . "</td></tr>";
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>2. Vérification des fichiers clés</h2>
        <?php
        $files = [
            'index.php' => 'Point d\'entrée principal',
            'index.html' => 'Page HTML principale',
            'api/index.php' => 'Point d\'entrée API',
            'api/.htaccess' => 'Configuration API',
            'api/config/db_config.json' => 'Configuration BD',
            'mkdir_script.sh' => 'Script de création de dossiers',
            'diagnose-infomaniak.sh' => 'Script de diagnostic',
            'ssh-diagnostic.sh' => 'Script de diagnostic SSH'
        ];
        
        echo "<table>";
        echo "<tr><th>Fichier</th><th>Description</th><th>État</th><th>Taille</th><th>Dernière modification</th></tr>";
        
        foreach ($files as $file => $desc) {
            echo "<tr>";
            echo "<td>$file</td>";
            echo "<td>$desc</td>";
            
            if (file_exists($file)) {
                $size = filesize($file);
                $modified = date("Y-m-d H:i:s", filemtime($file));
                $executable = is_executable($file) ? " (exécutable)" : "";
                
                echo "<td class='success'>Existe$executable</td>";
                echo "<td>" . number_format($size) . " octets</td>";
                echo "<td>$modified</td>";
            } else {
                echo "<td class='error'>Manquant</td>";
                echo "<td>-</td>";
                echo "<td>-</td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>3. Structure des dossiers</h2>
        <?php
        $directories = [
            'api',
            'api/config',
            'api/controllers',
            'api/models',
            'assets',
            'public',
            'public/lovable-uploads',
            '.github',
            '.github/workflows'
        ];
        
        echo "<table>";
        echo "<tr><th>Dossier</th><th>État</th><th>Permissions</th></tr>";
        
        foreach ($directories as $dir) {
            echo "<tr>";
            echo "<td>$dir</td>";
            
            if (is_dir($dir)) {
                $perms = substr(sprintf('%o', fileperms($dir)), -4);
                echo "<td class='success'>Existe</td>";
                echo "<td>$perms</td>";
            } else {
                echo "<td class='error'>Manquant</td>";
                echo "<td>-</td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>4. Actions disponibles</h2>
        <p>Choisissez une action à effectuer :</p>
        
        <ul>
            <li><a href="create-mkdir-script.php">Créer/Exécuter le script mkdir_script.sh</a></li>
            <li><a href="api-htaccess-creator.php">Créer le fichier api/.htaccess</a></li>
            <li><a href="phpinfo.php">Afficher les informations PHP (phpinfo)</a></li>
            
            <?php if (file_exists('diagnose-infomaniak.php')): ?>
            <li><a href="diagnose-infomaniak.php">Lancer le diagnostic Infomaniak</a></li>
            <?php else: ?>
            <li class="warning">Le fichier de diagnostic Infomaniak n'est pas disponible</li>
            <?php endif; ?>
        </ul>
        
        <p>Instructions pour SSH :</p>
        <pre>
# Se connecter au serveur
ssh votre_utilisateur@ssh.cluster.infomaniak.ch

# Naviguer vers le répertoire du site
cd /home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch

# Rendre les scripts exécutables
chmod +x *.sh

# Exécuter le script de diagnostic
./ssh-diagnostic.sh

# Créer les dossiers manquants
./mkdir_script.sh
</pre>
    </div>
</body>
</html>
