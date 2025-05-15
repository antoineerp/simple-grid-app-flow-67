
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Fix Déploiement PHP</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 3px solid green; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 3px solid red; }
        .info { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 10px 0; }
        code { background-color: #f0f0f0; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; }
        button:hover { background-color: #45a049; }
        .card { border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>Correction du déploiement des fichiers PHP</h1>
    
    <div class="info">
        <p>Cette page permet de diagnostiquer et corriger les problèmes de déploiement des fichiers PHP vers le serveur.</p>
    </div>
    
    <div class="card">
        <h2>1. Vérifier le script de déploiement</h2>
        <?php
        $deploy_script = 'deploy-simple.sh';
        if (file_exists($deploy_script)) {
            $content = file_get_contents($deploy_script);
            $has_php_copy = strpos($content, 'find api -name "*.php"') !== false;
            
            if ($has_php_copy) {
                echo "<div class='success'>Le script de déploiement contient déjà la commande pour copier les fichiers PHP.</div>";
            } else {
                echo "<div class='error'>Le script de déploiement ne contient pas la commande explicite pour copier les fichiers PHP.</div>";
                echo "<p>Voulez-vous ajouter cette commande au script ?</p>";
                echo "<form method='post'>";
                echo "<button type='submit' name='fix_deploy_script'>Corriger le script de déploiement</button>";
                echo "</form>";
            }
        } else {
            echo "<div class='error'>Le script de déploiement n'existe pas.</div>";
        }
        
        if (isset($_POST['fix_deploy_script']) && file_exists($deploy_script)) {
            $content = file_get_contents($deploy_script);
            
            // Chercher où insérer notre code
            $position = strpos($content, "# Copie des fichiers PHP de l'API");
            
            if ($position === false) {
                // Chercher un autre point d'insertion
                $position = strpos($content, "echo \"Copie des fichiers de l'application");
                
                if ($position !== false) {
                    // Insérer après ce commentaire
                    $insert_pos = strpos($content, "\n", $position) + 1;
                    $new_content = substr($content, 0, $insert_pos);
                    $new_content .= "\n# Copie explicite des fichiers PHP de l'API\n";
                    $new_content .= "echo \"Copie des fichiers PHP de l'API...\"\n";
                    $new_content .= "if [ -d \"api\" ]; then\n";
                    $new_content .= "  find api -name \"*.php\" | while read file; do\n";
                    $new_content .= "    # Créer le dossier de destination si nécessaire\n";
                    $new_content .= "    dir_name=\$(dirname \"\$file\")\n";
                    $new_content .= "    target_dir=\"deploy/\$dir_name\"\n";
                    $new_content .= "    mkdir -p \"\$target_dir\"\n";
                    $new_content .= "    \n";
                    $new_content .= "    # Copier le fichier\n";
                    $new_content .= "    cp \"\$file\" \"deploy/\$file\"\n";
                    $new_content .= "    echo \"Copié: \$file\"\n";
                    $new_content .= "  done\n";
                    $new_content .= "  echo \"✅ Fichiers PHP de l'API copiés\"\n";
                    $new_content .= "else\n";
                    $new_content .= "  echo \"ERREUR: Dossier API non trouvé!\"\n";
                    $new_content .= "fi\n";
                    $new_content .= substr($content, $insert_pos);
                    
                    file_put_contents($deploy_script, $new_content);
                    echo "<div class='success'>Script de déploiement mis à jour avec succès!</div>";
                } else {
                    // Ajouter à la fin du fichier
                    $content .= "\n\n# Copie explicite des fichiers PHP de l'API\n";
                    $content .= "echo \"Copie des fichiers PHP de l'API...\"\n";
                    $content .= "if [ -d \"api\" ]; then\n";
                    $content .= "  find api -name \"*.php\" | while read file; do\n";
                    $content .= "    # Créer le dossier de destination si nécessaire\n";
                    $content .= "    dir_name=\$(dirname \"\$file\")\n";
                    $content .= "    target_dir=\"deploy/\$dir_name\"\n";
                    $content .= "    mkdir -p \"\$target_dir\"\n";
                    $content .= "    \n";
                    $content .= "    # Copier le fichier\n";
                    $content .= "    cp \"\$file\" \"deploy/\$file\"\n";
                    $content .= "    echo \"Copié: \$file\"\n";
                    $content .= "  done\n";
                    $content .= "  echo \"✅ Fichiers PHP de l'API copiés\"\n";
                    $content .= "else\n";
                    $content .= "  echo \"ERREUR: Dossier API non trouvé!\"\n";
                    $content .= "fi\n";
                    
                    file_put_contents($deploy_script, $content);
                    echo "<div class='success'>Script de déploiement mis à jour avec succès!</div>";
                }
            } else {
                echo "<div class='info'>Le script contient déjà une section pour copier les fichiers PHP.</div>";
            }
        }
        ?>
    </div>
    
    <div class="card">
        <h2>2. Vérifier le workflow GitHub Actions</h2>
        <?php
        $workflow_file = './.github/workflows/deploy.yml';
        $simple_workflow_file = './.github/workflows/deploy-simple.yml';
        
        $workflow_exists = file_exists($workflow_file);
        $simple_workflow_exists = file_exists($simple_workflow_file);
        
        if ($workflow_exists || $simple_workflow_exists) {
            $file_to_check = $workflow_exists ? $workflow_file : $simple_workflow_file;
            $content = file_get_contents($file_to_check);
            
            $has_php_exclude = strpos($content, '*.php') !== false && strpos($content, 'exclude') !== false;
            
            if ($has_php_exclude) {
                echo "<div class='error'>Le workflow GitHub Actions semble exclure les fichiers PHP lors du déploiement.</div>";
                echo "<p>Voulez-vous corriger cette configuration ?</p>";
                echo "<form method='post'>";
                echo "<button type='submit' name='fix_workflow'>Corriger le workflow GitHub</button>";
                echo "</form>";
            } else {
                echo "<div class='success'>Le workflow GitHub Actions ne semble pas exclure les fichiers PHP.</div>";
            }
            
            if (isset($_POST['fix_workflow'])) {
                // Remplacer l'exclusion des fichiers PHP si elle existe
                $new_content = preg_replace('/exclude:\s*\|.*?(\*.php)/s', 'exclude: |', $content);
                
                if ($new_content !== $content) {
                    file_put_contents($file_to_check, $new_content);
                    echo "<div class='success'>Exclusion des fichiers PHP retirée du workflow GitHub Actions.</div>";
                } else {
                    echo "<div class='info'>Aucune exclusion explicite des fichiers PHP n'a été trouvée.</div>";
                }
            }
        } else {
            echo "<div class='error'>Aucun fichier de workflow GitHub Actions n'a été trouvé.</div>";
        }
        ?>
    </div>
    
    <div class="card">
        <h2>3. Actions manuelles</h2>
        <p>Si le déploiement automatique ne fonctionne toujours pas, vous pouvez créer manuellement les fichiers PHP essentiels:</p>
        
        <form method='post' action='emergency-php-transfer.php'>
            <button type='submit'>Créer les fichiers PHP essentiels</button>
        </form>
        
        <p style="margin-top: 15px;">Ou lancer l'outil de création complète des fichiers API:</p>
        
        <form method='post' action='api-files-creator.php'>
            <button type='submit'>Créer tous les fichiers API</button>
        </form>
    </div>
    
    <div class="card">
        <h2>4. Test simple de PHP</h2>
        <p>Vérifiez si PHP fonctionne correctement sur votre serveur:</p>
        
        <a href="php-test-minimal.php"><button type="button">Tester PHP</button></a>
        <a href="phpinfo.php"><button type="button">Voir PHP Info</button></a>
        <a href="api/check.php"><button type="button">Tester l'API</button></a>
    </div>
</body>
</html>
